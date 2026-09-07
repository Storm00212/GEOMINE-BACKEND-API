import pg from "pg";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// Get the list of all functions in the public schema
const fns = await pool.query(`
  select n.nspname || '.' || p.proname || '(' ||
         pg_get_function_arguments(p.oid) || ')' as sig
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
  order by p.proname
`);
console.log("=== Existing public functions ===");
fns.rows.forEach(r => console.log("  ", r.sig));

// Test each function the view uses
console.log("\n=== Testing view-referenced functions ===");
const viewFns = [
  "get_generator_loading",
  "get_apparent_power_kva",
  "get_real_power_kw",
  "get_frequency_hz",
  "get_thermal_stress_index",
  "get_health_index",
  "get_maintenance_priority_score",
];
for (const name of viewFns) {
  for (const machineId of ["dd644018-ddda-4bbc-adad-383545eafc2a"]) {
    try {
      const r = await pool.query(`select ${name}($1::uuid) as result`, [machineId]);
      console.log(`OK   ${name}: ${r.rows[0]?.result}`);
    } catch (e) {
      console.log(`FAIL ${name}: ${e.message}`);
    }
  }
}

await pool.end();
