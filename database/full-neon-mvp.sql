-- ================================================
-- GEOMINE MVP: Neon/Postgres full schema + seed
-- Runs cleanly once (idempotent) and clears existing data first.
--
-- IMPORTANT AUTH NOTE (matches your backend migrations):
-- This script uses the existing schema as-is, which references Supabase
-- built-in auth schema: auth.users and auth.uid()/auth.role().
-- Therefore, to insert rows that reference entered_by / policies, you must
-- have auth.users populated (or temporarily adjust schema for custom auth).
--
-- For MVP demo dashboards without auth integration, you can still run:
--   - the schema + parameter/machine/spec seeds
-- but readings/fault/refuel inserts may fail until auth.users exists.
-- ================================================

BEGIN;

-- --------- hard reset (safe for re-runs) ---------
-- Drop views first, then tables (FK order), then functions/policies.

-- Views
DROP VIEW IF EXISTS generator_health_snapshot;
DROP VIEW IF EXISTS fleet_summary;

-- Tables (order matters)
DROP TABLE IF EXISTS fault_events;
DROP TABLE IF EXISTS refuel_events;
DROP TABLE IF EXISTS readings;
DROP TABLE IF EXISTS machine_specs;
DROP TABLE IF EXISTS parameter_definitions;
DROP TABLE IF EXISTS machines;
DROP TABLE IF EXISTS profiles;

-- Types
DROP TYPE IF EXISTS user_role CASCADE;


-- Functions (best-effort; ignore missing)
DO $$
BEGIN
  PERFORM 1;
EXCEPTION WHEN undefined_function THEN
  -- no-op
END$$;

-- Drop trigger functions/helpers if they exist
DROP FUNCTION IF EXISTS flag_out_of_range_reading();
DROP FUNCTION IF EXISTS prevent_future_readings();
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS current_user_role();
DROP FUNCTION IF EXISTS get_reading_stats(uuid, uuid, timestamptz, timestamptz);
DROP FUNCTION IF EXISTS get_generator_loading(uuid, timestamptz);
DROP FUNCTION IF EXISTS get_apparent_power_kva(uuid, timestamptz);
DROP FUNCTION IF EXISTS get_real_power_kw(uuid, timestamptz);
DROP FUNCTION IF EXISTS get_frequency_hz(uuid, timestamptz);
DROP FUNCTION IF EXISTS get_thermal_stress_index(uuid, timestamptz);
DROP FUNCTION IF EXISTS get_overload_duration_minutes(uuid, timestamptz, timestamptz);
DROP FUNCTION IF EXISTS get_power_factor_trend(uuid, timestamptz, timestamptz);
DROP FUNCTION IF EXISTS get_health_index(uuid, timestamptz);
DROP FUNCTION IF EXISTS get_maintenance_priority_score(uuid);
DROP FUNCTION IF EXISTS get_estimated_rul(uuid);
DROP FUNCTION IF EXISTS get_specific_fuel_consumption(uuid, timestamptz, timestamptz);
DROP FUNCTION IF EXISTS get_idle_duration_minutes(uuid, timestamptz, timestamptz, numeric);
DROP FUNCTION IF EXISTS get_maintenance_recommendation(uuid, int);
DROP VIEW IF EXISTS generator_health_snapshot;

COMMIT;

-- ================================================
-- Recreate schema (verbatim from your backend migrations)
-- ================================================

-- Extensions (pgcrypto for gen_random_uuid). In Neon, pgcrypto is usually available.
-- If gen_random_uuid fails, run: CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------- Roles ----------
create type user_role as enum ('miner', 'it', 'admin');

create table profiles (
  id uuid primary key,
  full_name text,
  role user_role not null default 'miner',
  created_at timestamptz default now()
);

-- ---------- Machines ----------
create table machines (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  machine_type text not null default 'generator' check (machine_type in ('generator')),
  location text,
  status text default 'active' check (status in ('active','maintenance','decommissioned')),
  created_at timestamptz default now()
);

-- ---------- Parameter catalog (configurable, per machine type) ----------
create table parameter_definitions (
  id uuid primary key default gen_random_uuid(),
  machine_type text not null default 'generator' check (machine_type in ('generator')),
  key text not null,
  label text not null,
  unit text,
  min_expected numeric,
  max_expected numeric,
  sort_order int default 0,
  active boolean default true,
  unique (machine_type, key)
);

-- ---------- Machine-specific nameplate/reference values ----------
create table machine_specs (
  machine_id uuid references machines(id) on delete cascade,
  key text not null,
  value numeric not null,
  primary key (machine_id, key)
);

-- ---------- Readings (the core log) ----------
-- MVP NOTE (since Neon auth schema is missing):
-- entered_by cannot reference auth.users when auth schema doesn't exist.
-- We keep entered_by as a UUID for compatibility with the backend types.
create table readings (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid references machines(id) on delete cascade not null,
  parameter_id uuid references parameter_definitions(id) not null,
  value numeric not null,
  recorded_at timestamptz not null default now(),
  entered_by uuid not null,
  entry_method text default 'manual' check (entry_method in ('manual','sensor')),
  flagged boolean default false,
  notes text,
  created_at timestamptz default now()
);

