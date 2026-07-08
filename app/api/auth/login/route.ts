// app/api/auth/login/route.ts
// POST — sign in an existing registered user.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { signToken } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña son requeridos." },
        { status: 400 }
      );
    }

    const rows = await db
      .select()
      .from(users)
      .where(eq(users.email, email.trim().toLowerCase()))
      .limit(1);

    if (rows.length === 0 || !rows[0].passwordHash) {
      return NextResponse.json(
        { error: "Credenciales inválidas." },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, rows[0].passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Credenciales inválidas." },
        { status: 401 }
      );
    }

    const user = rows[0];
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
  } catch {
    return NextResponse.json(
      { error: "No pudimos iniciar sesión." },
      { status: 500 }
    );
  }
}
