// app/api/auth/upgrade/route.ts
// PATCH — upgrade the current guest session to a registered account.
// Keeps the same user.id so votes/memberships carry over.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { signToken, verifyToken } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload || !payload.isGuest) {
    return NextResponse.json({ error: "not a guest session" }, { status: 403 });
  }

  try {
    const { email, password } = await req.json();
    if (!email || !password || password.length < 8) {
      return NextResponse.json({ error: "invalid input" }, { status: 400 });
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
      return NextResponse.json({ error: "user not found" }, { status: 404 });
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
      return NextResponse.json({ error: "Ese email ya está en uso." }, { status: 409 });
    }
    return NextResponse.json({ error: "upgrade failed" }, { status: 500 });
  }
}
