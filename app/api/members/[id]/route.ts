// app/api/members/[id]/route.ts
// PATCH  — update a member (e.g. mark done).
// DELETE — leave a room (delete membership).

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { members } from "@/lib/schema";
import { getAuthPayload, UNAUTHORIZED } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const payload = await getAuthPayload(req);
  if (!payload) return UNAUTHORIZED();

  const { done } = await req.json();

  const [updated] = await db
    .update(members)
    .set({ done: done ?? false })
    .where(
      and(eq(members.id, params.id), eq(members.userId, payload.sub))
    )
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "No encontrado." }, { status: 404 });
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
  const payload = await getAuthPayload(req);
  if (!payload) return UNAUTHORIZED();

  await db
    .delete(members)
    .where(
      and(eq(members.id, params.id), eq(members.userId, payload.sub))
    );

  return NextResponse.json({ ok: true });
}
