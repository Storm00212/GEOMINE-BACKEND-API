#!/usr/bin/env node
// Local-dev-only helper: generates a real access token for an
// ALREADY-EXISTING user (a row in app_users), without waiting on email.
//
// How it works: queries Neon Postgres directly for the user's id + role,
// then signs a JWT with jsonwebtoken — exactly the token the API accepts
// (see lib/auth/jwt.ts). Never sends an email, never opens a browser.
//
// This is a standalone CLI script — never an HTTP route, never deployed,
// only reachable by whoever has this repo and the local .env.local file.
//
// Usage:
//   node scripts/dev-login.mjs someone@geomine.com

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { Pool } from "pg";
import jwt from "jsonwebtoken";

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
const databaseUrl = env.DATABASE_URL;
const jwtSecret = env.JWT_SECRET;

if (!databaseUrl || !jwtSecret || databaseUrl.includes("your-neon-host")) {
  console.error("DATABASE_URL / JWT_SECRET aren't set in .env.local yet.");
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });

try {
  const { rows } = await pool.query(
    `select id, role from app_users where email = $1 limit 1`,
    [email]
  );
  const user = rows[0];
  if (!user) {
    console.error(
      `No app_users row for ${email} — create the user first (signup or invite via /admin/users/new).`
    );
    process.exit(1);
  }

  const token = jwt.sign({ sub: user.id, role: user.role }, jwtSecret, {
    expiresIn: "7d",
  });

  console.log(`\nAccess token for ${email} (role: ${user.role}):\n`);
  console.log(token);
  console.log("\nPaste this into the 'Authorization: Bearer' header / Postman variable.");
  console.log("Expires in 7 days — just re-run this script for a fresh one.\n");
} finally {
  await pool.end();
}
