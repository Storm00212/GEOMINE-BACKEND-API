import pg from "pg";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const r = await pool.query(`
  select table_name, column_name, data_type
  from information_schema.columns
  where table_name in ('machines','machine_specs','parameter_definitions','readings')
  order by table_name, ordinal_position
`);
console.table(r.rows);

// Check current view definition
const v = await pool.query(`
  select pg_get_viewdef('generator_health_snapshot'::regclass, true) as def
`);
console.log("\n--- view def ---\n", v.rows[0]?.def);

// And the failing function: get_thermal_stress_index
const fn = await pool.query(`
  select pg_get_functiondef('get_thermal_stress_index(uuid, timestamptz)'::regprocedure)
`);
console.log("\n--- get_thermal_stress_index def ---\n", fn.rows[0]?.pg_get_functiondef);

await pool.end();
