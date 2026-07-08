// app/api/members/[id]/route.ts
// PATCH  — update a member (e.g. mark done).
// DELETE — leave a room (delete membership).

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { members } from "@/lib/schema";
import { verifyToken } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: "invalid token" }, { status: 401 });
  }

  const { done } = await req.json();

  const [updated] = await db
    .update(members)
    .set({ done: done ?? false })
    .where(
      and(eq(members.id, params.id), eq(members.userId, payload.sub))
    )
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: updated.id,
    roomId: updated.roomId,
    userId: updated.userId,
    display: updated.display,
    done: updated.done,
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: "invalid token" }, { status: 401 });
  }

  await db
    .delete(members)
    .where(
      and(eq(members.id, params.id), eq(members.userId, payload.sub))
    );

  return NextResponse.json({ ok: true });
}
