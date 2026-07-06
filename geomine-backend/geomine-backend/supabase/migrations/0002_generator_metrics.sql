-- =========================================================
-- Geomine PMS — Generator Derived Metrics
-- Implements the remaining "Parameters to Calculate in Software"
-- from the generator spec doc. Each function is documented as
-- either (a) standard electrical/mechanical physics, or (b) an
-- explicitly-defined heuristic pending calibration against real
-- operating history — these are NOT the same thing and shouldn't
-- be read with the same confidence.
-- =========================================================

-- ---------- Machine configuration needed for power/frequency calcs ----------
-- phase_type is a fixed attribute of the machine, not a numeric spec value,
-- so it lives on `machines` directly rather than in `machine_specs`.
alter table machines
  add column phase_type text not null default 'three_phase'
  check (phase_type in ('single_phase', 'three_phase'));

-- =========================================================
-- Expected machine_specs keys used below (numeric, per machine):
--   rated_current      — nameplate rated output current (A). Already used by
--                         get_generator_loading from the previous migration.
--   poles              — number of magnetic poles, for frequency calc.
--   rated_temp_normal  — expected bearing/stator temp (°C) at normal full load.
--   rated_temp_max     — thermal limit (°C) before damage risk.
-- All derived-metric functions return null (not 0, not an error) when a
-- required spec or reading is missing. Render null as "—" in the UI.
-- =========================================================

-- ---------- Apparent power (kVA) ----------
-- Standard physics, not a heuristic. Assumes `voltage` readings are
-- line-to-line RMS for three-phase machines (standard nameplate convention).
create or replace function get_apparent_power_kva(
  p_machine_id uuid,
  p_at timestamptz default now()
)
returns numeric
language plpgsql
stable
as $$
declare
  v_voltage numeric;
  v_current numeric;
  v_phase text;
begin
  select phase_type into v_phase from machines where id = p_machine_id;

  select r.value into v_voltage
  from readings r join parameter_definitions p on p.id = r.parameter_id
  where r.machine_id = p_machine_id and p.key = 'voltage' and r.recorded_at <= p_at
  order by r.recorded_at desc limit 1;

  select r.value into v_current
  from readings r join parameter_definitions p on p.id = r.parameter_id
  where r.machine_id = p_machine_id and p.key = 'output_current' and r.recorded_at <= p_at
  order by r.recorded_at desc limit 1;

  if v_voltage is null or v_current is null then
    return null;
  end if;

  if v_phase = 'three_phase' then
    return round((sqrt(3) * v_voltage * v_current) / 1000, 3);
  else
    return round((v_voltage * v_current) / 1000, 3);
  end if;
end;
$$;

-- ---------- Real power (kW) ----------
-- Standard physics (S x PF), contingent on a power_factor reading existing —
-- the spec doc says PF should be "measured if practical", so this stays null
-- for machines where nobody has logged a PF reading yet.
create or replace function get_real_power_kw(
  p_machine_id uuid,
  p_at timestamptz default now()
)
returns numeric
language plpgsql
stable
as $$
declare
  v_apparent numeric;
  v_pf numeric;
begin
  v_apparent := get_apparent_power_kva(p_machine_id, p_at);

  select r.value into v_pf
  from readings r join parameter_definitions p on p.id = r.parameter_id
  where r.machine_id = p_machine_id and p.key = 'power_factor' and r.recorded_at <= p_at
  order by r.recorded_at desc limit 1;

  if v_apparent is null or v_pf is null then
    return null;
  end if;

  return round(v_apparent * v_pf, 3);
end;
$$;

-- ---------- Frequency (Hz), derived from RPM for synchronous generators ----------
-- Standard physics: f = N x P / 120, where N = RPM, P = number of poles.
create or replace function get_frequency_hz(
  p_machine_id uuid,
  p_at timestamptz default now()
)
returns numeric
language plpgsql
stable
as $$
declare
  v_poles numeric;
  v_rpm numeric;
