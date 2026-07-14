// app/api/names/route.ts
// GET — list names, optionally filtered by gender (?gender=girl|boy)
// Returns public deck of names; no auth required.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { names } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { isGender } from "@/lib/types";

export async function GET(req: NextRequest) {
  const genderParam = req.nextUrl.searchParams.get("gender");
  const gender = genderParam && isGender(genderParam) ? genderParam : null;

  const rows = gender
    ? await db.select().from(names).where(eq(names.gender, gender)).orderBy(names.id)
    : await db.select().from(names).orderBy(names.id);

  return NextResponse.json(
    rows.map((n) => ({
      id: n.id,
      name: n.name,
      gender: n.gender,
      origin: n.origin,
      meaning: n.meaning,
    }))
  );
}
