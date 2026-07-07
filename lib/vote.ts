// lib/vote.ts
// Cast (or change) a vote. Upserts so re-swiping a name overwrites the old
// choice. The PocketBase hook recomputes the match row from here.
import { getBrowserPb } from "@/lib/pb";

export async function castVote(opts: {
  roomId: string;
  nameId: string;
  liked: boolean;
}) {
  const pb = getBrowserPb();
  const userId = pb.authStore.record?.id;
  if (!userId) throw new Error("not authenticated");

  const filter = `room = "${opts.roomId}" && user = "${userId}" && name = "${opts.nameId}"`;

  try {
    const existing = await pb.collection("votes").getFirstListItem(filter);
    return pb.collection("votes").update(existing.id, { liked: opts.liked });
  } catch {
    // no existing vote -> create
    return pb.collection("votes").create({
      room: opts.roomId,
      user: userId,
      name: opts.nameId,
      liked: opts.liked,
    });
  }
}

// The deck for a member = names matching the room's gender, minus the ones
// this user already voted on.
export async function loadDeck(roomId: string, gender: string) {
  const pb = getBrowserPb();
  const userId = pb.authStore.record?.id;

  const genderFilter =
    gender === "either" ? "" : `gender = "${gender}"`;
  const names = await pb.collection("names").getFullList({
    filter: genderFilter || undefined,
  });

  const myVotes = await pb.collection("votes").getFullList({
    filter: `room = "${roomId}" && user = "${userId}"`,
    fields: "name",
  });
  const votedIds = new Set(myVotes.map((v: any) => v.name));

  return names
    .filter((n: any) => !votedIds.has(n.id))
    .sort(() => Math.random() - 0.5);
}
