import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { query } from "@/lib/db";
import { signAccessToken } from "@/lib/auth/jwt";
import { handleApiError } from "@/lib/http";

// POST /api/auth/login
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }
    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "password is required" }, { status: 400 });
    }

    // Custom auth schema expected (neon/mvp). If not present yet,
    // this will throw and the error handler will return 500.
    const users = await query<{
      id: string;
      email: string;
      password_hash: string;
      role: "miner" | "it" | "admin";
    }>(
      `select id, email, password_hash, role from app_users where email = $1 limit 1`,
      [email]
    );

    const user = users[0];
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = signAccessToken({ sub: user.id, role: user.role });

    return NextResponse.json({ accessToken: token });
  } catch (error) {
    return handleApiError(error);
  }
}

