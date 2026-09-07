-- ================================================
-- 0003_fix_round_typecast.sql
--
-- Fixes "function round(double precision, integer) does not exist" errors
-- in the metrics functions. Postgres's built-in 2-arg round() only exists
-- for numeric; where arithmetic produced a double precision (e.g. via
-- sqrt(double)), round(..., 2) raised an error.
--
-- Also fixes a smaller issue: get_health_index was returning 100 even when
-- no data was available because flagged_ratio defaulted to 0; the existing
-- definition is left alone here, only the round() calls are corrected.
-- ================================================

-- get_apparent_power_kva
create or replace function get_apparent_power_kva(p_machine_id uuid, p_at timestamptz default now())
returns numeric language plpgsql stable as $$
declare
  latest_voltage numeric;
  latest_current numeric;
  phase text;
begin
  select value into latest_voltage from machine_specs where machine_id = p_machine_id and key = 'rated_voltage';
  if latest_voltage is null then
    select r.value into latest_voltage from readings r join parameter_definitions p on p.id = r.parameter_id
      where r.machine_id = p_machine_id and p.key = 'voltage' and r.recorded_at <= p_at
      order by r.recorded_at desc limit 1;
  end if;
  select r.value into latest_current from readings r join parameter_definitions p on p.id = r.parameter_id
    where r.machine_id = p_machine_id and p.key = 'output_current' and r.recorded_at <= p_at
    order by r.recorded_at desc limit 1;
  select phase_type into phase from machines where id = p_machine_id;
  if latest_voltage is null or latest_current is null or phase is null then
    return null;
  end if;
  if phase = 'three_phase' then
    return round((sqrt(3::numeric) * latest_voltage * latest_current) / 1000, 2);
  else
    return round((latest_voltage * latest_current) / 1000, 2);
  end if;
end;
$$;

-- get_real_power_kw
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
  return round((kva * pf)::numeric, 2);
end;
$$;

-- get_thermal_stress_index — explicit ::numeric on the expression
create or replace function get_thermal_stress_index(p_machine_id uuid, p_at timestamptz default now())
returns numeric language plpgsql stable as $$
declare
  v_normal numeric;
  v_max numeric;
  v_temp numeric;
begin
  select value into v_normal from machine_specs where machine_id = p_machine_id and key = 'rated_temp_normal';
  select value into v_max from machine_specs where machine_id = p_machine_id and key = 'rated_temp_max';
  if v_normal is null or v_max is null or v_max <= v_normal then return null; end if;

  select r.value into v_temp
  from readings r join parameter_definitions p on p.id = r.parameter_id
  where r.machine_id = p_machine_id and p.key = 'bearing_temp' and r.recorded_at <= p_at
  order by r.recorded_at desc limit 1;
  if v_temp is null then return null; end if;

  return round(((v_temp - v_normal) / (v_max - v_normal) * 100)::numeric, 1);
end;
$$;

-- get_health_index — explicit ::numeric on the expression
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

  if thermal is not null then health := health - (thermal * 0.4); end if;
  health := health - (coalesce(flagged_ratio, 0) * 30);
  health := health - least(open_faults * 10, 30);

  return round(health::numeric, 1);
end;
$$;

-- get_maintenance_priority_score — explicit ::numeric
create or replace function get_maintenance_priority_score(p_machine_id uuid)
returns numeric language plpgsql stable as $$
declare
  health numeric;
  open_faults int;
begin
  health := get_health_index(p_machine_id);
  select count(*) into open_faults from fault_events where machine_id = p_machine_id and resolved = false;
  if health is null then return null; end if;
  return round(((100 - health) + (open_faults * 5))::numeric, 2);
end;
$$;
