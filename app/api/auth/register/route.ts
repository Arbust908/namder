// app/api/auth/register/route.ts
// POST — create a new registered user account.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { signToken } from "@/lib/auth";
import { hashPassword } from "@/lib/password";

export async function POST(req: NextRequest) {
  try {
    const { email, password, display } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "email and password required" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "password too short" }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    const [user] = await db
      .insert(users)
      .values({
        email: email.trim().toLowerCase(),
        passwordHash,
        display: display?.trim() || email.split("@")[0],
        isGuest: false,
      })
      .returning();

    const token = await signToken({
      sub: user.id,
      display: user.display,
      isGuest: false,
      email: user.email!,
    });

    return NextResponse.json({
      token,
      profile: {
        id: user.id,
        display: user.display,
        isGuest: false,
        email: user.email!,
      },
    });
  } catch (e: any) {
    if (e?.code === "23505") {
      return NextResponse.json({ error: "Ese email ya está registrado." }, { status: 409 });
    }
    return NextResponse.json({ error: "registration failed" }, { status: 500 });
  }
}
