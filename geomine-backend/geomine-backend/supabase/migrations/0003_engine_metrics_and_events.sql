-- =========================================================
-- Geomine PMS — Engine Parameters, Event Logs, and
-- Maintenance Recommendation Engine
-- Based on the on-site engineer's parameter list and the
-- Kohler-SDMO J60UM class genset spec sheet.
-- =========================================================

-- ---------- Cumulative (odometer-style) parameter support ----------
-- engine_hours and kwh_cumulative should only ever increase. Rather than
-- special-casing each one, this flag lets the existing flagging trigger
-- catch any cumulative reading that comes in lower than the previous one
-- for that machine (meter reset or data-entry error) the same way it
-- already catches out-of-range values — flag for review, don't block.
alter table parameter_definitions add column is_cumulative boolean not null default false;

create or replace function flag_out_of_range_reading()
returns trigger as $$
declare
  v_min numeric;
  v_max numeric;
  v_cumulative boolean;
  v_prior_value numeric;
begin
  select min_expected, max_expected, is_cumulative
    into v_min, v_max, v_cumulative
  from parameter_definitions where id = new.parameter_id;

  new.flagged := false;

  if v_min is not null and new.value < v_min then
    new.flagged := true;
  elsif v_max is not null and new.value > v_max then
    new.flagged := true;
  end if;

  if v_cumulative then
    select value into v_prior_value
    from readings
    where machine_id = new.machine_id
      and parameter_id = new.parameter_id
      and recorded_at < new.recorded_at
      and id <> new.id
    order by recorded_at desc
    limit 1;

    if v_prior_value is not null and new.value < v_prior_value then
      new.flagged := true;
    end if;
  end if;

  return new;
end;
$$ language plpgsql;

-- ---------- New generator parameters ----------
-- Units/bounds noted where the spec sheet or physical constraints give us
-- a real number; left null where they don't, rather than guessing.
insert into parameter_definitions (machine_type, key, label, unit, sort_order, is_cumulative, min_expected, max_expected) values
  ('generator', 'engine_hours', 'Engine Hours', 'hr', 6, true, 0, null),
  ('generator', 'fuel_level', 'Fuel Level', 'L', 7, false, 0, 190), -- 190L tank per spec sheet
  -- Unit assumed as bar (Kohler-SDMO is a European manufacturer) — confirm
  -- against the actual engine manual and correct if the gauge reads psi.
  ('generator', 'oil_pressure', 'Oil Pressure', 'bar', 8, false, null, null),
  ('generator', 'coolant_temp', 'Coolant Temperature', '°C', 9, false, null, null),
  ('generator', 'battery_voltage', 'Battery Voltage', 'V', 10, false, null, null),
  ('generator', 'kw_output', 'kW Output (panel reading)', 'kW', 11, false, null, null),
  ('generator', 'kwh_cumulative', 'kWh Cumulative (panel reading)', 'kWh', 12, true, 0, null);

-- Hydraulic pressure: nothing in this genset's spec suggests a hydraulic
-- system (electric-start canopy unit, no hydraulic accessories listed).
-- Added inactive so it doesn't appear on the entry form, but easy to
-- activate later if a machine turns out to have one.
insert into parameter_definitions (machine_type, key, label, unit, sort_order, active) values
  ('generator', 'hydraulic_pressure', 'Hydraulic Pressure', 'bar', 13, false);

-- ---------- GPS metadata on readings ----------
-- These generators are fixed at a site, so per-reading GPS isn't really
-- about "where is the machine" (machines.location already covers that) —
-- it's closer to a data-integrity signal that the engineer was physically
-- on-site when logging. Nullable and unvalidated beyond basic range
-- checks; the frontend should capture this silently and never block a
-- submission over a denied location permission or bad signal.
alter table readings add column latitude numeric;
alter table readings add column longitude numeric;
alter table readings add column location_accuracy_m numeric;

alter table readings add constraint chk_latitude check (latitude is null or latitude between -90 and 90);
alter table readings add constraint chk_longitude check (longitude is null or longitude between -180 and 180);

-- =========================================================
-- Refuel events
-- Tracked separately from fuel_level readings because fuel level is
-- non-monotonic (drops with consumption, jumps on refuel) — you can't
-- compute consumption from the level readings alone without knowing
-- when and how much fuel was added back in.
-- =========================================================
create table refuel_events (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid references machines(id) on delete cascade not null,
  liters_added numeric not null check (liters_added > 0),
  recorded_at timestamptz not null default now(),
  entered_by uuid references auth.users(id) not null,
  notes text,
  created_at timestamptz default now()
);

