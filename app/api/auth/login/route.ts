// app/api/auth/login/route.ts
// POST — sign in an existing registered user.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { signToken } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  // 1. Parse body
  let email: string;
  let password: string;
  try {
    const body = await req.json();
    email = body.email;
    password = body.password;
  } catch (e: any) {
    console.error("[login] parse body failed", e);
    return NextResponse.json(
      { error: "Cuerpo inválido.", detail: e?.message },
      { status: 400 }
    );
  }

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email y contraseña son requeridos." },
      { status: 400 }
    );
  }

  // 2. Look up user
  let rows: (typeof users.$inferSelect)[];
  try {
    rows = await db
      .select()
      .from(users)
      .where(eq(users.email, email.trim().toLowerCase()))
      .limit(1);
  } catch (e: any) {
    console.error("[login] db select failed", e);
    return NextResponse.json(
      { error: "Error consultando usuario.", detail: e?.message, code: e?.code },
      { status: 500 }
    );
  }

  if (rows.length === 0 || !rows[0].passwordHash) {
    return NextResponse.json(
      { error: "Credenciales inválidas." },
      { status: 401 }
    );
  }

  // 3. Verify password
  let valid: boolean;
  try {
    valid = await verifyPassword(password, rows[0].passwordHash);
  } catch (e: any) {
    console.error("[login] verifyPassword failed", e);
    return NextResponse.json(
      { error: "Error verificando contraseña.", detail: e?.message },
      { status: 500 }
    );
  }

  if (!valid) {
    return NextResponse.json(
      { error: "Credenciales inválidas." },
      { status: 401 }
    );
  }

  // 4. Sign token
  const user = rows[0];
  let token: string;
  try {
    token = await signToken({
      sub: user.id,
      display: user.display,
      isGuest: false,
      email: user.email!,
    });
  } catch (e: any) {
    console.error("[login] signToken failed", e);
    return NextResponse.json(
      { error: "Error generando token.", detail: e?.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    token,
    profile: {
      id: user.id,
      display: user.display,
      isGuest: false,
      email: user.email!,
    },
  });
}
