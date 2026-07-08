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
    const { email, password } = await req.json();
    if (!email || !password || password.length < 8) {
      return NextResponse.json(
        { error: "Email válido y contraseña de al menos 8 caracteres." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

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

    const newToken = await signToken({
      sub: updated.id,
      display: updated.display,
      isGuest: false,
      email: updated.email!,
    });

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
    if (e?.code === "23505") {
      return NextResponse.json(
        { error: "Ese email ya está en uso." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "No pudimos crear la cuenta." },
      { status: 500 }
    );
  }
}
