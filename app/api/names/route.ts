// app/api/names/route.ts
// GET — list names, optionally filtered by gender (?gender=girl|boy)
// Returns public deck of names; no auth required.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { names } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const gender = req.nextUrl.searchParams.get("gender");

  const rows = gender
    ? await db.select().from(names).where(eq(names.gender, gender))
    : await db.select().from(names);

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
