// app/api/rooms/[id]/results/route.ts
// GET — get round results for the current user in a room.
// Computes star status via SQL JOIN (no materialized matches table).

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { votes, members, names } from "@/lib/schema";
import { verifyToken } from "@/lib/auth";
import { eq, and, sql } from "drizzle-orm";

export async function GET(
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
  const roundSize = parseInt(req.nextUrl.searchParams.get("roundSize") || "20");

  // Get the member count for this room.
  const memberCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(members)
    .where(eq(members.roomId, roomId))
    .then((r) => r[0]?.count ?? 0);

  // Get this user's votes in the room, most recent first, capped at roundSize.
  const myVotes = await db
    .select({
      voteId: votes.id,
      nameId: votes.nameId,
      liked: votes.liked,
      nameName: names.name,
      nameGender: names.gender,
      nameMeaning: names.meaning,
    })
    .from(votes)
    .innerJoin(names, eq(votes.nameId, names.id))
    .where(and(eq(votes.roomId, roomId), eq(votes.userId, payload.sub)))
    .orderBy(sql`${votes.createdAt} DESC`)
    .limit(roundSize);

  if (myVotes.length === 0) {
    return NextResponse.json([]);
  }

  // For each name, count how many members liked it.
  const likeCounts = await db
    .select({
      nameId: votes.nameId,
      count: sql<number>`count(*)::int`,
    })
    .from(votes)
    .where(
      and(
        eq(votes.roomId, roomId),
        eq(votes.liked, true)
      )
    )
    .groupBy(votes.nameId)
    .then((rows) => {
      const map = new Map<string, number>();
      for (const r of rows) map.set(r.nameId, r.count);
      return map;
    });

  const rows = myVotes.map((v) => {
    const likeCount = likeCounts.get(v.nameId) ?? 0;
    const isStar = memberCount > 0 && likeCount >= memberCount;
    return {
      nameId: v.nameId,
      name: v.nameName,
      gender: v.nameGender as "girl" | "boy",
      meaning: v.nameMeaning || "",
      myVote: v.liked,
      likeCount,
      memberCount,
      isStar,
    };
  });

  // Sort: stars first, then liked, then alphabetical.
  rows.sort((a, b) => {
    if (a.isStar !== b.isStar) return a.isStar ? -1 : 1;
    if (a.myVote !== b.myVote) return a.myVote ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return NextResponse.json(rows);
}