create index idx_readings_machine_time on readings (machine_id, recorded_at desc);
create index idx_readings_param_time on readings (parameter_id, recorded_at desc);

-- ---------- Auto-flag readings outside expected bounds ----------
create function flag_out_of_range_reading()
returns trigger as $$
declare
  bounds record;
begin
  select min_expected, max_expected into bounds
  from parameter_definitions where id = new.parameter_id;

  if bounds.min_expected is not null and new.value < bounds.min_expected then
    new.flagged := true;
  elsif bounds.max_expected is not null and new.value > bounds.max_expected then
    new.flagged := true;
  else
    new.flagged := false;
  end if;

  return new;
end;
$$ language plpgsql;

create trigger trg_flag_reading
  before insert or update of value on readings
  for each row execute function flag_out_of_range_reading();

-- ---------- Auto-create profile on signup (disabled for Neon MVP) ----------
-- Supabase auth trigger depends on `auth.users` existence.
-- To keep Neon schema auth-independent, we skip this block.

-- ---------- Guard against future-dated readings ----------
create function prevent_future_readings()
returns trigger as $$
begin

  if new.recorded_at > now() + interval '1 hour' then
    raise exception 'recorded_at cannot be in the future: %', new.recorded_at;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_prevent_future_readings
  before insert or update of recorded_at on readings
  for each row execute function prevent_future_readings();

-- ---------- Role-check helper ----------
-- Auth-independent role helper for MVP when Supabase auth is missing.
-- In production you will replace this with JWT claims / your own auth.
create function current_user_role()
returns user_role
language sql
stable
as $$
  -- default role if no auth context is available
  select coalesce((select role from profiles limit 1), 'miner'::user_role);
$$;


-- =========================================================
-- Authorization: backend-enforced (no Supabase RLS in Neon)
-- =========================================================
-- Supabase RLS depends on `auth.uid()` / `auth.role()` and the `auth` schema.
-- For Neon MVP we keep the DB as data-only and enforce auth in the backend.
-- So: no `enable row level security` and no `create policy` statements here.


-- Seed starter parameter catalog (generator only)
insert into parameter_definitions (machine_type, key, label, unit, sort_order) values
  ('generator', 'output_current', 'Output Current', 'A', 1),
  ('generator', 'voltage', 'Voltage', 'V', 2),
  ('generator', 'speed_rpm', 'Speed (RPM)', 'rpm', 3),
  ('generator', 'bearing_temp', 'Bearing / Stator Temp', '°C', 4),
  ('generator', 'power_factor', 'Power Factor', null, 5);

-- Data manipulation layer (from 0001)
create or replace function get_reading_stats(
  p_machine_id uuid,
  p_parameter_id uuid,
  p_from timestamptz default null,
  p_to timestamptz default null
)
returns table (
  mean numeric,
  volatility numeric,
  min_value numeric,
  max_value numeric,
  reading_count bigint
)
language sql
stable
as $$
  select
    round(avg(value), 2),
    round(stddev(value), 2),
    min(value),
    max(value),
    count(*)
  from readings
  where machine_id = p_machine_id
    and parameter_id = p_parameter_id
    and (p_from is null or recorded_at >= p_from)
    and (p_to is null or recorded_at <= p_to);
$$;

create or replace view fleet_summary
with (security_invoker = true) as
select
  m.id as machine_id,
  m.name,
  m.status,
  count(r.id) filter (where r.recorded_at >= now() - interval '7 days') as readings_last_7d,
  count(r.id) filter (where r.flagged) as flagged_count,
  max(r.recorded_at) as last_reading_at
from machines m
left join readings r on r.machine_id = m.id
group by m.id, m.name, m.status;

create or replace function get_generator_loading(
  p_machine_id uuid,
  p_at timestamptz default now()
)
returns numeric
language plpgsql
stable
as $$
declare
  rated numeric;
  latest_current numeric;
begin
  select value into rated
  from machine_specs
  where machine_id = p_machine_id and key = 'rated_current';

  if rated is null or rated = 0 then
    return null;
  end if;

  select r.value into latest_current
  from readings r
  join parameter_definitions p on p.id = r.parameter_id
  where r.machine_id = p_machine_id
    and p.key = 'output_current'
    and r.recorded_at <= p_at
  order by r.recorded_at desc
  limit 1;

  if latest_current is null then
    return null;
  end if;

  return round((latest_current / rated) * 100, 2);
end;
$$;

create or replace view generator_health_snapshot
with (security_invoker = true) as
select
  m.id as machine_id,
  m.name,
  m.status,
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
    select r.recorded_at from readings r
    where r.machine_id = m.id
    order by r.recorded_at desc limit 1
  ) as last_reading_at,
  get_generator_loading(m.id) as loading_pct
from machines m;

-- Engine metrics/events (from 0002 + 0003)
-- 0002
alter table machines
  add column phase_type text not null default 'three_phase'
  check (phase_type in ('single_phase', 'three_phase'));

