// app/api/rooms/route.ts
// GET  ?code=XXXXXX — find a room by code
//      ?mine=true   — list rooms the authenticated user is a member of
// POST — create a new room and return its join code.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rooms, members, votes } from "@/lib/schema";
import { getAuthPayload, UNAUTHORIZED } from "@/lib/auth";
import { isAssignableGender } from "@/lib/types";
import { eq, inArray, sql } from "drizzle-orm";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function makeCode(len = 6) {
  let s = "";
  for (let i = 0; i < len; i++)
    s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s;
}

// GET /api/rooms?code=XXXXXX | ?mine=true
export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const code = url.searchParams.get("code");
  const mine = url.searchParams.get("mine");

  // ?mine=true — list rooms the authenticated user belongs to
  if (mine === "true") {
    const payload = await getAuthPayload(req);
    if (!payload) return UNAUTHORIZED();

    const rows = await db
      .select({
        id: rooms.id,
        code: rooms.code,
        gender: rooms.gender,
        status: rooms.status,
        ownerId: rooms.ownerId,
        createdAt: rooms.createdAt,
        memberId: members.id,
        done: members.done,
      })
      .from(members)
      .innerJoin(rooms, eq(members.roomId, rooms.id))
      .where(eq(members.userId, payload.sub))
      .orderBy(sql`${members.createdAt} DESC`);

    if (rows.length === 0) return NextResponse.json([]);

    const roomIds = rows.map((r) => r.id);

    // Fetch member counts and vote counts per room in parallel, scoped to
    // the rooms this user belongs to.
    const [memberCounts, voteCounts] = await Promise.all([
      db
        .select({
          roomId: members.roomId,
          count: sql<number>`count(*)::int`,
        })
        .from(members)
        .where(inArray(members.roomId, roomIds))
        .groupBy(members.roomId)
        .then((r) => {
          const map = new Map<string, number>();
          for (const row of r) map.set(row.roomId, row.count);
          return map;
        }),
      db
        .select({
          roomId: votes.roomId,
          count: sql<number>`count(*)::int`,
        })
        .from(votes)
        .where(eq(votes.userId, payload.sub))
        .groupBy(votes.roomId)
        .then((r) => {
          const map = new Map<string, number>();
          for (const row of r) map.set(row.roomId, row.count);
          return map;
        }),
    ]);

    return NextResponse.json(
      rows.map((r) => ({
        id: r.id,
        code: r.code,
        gender: r.gender,
        status: r.status,
        ownerId: r.ownerId,
        createdAt: r.createdAt,
        memberId: r.memberId,
        done: r.done,
        memberCount: memberCounts.get(r.id) ?? 1,
        voteCount: voteCounts.get(r.id) ?? 0,
      }))
    );
  }

  // ?code=XXXXXX — find a room by shareable code
  if (!code) {
    return NextResponse.json({ error: "Se requiere un código." }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(rooms)
    .where(eq(rooms.code, code.toUpperCase()))
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json({ error: "Sala no encontrada." }, { status: 404 });
  }

  const r = rows[0];
  return NextResponse.json({
    id: r.id,
    code: r.code,
    gender: r.gender,
    status: r.status,
    ownerId: r.ownerId,
  });
}

// POST /api/rooms
export async function POST(req: NextRequest) {
  const payload = await getAuthPayload(req);

  const { gender } = await req.json();
  if (typeof gender !== "string" || !isAssignableGender(gender)) {
    return NextResponse.json({ error: "Género inválido." }, { status: 400 });
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = makeCode();
    try {
      const [room] = await db
        .insert(rooms)
        .values({
          code,
          gender,
          status: "lobby",
          ownerId: payload?.sub ?? null,
        })
        .returning();

      return NextResponse.json({
        id: room.id,
        code: room.code,
        gender: room.gender,
        status: room.status,
        ownerId: room.ownerId,
      });
    } catch (e: any) {
      // Retry on unique violation (code collision).
      if (e?.code !== "23505") {
        return NextResponse.json(
          { error: "No pudimos crear la sala." },
          { status: 500 }
        );
      }
    }
  }

  return NextResponse.json(
    { error: "No hay códigos disponibles. Reintentá." },
    { status: 503 }
  );
}
