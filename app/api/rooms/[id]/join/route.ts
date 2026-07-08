// app/api/rooms/[id]/join/route.ts
// POST — join a room as the current user (guest or registered).
// Creates a membership row (idempotent).

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { members, rooms } from "@/lib/schema";
import { verifyToken } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function POST(
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

  const roomId = params.id;

  // Verify room exists.
  const roomRows = await db
    .select({ id: rooms.id })
    .from(rooms)
    .where(eq(rooms.id, roomId))
    .limit(1);
  if (roomRows.length === 0) {
    return NextResponse.json({ error: "room not found" }, { status: 404 });
  }

  // Check if already a member.
  const existing = await db
    .select()
    .from(members)
    .where(and(eq(members.roomId, roomId), eq(members.userId, payload.sub)))
    .limit(1);

  if (existing.length > 0) {
    const m = existing[0];
    return NextResponse.json({
      id: m.id,
      roomId: m.roomId,
      userId: m.userId,
      display: m.display,
      done: m.done,
    });
  }

  // Create membership.
  const { displayName } = await req.json().catch(() => ({}));
  const [member] = await db
    .insert(members)
    .values({
      roomId,
      userId: payload.sub,
      display: displayName?.trim() || payload.display || "Guest",
      done: false,
    })
    .returning();

  return NextResponse.json({
    id: member.id,
    roomId: member.roomId,
    userId: member.userId,
    display: member.display,
    done: member.done,
  });
}
