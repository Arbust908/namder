// app/api/users/me/route.ts
// PATCH — update the current user's display name.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { getAuthPayload, UNAUTHORIZED } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest) {
  const payload = await getAuthPayload(req);
  if (!payload) return UNAUTHORIZED();

  const { display } = await req.json();
  if (!display || typeof display !== "string") {
    return NextResponse.json(
      { error: "Se requiere un nombre." },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(users)
    .set({ display: display.trim(), updatedAt: new Date() })
    .where(eq(users.id, payload.sub))
    .returning();

  if (!updated) {
    return NextResponse.json(
      { error: "Usuario no encontrado." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    id: updated.id,
    display: updated.display,
    isGuest: updated.isGuest,
    email: updated.email,
  });
}
