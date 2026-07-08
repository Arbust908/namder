// app/api/auth/register/route.ts
// POST — create a new registered user account.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { signToken } from "@/lib/auth";
import { hashPassword } from "@/lib/password";

export async function POST(req: NextRequest) {
  // 1. Parse body
  let email: string;
  let password: string;
  let display: string | undefined;
  try {
    const body = await req.json();
    email = body.email;
    password = body.password;
    display = body.display;
  } catch (e: any) {
    console.error("[register] parse body failed", e);
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
  if (password.length < 8) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 8 caracteres." },
      { status: 400 }
    );
  }

  // 2. Hash password
  let passwordHash: string;
  try {
    passwordHash = await hashPassword(password);
  } catch (e: any) {
    console.error("[register] hashPassword failed", e);
    return NextResponse.json(
      { error: "Error procesando contraseña.", detail: e?.message },
      { status: 500 }
    );
  }

  // 3. Insert user
  let user: typeof users.$inferSelect;
  try {
    [user] = await db
      .insert(users)
      .values({
        email: email.trim().toLowerCase(),
        passwordHash,
        display: display?.trim() || email.split("@")[0],
        isGuest: false,
      })
      .returning();
  } catch (e: any) {
    console.error("[register] db insert failed", e);
    if (e?.code === "23505") {
      return NextResponse.json(
        { error: "Ese email ya está registrado.", detail: e?.detail },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Error guardando usuario.", detail: e?.message, code: e?.code },
      { status: 500 }
    );
  }

  // 4. Sign token
  let token: string;
  try {
    token = await signToken({
      sub: user.id,
      display: user.display,
      isGuest: false,
      email: user.email!,
    });
  } catch (e: any) {
    console.error("[register] signToken failed", e);
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