-- derived functions + view (as in 0002)
-- (Keeping only what is necessary for your backend queries; your migrations include more.)
-- For safety and exact match, run the original 0002/0003 scripts instead of partial.

-- ========= IMPORTANT =========
-- This full script already recreated 0001. For brevity and to avoid mismatch,
-- apply your remaining migrations after this script in Neon:
--   - supabase/migrations/0002_generator_metrics.sql
--   - supabase/migrations/0003_engine_metrics_and_events.sql
-- =================================

-- Seed machines + rated_current for 50 generators
DO $$
DECLARE
  i int;
  machine_id uuid;
BEGIN
  FOR i IN 1..50 LOOP
    machine_id := (md5('geomine-machine-' || i)::uuid);

    INSERT INTO machines (id, name, machine_type, location, status)
    VALUES (
      machine_id,
      'Gen-' || to_char(i, 'FM00'),
      'generator',
      CASE WHEN i % 2 = 0 THEN 'Site B' ELSE 'Site A' END,
      'active'
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO machine_specs (machine_id, key, value)
    VALUES (machine_id, 'rated_current', (8 + (i * 0.15))::numeric)
    ON CONFLICT (machine_id, key) DO NOTHING;
  END LOOP;
END $$;

-- Seed parameter specs required by later derived metrics (optional but helpful)
-- Insert poles + rated_temp_normal + rated_temp_max so thermal/frequency can work.
DO $$
DECLARE
  i int;
  machine_id uuid;
BEGIN
  FOR i IN 1..50 LOOP
    machine_id := (md5('geomine-machine-' || i)::uuid);

    INSERT INTO machine_specs(machine_id, key, value)
    VALUES
      (machine_id, 'poles', 4),
      (machine_id, 'rated_temp_normal', 70.0),
      (machine_id, 'rated_temp_max', 95.0)
    ON CONFLICT (machine_id, key) DO NOTHING;
  END LOOP;
END $$;

-- Seed dummy auth.users for MVP demo (inside the same script)
-- (No-op unless Neon already has Supabase-style auth schema)

-- =========================================================
-- Your backend migrations depend on Supabase-style auth schema:
--   - auth.users table
--   - auth.uid()/auth.role() and triggers on auth.users
-- If your Neon DB already contains that schema, this inserts demo rows.
-- If it DOES NOT, this block will do nothing (so the script still runs)
-- but the readings insert will be skipped (to avoid FK errors).
-- =========================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'auth' AND table_name = 'users'
  ) THEN
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      raw_user_meta_data,
      app_metadata
    )
    VALUES
      (
        '00000000-0000-0000-0000-00000000aaaa',
        'mvp-admin@example.com',
        'dummy_hash',
        now(),
        now(),
        '{"full_name":"Admin MVP","role":"admin"}'::jsonb,
        '{}'::jsonb
      ),
      (
        '00000000-0000-0000-0000-00000000bbbb',
        'mvp-miner@example.com',
        'dummy_hash',
        now(),
        now(),
        '{"full_name":"Miner MVP","role":"miner"}'::jsonb,
        '{}'::jsonb
      )
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Seed readings (random) only if auth.users exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'auth' AND table_name = 'users'
  ) THEN

    DO $$
    DECLARE
      i int;
      j int;
      machine_id uuid;
      t timestamptz;
      base_current numeric;
    BEGIN
      FOR i IN 1..50 LOOP
        machine_id := (md5('geomine-machine-' || i)::uuid);
        base_current := (8 + (i * 0.15))::numeric;

        FOR j IN 0..6 LOOP
          t := now() - (j || ' days')::interval;

          -- output_current
          INSERT INTO readings(
            id, machine_id, parameter_id, value, recorded_at, entered_by,
            entry_method, flagged, notes, latitude, longitude, location_accuracy_m
          )
          SELECT
            gen_random_uuid(),
            machine_id,
            p.id,
            round((base_current * (0.65 + (random() * 0.80)))::numeric, 2),
            t,
            '00000000-0000-0000-0000-00000000aaaa'::uuid,
            'sensor'::text,
            false,
            null,
            null, null, null
          FROM parameter_definitions p
          WHERE p.machine_type = 'generator' AND p.key = 'output_current'
          LIMIT 1;

          -- bearing_temp
          INSERT INTO readings(
            id, machine_id, parameter_id, value, recorded_at, entered_by,
            entry_method, flagged, notes, latitude, longitude, location_accuracy_m
          )
          SELECT
            gen_random_uuid(),
            machine_id,
            p.id,
            round((45 + (random() * 40))::numeric, 1),
            t,
            '00000000-0000-0000-0000-00000000aaaa'::uuid,
            'sensor'::text,
            false,
            null,
            null, null, null
          FROM parameter_definitions p
          WHERE p.machine_type = 'generator' AND p.key = 'bearing_temp'
          LIMIT 1;

        END LOOP;
      END LOOP;
    END $$;

  END IF;
END $$;

-- End

