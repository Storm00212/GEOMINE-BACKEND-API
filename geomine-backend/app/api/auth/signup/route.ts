import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

import { query } from "@/lib/db";
import { signAccessToken } from "@/lib/auth/jwt";
import { handleApiError } from "@/lib/http";

// POST /api/auth/signup
export async function POST(request: NextRequest) {
  try {
    const { email, password, role } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Public self-signup is locked to the `miner` role. Higher-privilege
    // roles (it, admin) are created via POST /api/admin/invite, which
    // issues a temporary password the admin relays to the new user. We
    // silently coerce any non-miner role to miner here so a tampered
    // client can't escalate; the response status is still 200, but the
    // resulting account has miner-only permissions.
    const resolvedRole = "miner";

    const existing = await query<{ id: string }>(
      `select id from app_users where email = $1 limit 1`,
      [email]
    );

    if (existing[0]) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const userId = randomUUID();
    const password_hash = await bcrypt.hash(password, 10);

    await query(
      `insert into app_users (id, email, password_hash, role, created_at)
       values ($1, $2, $3, $4, now())`,
      [userId, email, password_hash, resolvedRole]
    );

    // Keep your existing profile interface; store minimal profile row.
    await query(
      `insert into profiles (id, full_name, role, created_at)
       values ($1, null, $2, now())
       on conflict (id) do update set role = excluded.role`,
      [userId, resolvedRole]
    );

    const token = signAccessToken({ sub: userId, role: resolvedRole });
    return NextResponse.json({ accessToken: token });
  } catch (error) {
    return handleApiError(error);
  }
}

