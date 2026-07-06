-- =========================================================
-- Geomine Predictive Maintenance — Initial Schema
-- =========================================================

-- ---------- Roles ----------
create type user_role as enum ('miner', 'it', 'admin');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
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
-- Scoped to 'generator' only for now. machine_type kept (rather than dropped)
-- so re-introducing ball mills later is a constraint change, not a schema rewrite.
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
-- Filled in once model-specific parameters are provided (rated_current, critical_rpm, etc.)
create table machine_specs (
  machine_id uuid references machines(id) on delete cascade,
  key text not null,
  value numeric not null,
  primary key (machine_id, key)
);

-- ---------- Readings (the core log) ----------
create table readings (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid references machines(id) on delete cascade not null,
  parameter_id uuid references parameter_definitions(id) not null,
  value numeric not null,
  recorded_at timestamptz not null default now(),
  entered_by uuid references auth.users(id) not null,
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

-- ---------- Auto-create profile on signup (role comes from invite metadata) ----------
create function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'miner')
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------- Guard against future-dated readings ----------
-- Backdating is expected (shift logging); a reading claiming to be from
-- the future is almost always a typo in the date picker, not real data.
-- 1 hour buffer accounts for clock skew between device and server.
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
-- security definer lets this bypass RLS internally, which avoids the
-- self-referencing-policy recursion you get from writing
-- "exists (select 1 from profiles where id = auth.uid() and role = ...)"
-- directly inside a policy on profiles itself. Every policy below uses
-- this instead of inline subqueries.
create function current_user_role()
returns user_role
language sql
security definer
stable
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

-- =========================================================
-- Row Level Security
-- =========================================================

alter table profiles enable row level security;
alter table machines enable row level security;
alter table parameter_definitions enable row level security;
alter table machine_specs enable row level security;
alter table readings enable row level security;

-- Profiles: users can read their own profile; IT/admin can read all
create policy "read own profile"
on profiles for select
using (id = auth.uid() or current_user_role() in ('it','admin'));

-- Machines: readable by any authenticated user; writable by admin only
create policy "machines readable by authenticated"
on machines for select
using (auth.role() = 'authenticated');

create policy "machines writable by admin"
on machines for insert with check (current_user_role() = 'admin');

create policy "machines updatable by admin"
on machines for update using (current_user_role() = 'admin');

-- Parameter definitions: readable by any authenticated user; writable by admin only
create policy "params readable by authenticated"
on parameter_definitions for select
using (auth.role() = 'authenticated');

create policy "params writable by admin"
on parameter_definitions for insert with check (current_user_role() = 'admin');

create policy "params updatable by admin"
on parameter_definitions for update using (current_user_role() = 'admin');

-- Machine specs: readable by IT/admin; writable by admin only
create policy "specs readable by it and admin"
on machine_specs for select
using (current_user_role() in ('it','admin'));

create policy "specs writable by admin"
on machine_specs for insert with check (current_user_role() = 'admin');

create policy "specs updatable by admin"
on machine_specs for update using (current_user_role() = 'admin');

-- Readings: miners can insert; miners see own, IT/admin see all; IT/admin can correct
create policy "miners and staff can log readings"
on readings for insert
with check (
  entered_by = auth.uid()
  and current_user_role() in ('miner','it','admin')
);

create policy "read access by role"
on readings for select
using (
  entered_by = auth.uid()
  or current_user_role() in ('it','admin')
);

create policy "it and admin can correct readings"
on readings for update
using (current_user_role() in ('it','admin'));

-- Deletion is admin-only and separate from correction — IT can fix a typo'd
-- value, but removing a row entirely is a more destructive action.
create policy "admin can delete readings"
on readings for delete
using (current_user_role() = 'admin');

-- =========================================================
-- Seed data — starter parameter catalog (generators only)
-- Based on the low-cost predictive maintenance parameter doc.
-- Bounds (min/max_expected) are placeholders — replace once
-- Geomine's actual machine specs are provided.
-- =========================================================

insert into parameter_definitions (machine_type, key, label, unit, sort_order) values
  ('generator', 'output_current', 'Output Current', 'A', 1),
  ('generator', 'voltage', 'Voltage', 'V', 2),
  ('generator', 'speed_rpm', 'Speed (RPM)', 'rpm', 3),
  ('generator', 'bearing_temp', 'Bearing / Stator Temp', '°C', 4),
  ('generator', 'power_factor', 'Power Factor', null, 5);

-- =========================================================
-- Data manipulation layer
-- Stats and derived metrics computed in Postgres rather than
-- client-side, so the frontend just calls these instead of
-- pulling raw rows and crunching numbers in the browser.
-- =========================================================

-- ---------- Rolling stats for one machine + parameter, optional date range ----------
-- Powers the per-machine chart (mean / volatility / min / max) tomorrow.
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

-- ---------- Fleet-wide summary, one row per machine ----------
-- Powers the dashboard tomorrow without pulling every reading into the app.
-- security_invoker is important here: without it, this view would run with
-- the permissions of whoever created it (the postgres superuser, via this
-- migration), which bypasses RLS entirely. With it, the view respects the
-- RLS policies of whichever user (miner/it/admin) actually queries it.
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

-- ---------- Generator loading % ----------
-- loading % = latest output current / rated current, from the doc's
-- "Parameters to Calculate in Software" list. Returns null (not zero,
-- not an error) if either the spec or a current reading is missing —
-- the frontend should render this as "—" rather than treat null as 0%.
-- This starts working the moment 'rated_current' is added to machine_specs
-- for a given machine; no code change needed when you send the specs.
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

-- ---------- Per-generator health snapshot ----------
-- One row per machine with its latest key readings + loading %.
-- This is the single query the dashboard needs for the fleet view;
-- it degrades gracefully to nulls for machines with no specs/readings yet.
-- security_invoker = true for the same RLS reason as fleet_summary above.
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
