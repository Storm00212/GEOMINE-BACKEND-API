// Diagnostic: call each SQL function/view that the failing routes use,
// against the local DATABASE_URL. If this 500s the same way, the issue is
// in the SQL/migration layer. If this works, the issue is something else.

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";
import dotenv from "dotenv";

const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) dotenv.config({ path: envPath });

const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL missing"); process.exit(1); }
console.log("DB host:", new URL(url).host);

const pool = new pg.Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });

const MACHINE = "dd644018-ddda-4bbc-adad-383545eafc2a";
const PARAM_BEARING = "b382c713-b2cf-4d92-8d6f-a36b828f9629";

async function tryQuery(label, sql, params) {
  try {
    const r = await pool.query(sql, params);
    console.log(`OK   ${label}: ${r.rowCount} rows`);
    if (r.rowCount > 0) console.log("     sample:", JSON.stringify(r.rows[0]).slice(0, 200));
  } catch (e) {
    console.log(`FAIL ${label}: ${e.message}`);
  }
}

await tryQuery("get_reading_stats",
  "select * from get_reading_stats($1, $2, $3, $4)",
  [MACHINE, PARAM_BEARING, null, null]);

await tryQuery("generator_health_snapshot (view)",
  "select * from generator_health_snapshot limit 5");

await tryQuery("get_overload_duration_minutes",
  "select * from get_overload_duration_minutes($1, $2, $3)",
  [MACHINE, null, null]);

await tryQuery("get_power_factor_trend",
  "select * from get_power_factor_trend($1, $2, $3)",
  [MACHINE, null, null]);

await tryQuery("get_estimated_rul",
  "select * from get_estimated_rul($1)",
  [MACHINE]);

await tryQuery("get_specific_fuel_consumption",
  "select * from get_specific_fuel_consumption($1, $2, $3)",
  [MACHINE, null, null]);

await tryQuery("get_idle_duration_minutes",
  "select * from get_idle_duration_minutes($1, $2, $3)",
  [MACHINE, null, null]);

await tryQuery("get_maintenance_recommendation",
  "select * from get_maintenance_recommendation($1, $2)",
  [MACHINE, 10]);

await tryQuery("readings count (sanity)",
  "select count(*) from readings where machine_id = $1",
  [MACHINE]);

await tryQuery("machines (sanity)",
  "select id, name from machines limit 5");

await tryQuery("parameter_definitions (sanity)",
  "select id, key from parameter_definitions limit 5");

await pool.end();