create index idx_refuel_machine_time on refuel_events (machine_id, recorded_at desc);

create trigger trg_prevent_future_refuel
  before insert or update of recorded_at on refuel_events
  for each row execute function prevent_future_readings();

alter table refuel_events enable row level security;

create policy "log refuel events"
on refuel_events for insert
with check (entered_by = auth.uid() and current_user_role() in ('miner','it','admin'));

create policy "read refuel events"
on refuel_events for select
using (entered_by = auth.uid() or current_user_role() in ('it','admin'));

create policy "it and admin correct refuel events"
on refuel_events for update
using (current_user_role() in ('it','admin'));

create policy "admin delete refuel events"
on refuel_events for delete
using (current_user_role() = 'admin');

-- =========================================================
-- Fault events
-- Discrete categorical events (fault codes), not continuous values, so
-- they don't belong in `readings` — forcing them in there would break
-- every numeric stats function. This has a lifecycle (resolved/not) that
-- plain readings don't need.
-- =========================================================
create table fault_events (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid references machines(id) on delete cascade not null,
  code text not null,
  description text,
  resolved boolean not null default false,
  resolved_at timestamptz,
  recorded_at timestamptz not null default now(),
  entered_by uuid references auth.users(id) not null,
  created_at timestamptz default now()
);

create index idx_fault_machine_time on fault_events (machine_id, recorded_at desc);
create index idx_fault_unresolved on fault_events (machine_id) where not resolved;

create trigger trg_prevent_future_fault
  before insert or update of recorded_at on fault_events
  for each row execute function prevent_future_readings();

alter table fault_events enable row level security;

create policy "log fault events"
on fault_events for insert
with check (entered_by = auth.uid() and current_user_role() in ('miner','it','admin'));

create policy "read fault events"
on fault_events for select
using (entered_by = auth.uid() or current_user_role() in ('it','admin'));

create policy "it and admin update fault events"
on fault_events for update
using (current_user_role() in ('it','admin'));

create policy "admin delete fault events"
on fault_events for delete
using (current_user_role() = 'admin');

-- =========================================================
-- Specific fuel consumption (L/kWh) — a real efficiency metric, unlike
-- the power-factor-trend proxy used before. Handles refuels correctly:
-- consumed = (fuel_start - fuel_end) + refuels_added_in_window.
-- Returns a note explaining why, rather than a number, whenever the
-- inputs don't support a trustworthy result (missing readings, no
-- generation in the window, or fuel rising faster than logged refuels
-- explain — which points at a missing refuel entry, not a real result).
-- =========================================================
create or replace function get_specific_fuel_consumption(
  p_machine_id uuid,
  p_from timestamptz default now() - interval '30 days',
  p_to timestamptz default now()
)
returns table (
  liters_consumed numeric,
  kwh_generated numeric,
  l_per_kwh numeric,
  note text
)
language plpgsql
stable
as $$
declare
  v_fuel_start numeric;
  v_fuel_end numeric;
  v_refuels numeric;
  v_kwh_start numeric;
  v_kwh_end numeric;
  v_liters_consumed numeric;
  v_kwh_generated numeric;
begin
  select r.value into v_fuel_start
  from readings r join parameter_definitions p on p.id = r.parameter_id
  where r.machine_id = p_machine_id and p.key = 'fuel_level'
    and r.recorded_at between p_from and p_to
  order by r.recorded_at asc limit 1;

  select r.value into v_fuel_end
  from readings r join parameter_definitions p on p.id = r.parameter_id
  where r.machine_id = p_machine_id and p.key = 'fuel_level'
    and r.recorded_at between p_from and p_to
  order by r.recorded_at desc limit 1;

  select coalesce(sum(liters_added), 0) into v_refuels
  from refuel_events
  where machine_id = p_machine_id and recorded_at between p_from and p_to;

  select r.value into v_kwh_start
  from readings r join parameter_definitions p on p.id = r.parameter_id
  where r.machine_id = p_machine_id and p.key = 'kwh_cumulative'
    and r.recorded_at between p_from and p_to
  order by r.recorded_at asc limit 1;

  select r.value into v_kwh_end
  from readings r join parameter_definitions p on p.id = r.parameter_id
  where r.machine_id = p_machine_id and p.key = 'kwh_cumulative'
    and r.recorded_at between p_from and p_to
  order by r.recorded_at desc limit 1;

  if v_fuel_start is null or v_fuel_end is null or v_kwh_start is null or v_kwh_end is null then
    return query select null::numeric, null::numeric, null::numeric,
      'Not enough fuel_level and kwh_cumulative readings in this window yet.'::text;
    return;
  end if;

  v_liters_consumed := (v_fuel_start - v_fuel_end) + v_refuels;
  v_kwh_generated := v_kwh_end - v_kwh_start;

  if v_kwh_generated <= 0 then
    return query select v_liters_consumed, v_kwh_generated, null::numeric,
      'No kWh generation recorded in this window.'::text;
    return;
  end if;

  if v_liters_consumed < 0 then
    return query select v_liters_consumed, v_kwh_generated, null::numeric,
      'Fuel level rose more than logged refuels explain — check refuel_events for a missing entry.'::text;
    return;
  end if;

  return query select
    round(v_liters_consumed, 2),
    round(v_kwh_generated, 2),
    round(v_liters_consumed / v_kwh_generated, 3),
    'ok'::text;
