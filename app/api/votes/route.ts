// app/api/votes/route.ts
// GET  — list this user's votes in a room (?roomId=...)
// POST — cast (or update) a vote (upsert via unique index).

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { votes } from "@/lib/schema";
import { verifyToken } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: "invalid token" }, { status: 401 });
  }

  const roomId = req.nextUrl.searchParams.get("roomId");
  if (!roomId) {
    return NextResponse.json({ error: "roomId required" }, { status: 400 });
  }

  const rows = await db
    .select({ nameId: votes.nameId })
    .from(votes)
    .where(and(eq(votes.roomId, roomId), eq(votes.userId, payload.sub)));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: "invalid token" }, { status: 401 });
  }

  const { roomId, nameId, liked } = await req.json();
  if (!roomId || !nameId || typeof liked !== "boolean") {
    return NextResponse.json({ error: "invalid input" }, { status: 400 });
  }

  // Upsert: try insert first, on conflict update.
  const [vote] = await db
    .insert(votes)
    .values({
      roomId,
      userId: payload.sub,
      nameId,
      liked,
    })
    .onConflictDoUpdate({
      target: [votes.roomId, votes.userId, votes.nameId],
      set: { liked },
    })
    .returning();

  return NextResponse.json({
    id: vote.id,
    roomId: vote.roomId,
    nameId: vote.nameId,
    liked: vote.liked,
  });
}
