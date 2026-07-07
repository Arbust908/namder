// lib/vote.ts
// Cast (or change) a vote. Upserts so re-swiping a name overwrites the old
// choice. The PocketBase hook recomputes the match row from here.
import { getBrowserPb } from "@/lib/pb";
import type { NameRecord } from "@/lib/types";

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
export async function loadDeck(roomId: string, gender: "girl" | "boy" | "either") {
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
  const votedIds = new Set(myVotes.map((v) => v.name));

	const deck = (names as unknown as NameRecord[]).filter((n) => !votedIds.has(n.id));
	// Fisher-Yates shuffle — unbiased, unlike sort(() => Math.random() - 0.5)
	for (let i = deck.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[deck[i], deck[j]] = [deck[j], deck[i]];
	}
	return deck;
}