end;
$$;

-- ---------- Idle duration ----------
-- Mirrors get_overload_duration_minutes from the previous migration,
-- inverted: sums time where load was at/below an idle threshold
-- (default 5% of rated current) instead of above it. Same step-function
-- assumption and same under-counting limitation for gaps between manual
-- readings — see that function's comment for the full explanation.
create or replace function get_idle_duration_minutes(
  p_machine_id uuid,
  p_from timestamptz default now() - interval '30 days',
  p_to timestamptz default now(),
  p_idle_threshold_pct numeric default 5
)
returns table (
  idle_minutes numeric,
  sample_count bigint
)
language sql
stable
as $$
  with rated as (
    select value as rated_current from machine_specs
    where machine_id = p_machine_id and key = 'rated_current'
  ),
  ordered as (
    select
      r.value,
      r.recorded_at,
      lead(r.recorded_at) over (order by r.recorded_at) as next_recorded_at
    from readings r
    join parameter_definitions p on p.id = r.parameter_id
    where r.machine_id = p_machine_id
      and p.key = 'output_current'
      and r.recorded_at between p_from and p_to
  )
  select
    coalesce(round(sum(
      case when value <= (select rated_current from rated) * (p_idle_threshold_pct / 100.0)
        then extract(epoch from (coalesce(next_recorded_at, p_to) - recorded_at)) / 60
        else 0
      end
    ), 1), 0) as idle_minutes,
    count(*) as sample_count
  from ordered;
$$;

-- =========================================================
-- Maintenance recommendation engine
-- Rule-based and fully explainable — NOT a statistical or ML prediction.
-- It checks the last N logged *visits* (distinct recorded_at timestamps,
-- since one site visit logs several parameters at once — using raw rows
-- would mostly measure gaps of zero between values from the same visit)
-- against known thresholds and the existing health_index/thermal_stress
-- heuristics, and returns which specific conditions triggered the result.
-- This is the same kind of threshold/trend rule that real condition-based
-- maintenance alerting runs on — useful for triage, not a diagnosis.
-- Thresholds below are a reasonable starting point; expect to tune them
-- once Geomine's engineers have seen how it performs against real machines.
-- =========================================================
create or replace function get_maintenance_recommendation(
  p_machine_id uuid,
  p_sample_size int default 10
)
returns table (
  status text,
  confidence text,
  reasons text[],
  sample_count bigint,
  avg_interval_hours numeric
)
language plpgsql
stable
as $$
declare
  v_sample_count bigint;
  v_avg_interval_hours numeric;
  v_flagged_visits bigint;
  v_health numeric;
  v_thermal numeric;
  v_reasons text[] := array[]::text[];
  v_status text;
  v_confidence text;
