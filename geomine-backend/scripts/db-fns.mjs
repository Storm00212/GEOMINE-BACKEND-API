import pg from "pg";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

for (const fn of [
  "get_generator_loading(uuid)",
  "get_health_index(uuid)",
  "get_maintenance_priority_score(uuid)",
  "get_apparent_power_kva(uuid)",
  "get_real_power_kw(uuid)",
  "get_frequency_hz(uuid)",
]) {
  const r = await pool.query(
    `select pg_get_functiondef($1::regprocedure)`,
    [fn]
  );
  console.log("\n==========", fn, "==========");
  console.log(r.rows[0]?.pg_get_functiondef);
}

// Now test the view with each machine
console.log("\n========== view by machine ==========");
for (const id of [
  "5f03b9dc-94a3-4c12-8b3e-aca941592eff",
  "dd644018-ddda-4bbc-adad-383545eafc2a",
  "6cb7a6dd-1d52-4000-bd6f-a180806f4d26",
  "558d3dcd-98c5-4c43-a80c-dd67bbebe4b3",
]) {
  try {
    const r = await pool.query("select * from generator_health_snapshot where machine_id = $1", [id]);
    console.log(`OK ${id}: ${r.rowCount} rows`);
  } catch (e) {
    console.log(`FAIL ${id}: ${e.message}`);
  }
}

await pool.end();
