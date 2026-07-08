// app/api/rooms/route.ts
// GET  — find a room by code (?code=XXXXXX)
// POST — create a new room and return its join code.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rooms } from "@/lib/schema";
import { verifyToken } from "@/lib/auth";
import { eq } from "drizzle-orm";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function makeCode(len = 6) {
  let s = "";
  for (let i = 0; i < len; i++)
    s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s;
}

// GET /api/rooms?code=XXXXXX
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "code required" }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(rooms)
    .where(eq(rooms.code, code.toUpperCase()))
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
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
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const payload = token ? await verifyToken(token) : null;

  const { gender } = await req.json();
  if (!["girl", "boy", "either"].includes(gender)) {
    return NextResponse.json({ error: "bad gender" }, { status: 400 });
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
        return NextResponse.json({ error: "create failed" }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ error: "no free code" }, { status: 503 });
}
