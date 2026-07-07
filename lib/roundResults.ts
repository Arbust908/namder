// lib/roundResults.ts
// Data for the "how did this round go" table shown right after someone
// finishes swiping through their 20 names: for each name they saw, what did
// *I* pick, and is it currently a group ⭐ match.
//
// This deliberately does NOT wait for everyone else to finish — a person's
// own picks are known the moment they're done, and `matches.is_star` will
// keep updating live in the background. So this table can show
// "3/5 matched so far" and the star will flip on if a holdout later says yes.

import { getBrowserPb } from "@/lib/pb";
import type { NameRecord, VoteRecord } from "@/lib/types";

export type RoundRow = {
  nameId: string;
  name: string;
  gender: "girl" | "boy";
  meaning: string;
  myVote: boolean;       // true = liked, false = passed
  likeCount: number;     // how many in the room like it so far
  memberCount: number;   // room size right now
  isStar: boolean;       // liked by everyone currently in the room
};

/**
 * Fetch this round's results: the names this user just voted on (typically
 * the last `roundSize` votes cast in this room by this user), joined against
 * the room's live match tally.
 */
export async function getRoundResults(
  roomId: string,
  roundSize = 20
): Promise<RoundRow[]> {
  const pb = getBrowserPb();
  const userId = pb.authStore.record?.id;
  if (!userId) throw new Error("not authenticated");

  // My votes in this room, most recent first, capped to this round's size.
  const myVotes = await pb.collection("votes").getFullList({
    filter: `room = "${roomId}" && user = "${userId}"`,
    sort: "-created",
    expand: "name",
  });
  const roundVotes = (myVotes as unknown as VoteRecord[]).slice(0, roundSize);
  if (roundVotes.length === 0) return [];

  const nameIds = roundVotes.map((v) => v.name);

  // Current match tally for exactly these names in this room.
  const filter = `room = "${roomId}" && (${nameIds
    .map((id) => `name = "${id}"`)
    .join(" || ")})`;
  const matchRows = await pb.collection("matches").getFullList({ filter });
  const matchByName = new Map(matchRows.map((m) => [m.name, m]));

  const memberCount = await pb.collection("members").getFullList({
    filter: `room = "${roomId}"`,
  }).then((rows) => rows.length);

  return roundVotes
    .map((v) => {
      const n = (v as unknown as { expand?: { name?: NameRecord } }).expand?.name;
      if (!n) return null;
      const match = matchByName.get(v.name);
      return {
        nameId: v.name,
        name: n.name,
        gender: n.gender,
        meaning: n.meaning,
        myVote: v.liked,
        likeCount: match?.like_count ?? (v.liked ? 1 : 0),
        memberCount,
        isStar: match?.is_star ?? false,
      } as RoundRow;
    })
    .filter((r: RoundRow | null): r is RoundRow => r !== null)
    // stars first, then names I liked, then the rest
    .sort((a, b) => {
      if (a.isStar !== b.isStar) return a.isStar ? -1 : 1;
      if (a.myVote !== b.myVote) return a.myVote ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
}
