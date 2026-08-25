import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { Pool } from "pg";

const appRoot = process.cwd();
for (const f of [path.join(appRoot, ".env.local"), path.join(appRoot, ".env")]) {
  if (fs.existsSync(f)) dotenv.config({ path: f });
}
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const tables = await pool.query(`select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE' order by 1`);
console.log("TABLES:", tables.rows.map(r => r.table_name).join(", ") || "(none)");
const views = await pool.query(`select table_name from information_schema.views where table_schema='public' order by 1`);
console.log("VIEWS:", views.rows.map(r => r.table_name).join(", ") || "(none)");
const funcs = await pool.query(`select proname || '(' || oidvectortypes(proargtypes) || ')' as f from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' order by 1`);
console.log("FUNCTIONS:", funcs.rows.map(r => r.f).join(", ") || "(none)");
await pool.end();
