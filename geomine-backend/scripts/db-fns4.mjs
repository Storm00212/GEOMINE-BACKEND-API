import pg from "pg";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// Use the catalog's prosrc to see the actual function body
for (const fn of ["get_apparent_power_kva", "get_real_power_kw", "get_thermal_stress_index", "get_health_index"]) {
  const r = await pool.query(`select prosrc from pg_proc where proname = $1 limit 1`, [fn]);
  console.log(`\n--- ${fn} (prosrc) ---`);
  console.log(r.rows[0]?.prosrc);
}

await pool.end();
