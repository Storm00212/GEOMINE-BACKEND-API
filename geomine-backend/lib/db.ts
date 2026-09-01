import { Pool } from "pg";

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Missing DATABASE_URL. Set it to your Neon Postgres connection string."
    );
  }
  return url;
}

// In Next.js, modules can be loaded multiple times. Using a module-level
// pool keeps connections efficient.
const pool = new Pool({ connectionString: getDatabaseUrl() });

export async function withDb<T>(fn: (client: import("pg").PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

