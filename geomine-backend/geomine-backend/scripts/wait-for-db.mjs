import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { Pool } from "pg";

const appRoot = process.cwd();
const envFiles = [path.join(appRoot, ".env.local"), path.join(appRoot, ".env")];

for (const envFile of envFiles) {
  if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile });
  }
}

function log(...args) {
  console.log(new Date().toISOString(), ...args);
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL in environment (Neon Postgres)." );
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });
const maxRetries = Number(process.env.DB_CONNECT_RETRIES || 6);

function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function checkDb() {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      log(`DB check attempt ${attempt}/${maxRetries}`);
      const res = await pool.query("select 1 as ok");
      if (!res?.rows?.[0]) throw new Error("No rows returned");
      log("Database reachable (Postgres connection ok)");
      return 0;
    } catch (err) {
      const message = err?.message ?? String(err);
      console.error(new Date().toISOString(), `DB connect failed:`, message);

      if (attempt === maxRetries) {
        console.error("Exceeded maximum DB connection attempts. Exiting.");
        return 2;
      }

      const backoff = Math.min(1000 * 2 ** attempt, 15000);
      log(`Waiting ${backoff}ms before retrying...`);
      await delay(backoff);
    }
  }

  return 2;
}

(async () => {
  try {
    const code = await checkDb();
    process.exit(code);
  } finally {
    await pool.end().catch(() => {});
  }
})();

