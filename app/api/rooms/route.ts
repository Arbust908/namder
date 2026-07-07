// app/api/rooms/route.ts
// POST -> create a room, return its join code.
// Thin BFF: generates a collision-checked code server-side so two phones
// can't grab the same one.
import { NextRequest, NextResponse } from "next/server";
import { getServerPb } from "@/lib/pb";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1 ambiguity
function makeCode(len = 6) {
  let s = "";
  for (let i = 0; i < len; i++)
    s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s;
}

export async function POST(req: NextRequest) {
  const { gender, ownerToken } = await req.json();
  if (!["girl", "boy", "either"].includes(gender)) {
    return NextResponse.json({ error: "bad gender" }, { status: 400 });
  }

  const pb = getServerPb();
  // The caller passes its auth token so the room is owned by that user.
  if (ownerToken) pb.authStore.save(ownerToken, null);

  // Retry until we land a free code (collisions are rare at 6 chars).
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = makeCode();
    try {
      const room = await pb.collection("rooms").create({
        code,
        gender,
        status: "lobby",
        owner: pb.authStore.record?.id,
      });
      return NextResponse.json({ id: room.id, code: room.code });
    } catch (e: any) {
      // unique-constraint violation -> try a new code; anything else -> bail
      if (e?.status !== 400) {
        return NextResponse.json({ error: "create failed" }, { status: 500 });
      }
    }
  }
  return NextResponse.json({ error: "no free code" }, { status: 503 });
}