begin
  with recent_visits as (
    select distinct recorded_at
    from readings
    where machine_id = p_machine_id
    order by recorded_at desc
    limit p_sample_size
  ),
  visit_flags as (
    select r.recorded_at, bool_or(r.flagged) as any_flagged
    from readings r
    where r.machine_id = p_machine_id
      and r.recorded_at in (select recorded_at from recent_visits)
    group by r.recorded_at
  ),
  gaps as (
    select recorded_at, lag(recorded_at) over (order by recorded_at) as prev_recorded_at
    from recent_visits
  )
  select
    (select count(*) from recent_visits),
    (select count(*) from visit_flags where any_flagged),
    (select avg(extract(epoch from (recorded_at - prev_recorded_at)) / 3600)
       from gaps where prev_recorded_at is not null)
  into v_sample_count, v_flagged_visits, v_avg_interval_hours;

  if v_sample_count < 3 then
    return query select
      'insufficient_data'::text,
      'low'::text,
      array['Fewer than 3 logged visits for this machine so far — not enough history for an assessment.']::text[],
      v_sample_count,
      v_avg_interval_hours;
    return;
  end if;

  v_health := get_health_index(p_machine_id);
  v_thermal := get_thermal_stress_index(p_machine_id);

  -- Tier 1: conditions serious enough to recommend maintenance now.
  if v_flagged_visits >= 3 then
    v_reasons := v_reasons || format('%s of the last %s logged visits had at least one out-of-range reading', v_flagged_visits, v_sample_count);
  end if;
  if v_health is not null and v_health < 50 then
    v_reasons := v_reasons || format('Health index is low (%s/100)', v_health);
  end if;
  if v_thermal is not null and v_thermal >= 100 then
    v_reasons := v_reasons || format('Thermal stress index is at or above the rated limit (%s%%)', v_thermal);
  end if;

  if cardinality(v_reasons) > 0 then
    v_status := 'needs_maintenance';
  else
    -- Tier 2: worth watching, not yet urgent.
    if v_flagged_visits >= 1 then
      v_reasons := v_reasons || format('%s of the last %s logged visits had at least one out-of-range reading', v_flagged_visits, v_sample_count);
    end if;
    if v_health is not null and v_health < 70 then
      v_reasons := v_reasons || format('Health index is trending low (%s/100)', v_health);
    end if;
    if v_thermal is not null and v_thermal >= 80 then
      v_reasons := v_reasons || format('Thermal stress index is elevated (%s%%)', v_thermal);
    end if;

    if cardinality(v_reasons) > 0 then
      v_status := 'watch';
    else
      v_status := 'healthy';
      v_reasons := array['No out-of-range readings and no elevated risk indicators in the recent history.'];
    end if;
  end if;

  -- Confidence reflects how much and how recent the data actually is — a
  -- recommendation from 10 visits a day apart is worth more than 10
  -- visits spread across two months.
  if v_sample_count >= p_sample_size and v_avg_interval_hours is not null and v_avg_interval_hours <= 48 then
    v_confidence := 'high';
  elsif v_sample_count >= 5 then
    v_confidence := 'medium';
  else
    v_confidence := 'low';
  end if;

  return query select v_status, v_confidence, v_reasons, v_sample_count, v_avg_interval_hours;
end;
$$;

-- =========================================================
-- Expand the fleet dashboard view with the new engine data
-- =========================================================
drop view if exists generator_health_snapshot;

create view generator_health_snapshot
with (security_invoker = true) as
select
  m.id as machine_id,
  m.name,
  m.status,
  m.phase_type,
  (
    select r.value from readings r
    join parameter_definitions p on p.id = r.parameter_id
    where r.machine_id = m.id and p.key = 'output_current'
    order by r.recorded_at desc limit 1
  ) as latest_current,
  (
    select r.value from readings r
    join parameter_definitions p on p.id = r.parameter_id
    where r.machine_id = m.id and p.key = 'bearing_temp'
    order by r.recorded_at desc limit 1
  ) as latest_bearing_temp,
  (
    select r.value from readings r
    join parameter_definitions p on p.id = r.parameter_id
    where r.machine_id = m.id and p.key = 'coolant_temp'
    order by r.recorded_at desc limit 1
  ) as latest_coolant_temp,
  (
    select r.value from readings r
    join parameter_definitions p on p.id = r.parameter_id
    where r.machine_id = m.id and p.key = 'power_factor'
    order by r.recorded_at desc limit 1
  ) as latest_power_factor,
  (
    select r.value from readings r
    join parameter_definitions p on p.id = r.parameter_id
    where r.machine_id = m.id and p.key = 'fuel_level'
    order by r.recorded_at desc limit 1
  ) as latest_fuel_level,
  (
    select r.value from readings r
    join parameter_definitions p on p.id = r.parameter_id
    where r.machine_id = m.id and p.key = 'engine_hours'
    order by r.recorded_at desc limit 1
  ) as latest_engine_hours,
  (
    select count(*) from fault_events f
    where f.machine_id = m.id and not f.resolved
  ) as open_fault_count,
  (
    select r.recorded_at from readings r
    where r.machine_id = m.id
    order by r.recorded_at desc limit 1
  ) as last_reading_at,
  get_generator_loading(m.id) as loading_pct,
  get_apparent_power_kva(m.id) as apparent_power_kva,
  get_real_power_kw(m.id) as real_power_kw,
  get_frequency_hz(m.id) as frequency_hz,
  get_thermal_stress_index(m.id) as thermal_stress_index,
  get_health_index(m.id) as health_index,
  get_maintenance_priority_score(m.id) as maintenance_priority_score
from machines m;
