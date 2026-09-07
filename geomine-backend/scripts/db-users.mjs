import pg from "pg";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// Check users — production seed may have set up specific users
const u = await pool.query(`select id, email, role, created_at from app_users order by created_at limit 10`);
console.log("=== app_users ===");
console.table(u.rows);

// Check machines
const m = await pool.query(`select id, name, location, created_at from machines order by created_at`);
console.log("\n=== machines ===");
console.table(m.rows);

await pool.end();
