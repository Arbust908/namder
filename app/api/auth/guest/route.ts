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
  try {
    const { uuid, displayName } = await req.json();
    if (!uuid || typeof uuid !== "string") {
      return NextResponse.json({ error: "Se requiere un uuid." }, { status: 400 });
    }

    const existing = await db
      .select()
      .from(users)
      .where(and(eq(users.guestUuid, uuid), eq(users.isGuest, true)))
      .limit(1);

    let user: typeof users.$inferSelect;

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

    const token = await signToken({
      sub: user.id,
      display: user.display,
      isGuest: true,
    });

    return NextResponse.json({
      token,
      profile: {
        id: user.id,
        display: user.display,
        isGuest: true,
      },
    });
  } catch (e: any) {
    if (e?.code === "23505") {
      return NextResponse.json({ error: "Conflicto, reintentá." }, { status: 409 });
    }
    return NextResponse.json({ error: "No pudimos crear la sesión." }, { status: 500 });
  }
}
