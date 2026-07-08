// app/api/auth/guest/route.ts
// POST — create or restore a guest session.
// Body: { uuid, displayName? }
// Returns: { token, profile }

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { signToken } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  // 1. Parse body
  let uuid: string;
  let displayName: string | undefined;
  try {
    const body = await req.json();
    uuid = body.uuid;
    displayName = body.displayName;
  } catch (e: any) {
    console.error("[guest] parse body failed", e);
    return NextResponse.json(
      { error: "Cuerpo inválido.", detail: e?.message },
      { status: 400 }
    );
  }

  if (!uuid || typeof uuid !== "string") {
    return NextResponse.json({ error: "Se requiere un uuid." }, { status: 400 });
  }

  // 2. Look up existing guest
  let existing: (typeof users.$inferSelect)[];
  try {
    existing = await db
      .select()
      .from(users)
      .where(and(eq(users.guestUuid, uuid), eq(users.isGuest, true)))
      .limit(1);
  } catch (e: any) {
    console.error("[guest] db select failed", e);
    return NextResponse.json(
      { error: "Error consultando usuario.", detail: e?.message, code: e?.code },
      { status: 500 }
    );
  }

  // 3. Create or update user
  let user: typeof users.$inferSelect;
  try {
    if (existing.length > 0) {
      user = existing[0];
      if (displayName && displayName !== user.display) {
        const [updated] = await db
          .update(users)
          .set({ display: displayName, updatedAt: new Date() })
          .where(eq(users.id, user.id))
          .returning();
        user = updated;
      }
    } else {
      const [created] = await db
        .insert(users)
        .values({
          guestUuid: uuid,
          display: displayName || "Guest",
          isGuest: true,
        })
        .returning();
      user = created;
    }
  } catch (e: any) {
    console.error("[guest] db upsert failed", e);
    if (e?.code === "23505") {
      return NextResponse.json(
        { error: "Conflicto, reintentá.", detail: e?.detail },
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
      isGuest: true,
    });
  } catch (e: any) {
    console.error("[guest] signToken failed", e);
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
      isGuest: true,
    },
  });
}
