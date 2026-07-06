#!/usr/bin/env node
// Local-dev-only helper: generates a real access token for an
// ALREADY-INVITED user, without waiting on real email delivery and without
// needing to click through a URL — this is nicer than the old cookie-based
// version, since Postman just needs the token pasted into a header now.
//
// How it works: uses the service role key to generate a magic-link token,
// then immediately exchanges that token for a session server-side
// (auth.verifyOtp), all in one script. Never sends an email, never opens
// a browser.
//
// This is a standalone CLI script — never an HTTP route, never deployed,
// only reachable by whoever has this repo and the local .env.local file.
//
// Usage:
//   node scripts/dev-login.mjs someone@geomine.com

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  let content;
  try {
    content = readFileSync(envPath, "utf-8");
  } catch {
    console.error("Couldn't find .env.local — copy .env.local.example and fill it in first.");
    process.exit(1);
  }
  const env = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return env;
}

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/dev-login.mjs <email>");
  process.exit(1);
}

const env = loadEnvLocal();
const url = env.SUPABASE_URL;
const anonKey = env.SUPABASE_ANON_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey || url.includes("your-project")) {
  console.error("SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY aren't set in .env.local yet.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
  type: "magiclink",
  email,
});

if (linkError) {
  console.error("Failed to generate link:", linkError.message);
  console.error("(Make sure this email already has a profile — invite it first via the frontend's /admin/users/new.)");
  process.exit(1);
}

const tokenHash = linkData.properties?.hashed_token;
if (!tokenHash) {
  console.error("Couldn't extract a token from the generated link.");
  process.exit(1);
}

// Exchange the token for a real session, as the anon-key client would.
const anon = createClient(url, anonKey);
const { data: sessionData, error: verifyError } = await anon.auth.verifyOtp({
  type: "email",
  token_hash: tokenHash,
});

if (verifyError || !sessionData.session) {
  console.error("Failed to exchange token for a session:", verifyError?.message);
  process.exit(1);
}

console.log(`\nAccess token for ${email} (role comes from their invite):\n`);
console.log(sessionData.session.access_token);
console.log("\nPaste this into the collection variable 'access_token' in Postman.");
console.log("Expires in about an hour — just re-run this script for a fresh one.\n");
