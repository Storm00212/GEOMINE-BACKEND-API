import pg from "pg";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

for (const fn of ["get_apparent_power_kva", "get_real_power_kw", "get_thermal_stress_index", "get_health_index", "get_maintenance_priority_score"]) {
  const r = await pool.query("select prosrc from pg_proc where proname = $1", [fn]);
  const src = r.rows[0]?.prosrc ?? "";
  const hasCast = src.includes("::numeric");
  console.log((hasCast ? "FIXED     " : "ORIGINAL  ") + fn);
  console.log("  prosrc: " + src.slice(0, 220).replace(/\n/g, " "));
}

const v = await pool.query("select count(*)::int as n from generator_health_snapshot");
console.log("\nView generator_health_snapshot rows: " + v.rows[0].n);

await pool.end();
