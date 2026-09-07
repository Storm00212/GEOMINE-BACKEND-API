import pg from "pg";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const r = await pool.query(
  "select id, email, role, created_at from app_users where email = $1",
  ["smoketest_admin_attempt@x.com"]
);
console.table(r.rows);
await pool.end();