begin
  select value into v_poles from machine_specs where machine_id = p_machine_id and key = 'poles';

  if v_poles is null or v_poles = 0 then
    return null;
  end if;

  select r.value into v_rpm
  from readings r join parameter_definitions p on p.id = r.parameter_id
  where r.machine_id = p_machine_id and p.key = 'speed_rpm' and r.recorded_at <= p_at
  order by r.recorded_at desc limit 1;

  if v_rpm is null then
    return null;
  end if;

  return round((v_rpm * v_poles) / 120, 2);
end;
$$;

-- ---------- Thermal stress index ----------
-- HEURISTIC, explicitly defined here (not a named industry-standard formula):
-- normalized position of the current bearing/stator temp between the
-- machine's normal full-load temp and its rated thermal limit, as a
-- percentage. 100 = right at the rated limit; >100 = over it.
-- Treat this as a reasonable first-pass indicator, not a validated model —
-- it hasn't been checked against any real failure history yet.
create or replace function get_thermal_stress_index(
  p_machine_id uuid,
  p_at timestamptz default now()
)
returns numeric
language plpgsql
stable
as $$
declare
  v_normal numeric;
  v_max numeric;
  v_temp numeric;
begin
  select value into v_normal from machine_specs where machine_id = p_machine_id and key = 'rated_temp_normal';
  select value into v_max from machine_specs where machine_id = p_machine_id and key = 'rated_temp_max';

  if v_normal is null or v_max is null or v_max <= v_normal then
    return null;
  end if;

  select r.value into v_temp
  from readings r join parameter_definitions p on p.id = r.parameter_id
  where r.machine_id = p_machine_id and p.key = 'bearing_temp' and r.recorded_at <= p_at
  order by r.recorded_at desc limit 1;

  if v_temp is null then
    return null;
  end if;

  return round(greatest(0, (v_temp - v_normal) / (v_max - v_normal) * 100), 1);
end;
$$;

-- ---------- Overload duration ----------
-- Sums the time between consecutive current readings where the *earlier*
-- reading exceeded rated_current — a step-function assumption (each manual
-- reading is treated as the state until the next one). This under-counts
-- any overload that starts and resolves between two readings, which is an
-- inherent limitation of periodic manual logging vs. continuous sensors —
-- worth keeping in mind when interpreting the number, not a bug to fix.
create or replace function get_overload_duration_minutes(
  p_machine_id uuid,
  p_from timestamptz default now() - interval '30 days',
  p_to timestamptz default now()
)
returns table (
  overload_minutes numeric,
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
      case when value > (select rated_current from rated)
        then extract(epoch from (coalesce(next_recorded_at, p_to) - recorded_at)) / 60
        else 0
      end
    ), 1), 0) as overload_minutes,
    count(*) as sample_count
  from ordered;
$$;

-- ---------- Power factor trend (proxy for "efficiency trend") ----------
-- The spec doc calls for an "efficiency trend", but true generator
-- efficiency (electrical output / mechanical input) isn't computable from
-- the parameters being logged — there's no fuel or mechanical-input
-- measurement in this system. Power factor trend is used as a proxy
-- instead, since PF directly reflects how efficiently the load is using
-- the supplied power. This is a documented substitution, not the same
-- metric the doc originally named.
create or replace function get_power_factor_trend(
  p_machine_id uuid,
  p_from timestamptz default now() - interval '30 days',
  p_to timestamptz default now()
)
returns table (
  slope_per_day numeric,
  direction text,
  sample_count bigint
)
language sql
stable
as $$
  with pf_readings as (
    select r.value, r.recorded_at
    from readings r
    join parameter_definitions p on p.id = r.parameter_id
    where r.machine_id = p_machine_id
      and p.key = 'power_factor'
      and r.recorded_at between p_from and p_to
  )
  select
    round((regr_slope(value, extract(epoch from recorded_at)) * 86400)::numeric, 5) as slope_per_day,
    case
      when count(*) < 3 then 'insufficient_data'
      when regr_slope(value, extract(epoch from recorded_at)) > 0.0005 then 'improving'
      when regr_slope(value, extract(epoch from recorded_at)) < -0.0005 then 'declining'
      else 'stable'
    end as direction,
    count(*) as sample_count
  from pf_readings;
$$;

