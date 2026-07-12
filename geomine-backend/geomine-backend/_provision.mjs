import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { Pool } from "pg";

const appRoot = process.cwd();
for (const f of [path.join(appRoot, ".env.local"), path.join(appRoot, ".env")]) {
  if (fs.existsSync(f)) dotenv.config({ path: f });
}
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const MIG = "C:\\Users\\User\\AppData\\Local\\Temp\\kilo\\mig";

function clean(sql) {
  // Remove whole CREATE POLICY ... ; blocks (span multiple lines)
  sql = sql.replace(/create policy[\s\S]*?;\s*\n/gi, "");
  // Remove RLS enable lines
  sql = sql.split("\n").filter(l => !/enable row level security/.test(l)).join("\n");
  // Drop Supabase auth FK references
  sql = sql.replace(/references auth\.users\(id\)/gi, "");
  // Avoid duplicate column errors on already-existing columns
  sql = sql.replace(/add column /gi, "add column if not exists ");
  return sql;
}

const f2 = clean(fs.readFileSync(path.join(MIG, "0002_generator_metrics.sql"), "utf8"));
const f3 = clean(fs.readFileSync(path.join(MIG, "0003_engine_metrics_and_events.sql"), "utf8"));

const appUsers = `
create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  role user_role not null default 'miner',
  created_at timestamptz default now()
);
`;

const full = appUsers + "\n-- ===== 0002 =====\n" + f2 + "\n-- ===== 0003 =====\n" + f3;

try {
  await pool.query(full);
  console.log("PROVISION OK");
} catch (e) {
  console.error("PROVISION ERROR:\n", e.message);
} finally {
  await pool.end();
}
