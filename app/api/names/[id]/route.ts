// app/api/names/[id]/route.ts
// PATCH — update a name's gender. Curator-only: registered user whose
// email is in CURATION_ALLOWLIST.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { names } from "@/lib/schema";
import { getAuthPayload, UNAUTHORIZED } from "@/lib/auth";
import { CURATION_ALLOWLIST } from "@/lib/curationAllowlist";
import { isAssignableGender } from "@/lib/types";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const payload = await getAuthPayload(req);
  if (
    !payload ||
    payload.isGuest ||
    !payload.email ||
    !CURATION_ALLOWLIST.includes(payload.email)
  ) {
    return UNAUTHORIZED();
  }

  const { gender } = await req.json();
  if (typeof gender !== "string" || !isAssignableGender(gender)) {
    return NextResponse.json({ error: "Género inválido." }, { status: 400 });
  }

  const [updated] = await db
    .update(names)
    .set({ gender })
    .where(eq(names.id, params.id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  }

  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    gender: updated.gender,
    origin: updated.origin,
    meaning: updated.meaning,
  });
}