-- ---------- Health index ----------
-- HEURISTIC composite, explicitly weighted here — not a validated model.
-- Combines loading deviation from an ideal 70-90% band, thermal stress, and
-- (if available) power factor quality into a single 0-100 score, where 100
-- is healthiest. Missing components are excluded and the remaining weights
-- renormalized, rather than failing the whole score over one missing input.
-- Retune the weights once real operating history exists to check against.
create or replace function get_health_index(
  p_machine_id uuid,
  p_at timestamptz default now()
)
returns numeric
language plpgsql
stable
as $$
declare
  v_loading numeric;
  v_thermal numeric;
  v_pf numeric;
  v_loading_score numeric;
  v_thermal_score numeric;
  v_pf_score numeric;
  v_total_weight numeric := 0;
  v_weighted_sum numeric := 0;
begin
  v_loading := get_generator_loading(p_machine_id, p_at);
  v_thermal := get_thermal_stress_index(p_machine_id, p_at);

  select r.value into v_pf
  from readings r join parameter_definitions p on p.id = r.parameter_id
  where r.machine_id = p_machine_id and p.key = 'power_factor' and r.recorded_at <= p_at
  order by r.recorded_at desc limit 1;

  if v_loading is not null then
    -- Ideal band 70-90%. Penalize distance outside the band, either direction.
    v_loading_score := 100 - least(100, greatest(0, v_loading - 90) * 2 + greatest(0, 70 - v_loading) * 1.5);
    v_weighted_sum := v_weighted_sum + v_loading_score * 0.4;
    v_total_weight := v_total_weight + 0.4;
  end if;

  if v_thermal is not null then
    v_thermal_score := 100 - least(100, v_thermal);
    v_weighted_sum := v_weighted_sum + v_thermal_score * 0.4;
    v_total_weight := v_total_weight + 0.4;
  end if;

  if v_pf is not null then
    -- PF below 0.85 treated as increasingly poor; at/above 0.85 scores full.
    v_pf_score := least(100, greatest(0, (v_pf / 0.85)) * 100);
    v_weighted_sum := v_weighted_sum + v_pf_score * 0.2;
    v_total_weight := v_total_weight + 0.2;
  end if;

  if v_total_weight = 0 then
    return null;
  end if;

  return round(v_weighted_sum / v_total_weight, 1);
end;
$$;

-- ---------- Maintenance priority score ----------
-- HEURISTIC ranking, not a failure-time prediction. Higher = needs
-- attention sooner. Built from (100 - health index) plus a bump for recent
-- flagged (out-of-range) readings. Safe to use for triage/ordering; not
-- safe to read as "days until failure" — it makes no such claim.
create or replace function get_maintenance_priority_score(
  p_machine_id uuid
)
returns numeric
language plpgsql
stable
as $$
declare
  v_health numeric;
  v_flagged_count int;
begin
  v_health := get_health_index(p_machine_id);

  select count(*) into v_flagged_count
  from readings
  where machine_id = p_machine_id
    and flagged = true
    and recorded_at >= now() - interval '30 days';

  return round(coalesce(100 - v_health, 50) + (v_flagged_count * 5), 1);
end;
$$;

-- ---------- Remaining useful life ----------
-- Deliberately NOT a number. Estimating time-to-failure requires a
-- degradation curve calibrated against real historical failure data, which
-- doesn't exist yet for Geomine's fleet. Returning a fabricated figure here
-- would look authoritative while being made up, which is worse than not
-- having the feature — a maintenance decision could be made on it.
-- This stays a stub until there's enough history (or Geomine-supplied
-- engineering degradation curves) to calibrate against.
create or replace function get_estimated_rul(
  p_machine_id uuid
)
returns table (
  status text,
  note text
)
language sql
stable
as $$
  select
    'insufficient_data'::text,
    'RUL requires a degradation curve calibrated against historical failure data, which does not exist yet. Revisit once several months of readings (and ideally at least one documented failure/service event) have accumulated.'::text;
$$;

-- =========================================================
-- Consolidated fleet dashboard view
-- Replaces the narrower version from the previous migration with the
-- full metric set. One query gives IT everything needed for the fleet
-- dashboard and per-machine detail view.
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
    where r.machine_id = m.id and p.key = 'power_factor'
    order by r.recorded_at desc limit 1
  ) as latest_power_factor,
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
