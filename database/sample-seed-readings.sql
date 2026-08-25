-- Seed random readings for 50 generators
-- Generates DIFFERENT/random values per generator and per day.
--
-- IMPORTANT: this uses placeholder entered_by UUID until your Path B custom
-- auth migration updates FK/RLS. Adjust the entered_by UUID to an existing
-- user in your current auth system.

DO $$
DECLARE
  i int;
  j int;
  machine_id uuid;
  t timestamptz;
  base_current numeric;
BEGIN
  -- Use a placeholder entered_by. Replace with a real auth.user id if your
  -- current schema enforces FK/RLS.
  -- NOTE: Using a single entered_by keeps seed simpler; values are still random.
  FOR i IN 1..50 LOOP
    machine_id := (md5('geomine-machine-' || i)::uuid);
    base_current := (8 + (i * 0.15))::numeric;

    -- 7 days history
    FOR j IN 0..6 LOOP
      t := now() - (j || ' days')::interval;

      -- output_current: random around ~65%-145% of rated_current
      INSERT INTO readings (
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
        null,
        null,
        null
      FROM parameter_definitions p
      WHERE p.machine_type = 'generator'
        AND p.key = 'output_current';

      -- bearing_temp: random between 45 and 85
      INSERT INTO readings (
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
        null,
        null,
        null
      FROM parameter_definitions p
      WHERE p.machine_type = 'generator'
        AND p.key = 'bearing_temp';

    END LOOP;
  END LOOP;
END $$;

