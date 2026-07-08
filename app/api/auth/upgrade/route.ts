// app/api/auth/upgrade/route.ts
// PATCH — upgrade the current guest session to a registered account.
// Keeps the same user.id so votes/memberships carry over.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { signToken, getAuthPayload, UNAUTHORIZED } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest) {
  const payload = await getAuthPayload(req);
  if (!payload) return UNAUTHORIZED();

  if (!payload.isGuest) {
    return NextResponse.json(
      { error: "Esta sesión ya es una cuenta registrada." },
      { status: 403 }
    );
  }

  try {
    // 1. Parse body
    let email: string;
    let password: string;
    try {
      const body = await req.json();
      email = body.email;
      password = body.password;
    } catch (e: any) {
      console.error("[upgrade] parse body failed", e);
      return NextResponse.json(
        { error: "Cuerpo inválido.", detail: e?.message },
        { status: 400 }
      );
    }

    if (!email || !password || password.length < 8) {
      return NextResponse.json(
        { error: "Email válido y contraseña de al menos 8 caracteres." },
        { status: 400 }
      );
    }

    // 2. Hash password
    let passwordHash: string;
    try {
      passwordHash = await hashPassword(password);
    } catch (e: any) {
      console.error("[upgrade] hashPassword failed", e);
      return NextResponse.json(
        { error: "Error procesando contraseña.", detail: e?.message },
        { status: 500 }
      );
    }

    // 3. Update user
    const [updated] = await db
      .update(users)
      .set({
        email: email.trim().toLowerCase(),
        passwordHash,
        isGuest: false,
        guestUuid: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, payload.sub))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Usuario no encontrado." },
        { status: 404 }
      );
    }

    // 4. Sign token
    let newToken: string;
    try {
      newToken = await signToken({
        sub: updated.id,
        display: updated.display,
        isGuest: false,
        email: updated.email!,
      });
    } catch (e: any) {
      console.error("[upgrade] signToken failed", e);
      return NextResponse.json(
        { error: "Error generando token.", detail: e?.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      token: newToken,
      profile: {
        id: updated.id,
        display: updated.display,
        isGuest: false,
        email: updated.email!,
      },
    });
  } catch (e: any) {
    console.error("[upgrade] db update failed", e);
    if (e?.code === "23505") {
      return NextResponse.json(
        { error: "Ese email ya está en uso.", detail: e?.detail },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Error actualizando usuario.", detail: e?.message, code: e?.code },
      { status: 500 }
    );
  }
}
