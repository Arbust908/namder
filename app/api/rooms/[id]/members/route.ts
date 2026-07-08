// app/api/rooms/[id]/members/route.ts
// GET — list all members in a room (for the group view).

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { members } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const rows = await db
    .select({
      id: members.id,
      roomId: members.roomId,
      userId: members.userId,
      display: members.display,
      done: members.done,
    })
    .from(members)
    .where(eq(members.roomId, params.id))
    .orderBy(members.createdAt);

  return NextResponse.json(rows);
}
