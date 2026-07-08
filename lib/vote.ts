// lib/vote.ts
// Cast (or change) a vote. Upserts so re-swiping a name overwrites the old
// choice. The "matches" (star) computation is done server-side via SQL.

import { apiCastVote, apiListNames, apiListMyVotes, type NameData } from "@/lib/api-client";

export async function castVote(opts: {
  roomId: string;
  nameId: string;
  liked: boolean;
}) {
  return apiCastVote({
    roomId: opts.roomId,
    nameId: opts.nameId,
    liked: opts.liked,
  });
}

// The deck for a member = names matching the room's gender, minus the ones
// this user already voted on.
export async function loadDeck(
  roomId: string,
  gender: "girl" | "boy" | "either"
): Promise<NameData[]> {
  const names = await apiListNames(gender === "either" ? undefined : gender);
  const myVotes = await apiListMyVotes(roomId);
  const votedIds = new Set(myVotes.map((v) => v.nameId));

  const deck = names.filter((n) => !votedIds.has(n.id));

  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
