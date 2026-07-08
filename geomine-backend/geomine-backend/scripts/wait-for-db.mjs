import { createClient } from "@supabase/supabase-js";

function log(...args) {
  console.log(new Date().toISOString(), ...args);
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.");
  process.exit(1);
}

const client = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const maxRetries = Number(process.env.DB_CONNECT_RETRIES || 6);

function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function checkDb() {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      log(`DB check attempt ${attempt}/${maxRetries}`);

      // Try a lightweight read from a known table created by migrations.
      const { data, error, status } = await client.from("machines").select("id").limit(1);

      if (error) {
        // Supabase client surface returns an error object with `status` and `message`.
        log("Supabase returned error", { status: error.status ?? status, message: error.message });
        throw error;
      }

      log("Database reachable (machines table query succeeded)");
      return 0;
    } catch (err) {
      const status = err?.status ?? err?.code ?? "unknown";
      const message = err?.message ?? String(err);
      console.error(new Date().toISOString(), `DB connect failed (status=${status}):`, message);

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
  const code = await checkDb();
  process.exit(code);
})();
