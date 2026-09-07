import pg from "pg";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// Get all functions in any schema
const fns = await pool.query(`
  select n.nspname, p.proname, pg_get_function_arguments(p.oid) as args
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where p.proname in (
    'get_generator_loading','get_apparent_power_kva','get_real_power_kw',
    'get_frequency_hz','get_thermal_stress_index','get_health_index',
    'get_maintenance_priority_score','get_overload_duration_minutes',
    'get_power_factor_trend','get_estimated_rul','get_idle_duration_minutes',
    'get_specific_fuel_consumption','get_maintenance_recommendation',
    'get_reading_stats'
  )
  order by p.proname
`);
console.log("=== Functions we care about ===");
fns.rows.forEach(r => console.log(`  ${r.nspname}.${r.proname}(${r.args})`));

// Get exact source of failing functions
for (const fn of ["get_apparent_power_kva", "get_real_power_kw"]) {
  const r = await pool.query(`select pg_get_functiondef($1::regproc)`, [fn]);
  console.log(`\n--- ${fn} ---`);
  console.log(r.rows[0]?.pg_get_functiondef);
}

await pool.end();
