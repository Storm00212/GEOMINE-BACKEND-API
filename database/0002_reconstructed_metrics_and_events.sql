-- ================================================
-- GEOMINE — reconstructed metrics & events
--
-- The original 0002_generator_metrics.sql / 0003_engine_metrics_and_events.sql
-- migrations that full-neon-mvp.sql (line ~331) and _provision.mjs reference
-- are NOT present anywhere in this repository — the only reference to them
-- is a hardcoded Windows temp path in _provision.mjs from a contributor's
-- machine. This file is a BEST-EFFORT RECONSTRUCTION, built from:
--   - the TypeScript contracts in lib/modules/metrics/*, types/database.ts
--   - the exact SQL function signatures called in metrics.repository.ts
--   - the plain-English metric descriptions in README.md
--
-- Table/column/function SHAPES match the application code's contract
-- exactly (every consumer was checked). The heuristic FORMULAS inside
-- (thermal_stress_index, health_index, maintenance_priority_score,
-- power_factor_trend, overload/idle duration, maintenance_recommendation)
-- are original work matching the README's documented intent, not recovered
-- originals — validate the exact thresholds/weights before trusting them
-- the way the README already asks you to treat any heuristic.
-- ================================================

-- ---------- parameter_definitions: is_cumulative + 3 more parameters ----------
alter table parameter_definitions add column if not exists is_cumulative boolean not null default false;

insert into parameter_definitions (machine_type, key, label, unit, min_expected, max_expected, sort_order, is_cumulative) values
  ('generator', 'coolant_temp', 'Coolant Temp', '°C', 60, 100, 6, false),
  ('generator', 'fuel_level', 'Fuel Level', 'L', 0, null, 7, false),
  ('generator', 'engine_hours', 'Engine Hours', 'hrs', 0, null, 8, true)
on conflict (machine_type, key) do nothing;

-- ---------- readings: GPS columns the service layer already writes ----------
alter table readings add column if not exists latitude numeric;
alter table readings add column if not exists longitude numeric;
alter table readings add column if not exists location_accuracy_m numeric;

-- ---------- refuel_events / fault_events ----------
create table if not exists refuel_events (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid references machines(id) on delete cascade not null,
  liters_added numeric not null check (liters_added > 0),
  recorded_at timestamptz not null default now(),
  entered_by uuid not null,
  notes text,
  created_at timestamptz default now()
);
create index if not exists idx_refuel_machine_time on refuel_events (machine_id, recorded_at desc);

create table if not exists fault_events (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid references machines(id) on delete cascade not null,
  code text not null,
  description text,
  resolved boolean not null default false,
  resolved_at timestamptz,
  recorded_at timestamptz not null default now(),
  entered_by uuid not null,
  created_at timestamptz default now()
);
create index if not exists idx_fault_machine_time on fault_events (machine_id, recorded_at desc);

-- ================================================
-- Functions — standard physics
-- ================================================

create or replace function get_frequency_hz(p_machine_id uuid, p_at timestamptz default now())
returns numeric language sql stable as $$
  select round((r.value * ms.value) / 120.0, 2)
  from readings r
  join parameter_definitions p on p.id = r.parameter_id and p.key = 'speed_rpm'
  join machine_specs ms on ms.machine_id = r.machine_id and ms.key = 'poles'
  where r.machine_id = p_machine_id and r.recorded_at <= p_at
  order by r.recorded_at desc limit 1;
$$;

create or replace function get_apparent_power_kva(p_machine_id uuid, p_at timestamptz default now())
returns numeric language plpgsql stable as $$
declare
  latest_voltage numeric;
  latest_current numeric;
  phase text;
begin
  select r.value into latest_voltage from readings r join parameter_definitions p on p.id = r.parameter_id
    where r.machine_id = p_machine_id and p.key = 'voltage' and r.recorded_at <= p_at
    order by r.recorded_at desc limit 1;
  select r.value into latest_current from readings r join parameter_definitions p on p.id = r.parameter_id
    where r.machine_id = p_machine_id and p.key = 'output_current' and r.recorded_at <= p_at
    order by r.recorded_at desc limit 1;
  select phase_type into phase from machines where id = p_machine_id;

  if latest_voltage is null or latest_current is null then return null; end if;

  if phase = 'three_phase' then
    return round((sqrt(3::numeric) * latest_voltage * latest_current) / 1000, 2);
  else
    return round((latest_voltage * latest_current) / 1000, 2);
  end if;
end;
$$;

create or replace function get_real_power_kw(p_machine_id uuid, p_at timestamptz default now())
returns numeric language plpgsql stable as $$
declare
  kva numeric;
  pf numeric;
begin
  kva := get_apparent_power_kva(p_machine_id, p_at);
  select r.value into pf from readings r join parameter_definitions p on p.id = r.parameter_id
    where r.machine_id = p_machine_id and p.key = 'power_factor' and r.recorded_at <= p_at
    order by r.recorded_at desc limit 1;
  if kva is null or pf is null then return null; end if;
  return round(kva * pf, 2);
end;
$$;

-- ================================================
-- Functions — heuristics (not validated against real failure history)
-- ================================================

create or replace function get_thermal_stress_index(p_machine_id uuid, p_at timestamptz default now())
returns numeric language plpgsql stable as $$
declare
  latest_temp numeric;
  normal_temp numeric;
  max_temp numeric;
begin
  select r.value into latest_temp from readings r join parameter_definitions p on p.id = r.parameter_id
    where r.machine_id = p_machine_id and p.key = 'bearing_temp' and r.recorded_at <= p_at
    order by r.recorded_at desc limit 1;
  select value into normal_temp from machine_specs where machine_id = p_machine_id and key = 'rated_temp_normal';
  select value into max_temp from machine_specs where machine_id = p_machine_id and key = 'rated_temp_max';

  if latest_temp is null or normal_temp is null or max_temp is null or max_temp <= normal_temp then
    return null;
  end if;

  return round(greatest(0, least(100, ((latest_temp - normal_temp) / (max_temp - normal_temp)) * 100)), 2);
end;
$$;

create or replace function get_health_index(p_machine_id uuid, p_at timestamptz default now())
returns numeric language plpgsql stable as $$
declare
  thermal numeric;
  flagged_ratio numeric;
  open_faults int;
  health numeric := 100;
begin
  thermal := get_thermal_stress_index(p_machine_id, p_at);

  select case when count(*) = 0 then 0 else count(*) filter (where flagged)::numeric / count(*) end
  into flagged_ratio
  from (
    select flagged from readings where machine_id = p_machine_id and recorded_at <= p_at
    order by recorded_at desc limit 20
  ) recent;

  select count(*) into open_faults from fault_events
    where machine_id = p_machine_id and resolved = false and recorded_at <= p_at;

  if thermal is not null then
    health := health - (thermal * 0.4);
  end if;
  health := health - (coalesce(flagged_ratio, 0) * 30);
  health := health - least(open_faults * 10, 30);

  return round(greatest(0, least(100, health)), 2);
end;
$$;

create or replace function get_maintenance_priority_score(p_machine_id uuid)
returns numeric language plpgsql stable as $$
declare
  health numeric;
  open_faults int;
begin
  health := get_health_index(p_machine_id);
  select count(*) into open_faults from fault_events where machine_id = p_machine_id and resolved = false;
  if health is null then return null; end if;
  return round((100 - health) + (open_faults * 5), 2);
end;
$$;

create or replace function get_overload_duration_minutes(p_machine_id uuid, p_from timestamptz default null, p_to timestamptz default null)
returns table(overload_minutes numeric, sample_count int)
language sql stable as $$
  with rated as (
    select value as rated_current from machine_specs where machine_id = p_machine_id and key = 'rated_current'
  ),
  cur_readings as (
    select r.value, r.recorded_at, lead(r.recorded_at) over (order by r.recorded_at) as next_at
    from readings r
    join parameter_definitions p on p.id = r.parameter_id and p.key = 'output_current'
    where r.machine_id = p_machine_id
      and (p_from is null or r.recorded_at >= p_from)
      and (p_to is null or r.recorded_at <= p_to)
  )
  select
    coalesce(sum(
      case when next_at is not null and value > (select rated_current from rated)
        then extract(epoch from (next_at - recorded_at)) / 60
        else 0
      end
    ), 0)::numeric,
    count(*)::int
  from cur_readings;
$$;

create or replace function get_idle_duration_minutes(p_machine_id uuid, p_from timestamptz default null, p_to timestamptz default null, p_idle_pct numeric default 10)
returns table(idle_minutes numeric, sample_count int)
language sql stable as $$
  with rated as (
    select value as rated_current from machine_specs where machine_id = p_machine_id and key = 'rated_current'
  ),
  cur_readings as (
    select r.value, r.recorded_at, lead(r.recorded_at) over (order by r.recorded_at) as next_at
    from readings r
    join parameter_definitions p on p.id = r.parameter_id and p.key = 'output_current'
    where r.machine_id = p_machine_id
      and (p_from is null or r.recorded_at >= p_from)
      and (p_to is null or r.recorded_at <= p_to)
  )
  select
    coalesce(sum(
      case when next_at is not null and value < (select rated_current from rated) * (p_idle_pct / 100.0)
        then extract(epoch from (next_at - recorded_at)) / 60
        else 0
      end
    ), 0)::numeric,
    count(*)::int
  from cur_readings;
$$;

create or replace function get_power_factor_trend(p_machine_id uuid, p_from timestamptz default null, p_to timestamptz default null)
returns table(slope_per_day numeric, direction text, sample_count int)
language plpgsql stable as $$
declare
  n int;
  slope numeric;
begin
  select count(*) into n
  from readings r join parameter_definitions p on p.id = r.parameter_id and p.key = 'power_factor'
  where r.machine_id = p_machine_id
    and (p_from is null or r.recorded_at >= p_from)
    and (p_to is null or r.recorded_at <= p_to);

  if n < 2 then
    return query select null::numeric, 'insufficient_data'::text, n;
    return;
  end if;

  select regr_slope(r.value, extract(epoch from r.recorded_at) / 86400.0) into slope
  from readings r join parameter_definitions p on p.id = r.parameter_id and p.key = 'power_factor'
  where r.machine_id = p_machine_id
    and (p_from is null or r.recorded_at >= p_from)
    and (p_to is null or r.recorded_at <= p_to);

  return query select
    round(slope::numeric, 5),
    case when slope > 0.001 then 'improving' when slope < -0.001 then 'declining' else 'stable' end,
    n;
end;
$$;

create or replace function get_estimated_rul(p_machine_id uuid)
returns table(status text, note text)
language sql stable as $$
  select 'insufficient_data'::text,
    'Remaining useful life requires a degradation curve calibrated against real historical failure data, which does not exist yet.'::text;
$$;

create or replace function get_specific_fuel_consumption(p_machine_id uuid, p_from timestamptz default null, p_to timestamptz default null)
returns table(liters_consumed numeric, kwh_generated numeric, l_per_kwh numeric, note text)
language plpgsql stable as $$
declare
  refuel_total numeric;
  fuel_start numeric;
  fuel_end numeric;
  net_drop numeric;
  consumed numeric;
  hours_start numeric;
  hours_end numeric;
  avg_kw numeric;
  kwh numeric;
begin
  select coalesce(sum(liters_added), 0) into refuel_total
  from refuel_events where machine_id = p_machine_id
    and (p_from is null or recorded_at >= p_from) and (p_to is null or recorded_at <= p_to);

  select r.value into fuel_start from readings r join parameter_definitions p on p.id = r.parameter_id and p.key = 'fuel_level'
    where r.machine_id = p_machine_id and (p_from is null or r.recorded_at >= p_from) and (p_to is null or r.recorded_at <= p_to)
    order by r.recorded_at asc limit 1;
  select r.value into fuel_end from readings r join parameter_definitions p on p.id = r.parameter_id and p.key = 'fuel_level'
    where r.machine_id = p_machine_id and (p_from is null or r.recorded_at >= p_from) and (p_to is null or r.recorded_at <= p_to)
    order by r.recorded_at desc limit 1;

  if fuel_start is null or fuel_end is null then
    return query select null::numeric, null::numeric, null::numeric, 'Not enough fuel-level readings in range'::text;
    return;
  end if;

  net_drop := fuel_start - fuel_end;
  consumed := refuel_total + net_drop;

  if consumed < 0 then
    return query select null::numeric, null::numeric, null::numeric,
      'Fuel level rose more than logged refuels explain — check for an unlogged refuel'::text;
    return;
  end if;

  select r.value into hours_start from readings r join parameter_definitions p on p.id = r.parameter_id and p.key = 'engine_hours'
    where r.machine_id = p_machine_id and (p_from is null or r.recorded_at >= p_from) and (p_to is null or r.recorded_at <= p_to)
    order by r.recorded_at asc limit 1;
  select r.value into hours_end from readings r join parameter_definitions p on p.id = r.parameter_id and p.key = 'engine_hours'
    where r.machine_id = p_machine_id and (p_from is null or r.recorded_at >= p_from) and (p_to is null or r.recorded_at <= p_to)
    order by r.recorded_at desc limit 1;

  avg_kw := get_real_power_kw(p_machine_id, coalesce(p_to, now()));

  if hours_start is null or hours_end is null or hours_end <= hours_start or avg_kw is null then
    return query select round(consumed, 2), null::numeric, null::numeric, 'No engine-hours/power data in range to compute kWh'::text;
    return;
  end if;

  kwh := (hours_end - hours_start) * avg_kw;

  if kwh = 0 then
    return query select round(consumed, 2), 0::numeric, null::numeric, 'No runtime in range to compute kWh'::text;
    return;
  end if;

  return query select round(consumed, 2), round(kwh, 2), round(consumed / kwh, 4), ''::text;
end;
$$;

create or replace function get_maintenance_recommendation(p_machine_id uuid, p_sample_size int default 10)
returns table(status text, confidence text, reasons text[], sample_count int, avg_interval_hours numeric)
language plpgsql stable as $$
declare
  visits timestamptz[];
  visit_count int;
  flagged_visits int;
  health numeric;
  thermal numeric;
  open_faults int;
  reasons_arr text[] := '{}';
  most_recent timestamptz;
  avg_interval numeric;
  result_status text;
  result_confidence text;
begin
  select array_agg(distinct recorded_at order by recorded_at desc)
  into visits
  from (
    select recorded_at from readings where machine_id = p_machine_id
    order by recorded_at desc limit (p_sample_size * 10)
  ) x;

  if visits is null or array_length(visits, 1) = 0 then
    return query select 'insufficient_data'::text, 'low'::text,
      ARRAY['No readings logged for this machine yet']::text[], 0, null::numeric;
    return;
  end if;

  visits := visits[1 : least(array_length(visits, 1), p_sample_size)];
  visit_count := array_length(visits, 1);
  most_recent := visits[1];

  if visit_count < 3 then
    return query select 'insufficient_data'::text, 'low'::text,
      ARRAY['Only ' || visit_count::text || ' logging visit(s) recorded — need at least 3']::text[], visit_count, null::numeric;
    return;
  end if;

  select count(distinct recorded_at) into flagged_visits
  from readings where machine_id = p_machine_id and flagged = true and recorded_at = any(visits);

  health := get_health_index(p_machine_id);
  thermal := get_thermal_stress_index(p_machine_id);
  select count(*) into open_faults from fault_events where machine_id = p_machine_id and resolved = false;

  avg_interval := extract(epoch from (visits[1] - visits[visit_count])) / 3600.0 / greatest(visit_count - 1, 1);

  if open_faults > 0 then
    reasons_arr := reasons_arr || (open_faults::text || ' unresolved fault event(s)');
  end if;
  if thermal is not null and thermal >= 80 then
    reasons_arr := reasons_arr || ('Thermal stress index at ' || thermal::text || ' (>= 80)');
  end if;
  if health is not null and health < 50 then
    reasons_arr := reasons_arr || ('Health index at ' || health::text || ' (< 50)');
  end if;
  if flagged_visits::numeric / visit_count > 0.3 then
    reasons_arr := reasons_arr || (flagged_visits::text || ' of last ' || visit_count::text || ' visits had flagged readings');
  end if;

  if (health is not null and health < 50) or (thermal is not null and thermal >= 80) or open_faults > 0 then
    result_status := 'needs_maintenance';
  elsif (health is not null and health < 70) or (flagged_visits::numeric / visit_count > 0.3) then
    result_status := 'watch';
  else
    result_status := 'healthy';
    reasons_arr := ARRAY['No flagged readings, faults, or elevated thermal/health signals in the recent visit history'];
  end if;

  if visit_count >= 8 and most_recent >= now() - interval '7 days' then
    result_confidence := 'high';
  elsif visit_count >= 3 then
    result_confidence := 'medium';
  else
    result_confidence := 'low';
  end if;

  return query select result_status, result_confidence, reasons_arr, visit_count, round(avg_interval, 2);
end;
$$;

-- ================================================
-- generator_health_snapshot — full rewrite to match GeneratorHealthSnapshot
-- (lib/modules/metrics/metrics.service.ts)
-- ================================================

drop view if exists generator_health_snapshot;

create or replace view generator_health_snapshot
with (security_invoker = true) as
select
  m.id as machine_id,
  m.name,
  m.status,
  m.phase_type,
  (select r.value from readings r join parameter_definitions p on p.id = r.parameter_id
     where r.machine_id = m.id and p.key = 'output_current' order by r.recorded_at desc limit 1) as latest_current,
  (select r.value from readings r join parameter_definitions p on p.id = r.parameter_id
     where r.machine_id = m.id and p.key = 'bearing_temp' order by r.recorded_at desc limit 1) as latest_bearing_temp,
  (select r.value from readings r join parameter_definitions p on p.id = r.parameter_id
     where r.machine_id = m.id and p.key = 'coolant_temp' order by r.recorded_at desc limit 1) as latest_coolant_temp,
  (select r.value from readings r join parameter_definitions p on p.id = r.parameter_id
     where r.machine_id = m.id and p.key = 'power_factor' order by r.recorded_at desc limit 1) as latest_power_factor,
  (select r.value from readings r join parameter_definitions p on p.id = r.parameter_id
     where r.machine_id = m.id and p.key = 'fuel_level' order by r.recorded_at desc limit 1) as latest_fuel_level,
  (select r.value from readings r join parameter_definitions p on p.id = r.parameter_id
     where r.machine_id = m.id and p.key = 'engine_hours' order by r.recorded_at desc limit 1) as latest_engine_hours,
  (select count(*) from fault_events where machine_id = m.id and resolved = false) as open_fault_count,
  (select r.recorded_at from readings r where r.machine_id = m.id order by r.recorded_at desc limit 1) as last_reading_at,
  get_generator_loading(m.id) as loading_pct,
  get_apparent_power_kva(m.id) as apparent_power_kva,
  get_real_power_kw(m.id) as real_power_kw,
  get_frequency_hz(m.id) as frequency_hz,
  get_thermal_stress_index(m.id) as thermal_stress_index,
  get_health_index(m.id) as health_index,
  get_maintenance_priority_score(m.id) as maintenance_priority_score
from machines m;

-- End
