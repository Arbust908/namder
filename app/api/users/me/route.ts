// app/api/users/me/route.ts
// PATCH — update the current user's display name.
// Requires auth token.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { verifyToken } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: "invalid token" }, { status: 401 });
  }

  const { display } = await req.json();
  if (!display || typeof display !== "string") {
    return NextResponse.json({ error: "display required" }, { status: 400 });
  }

  const [updated] = await db
    .update(users)
    .set({ display: display.trim(), updatedAt: new Date() })
    .where(eq(users.id, payload.sub))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "user not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: updated.id,
    display: updated.display,
    isGuest: updated.isGuest,
    email: updated.email,
  });
}
