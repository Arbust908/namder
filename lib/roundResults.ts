// lib/roundResults.ts
// Data for the "how did this round go" table shown right after someone
// finishes swiping through their 20 names.
//
// The matches/stars are computed server-side via SQL JOIN — no materialized
// matches table needed.

import { apiGetRoundResults } from "@/lib/api-client";

export type RoundRow = {
  nameId: string;
  name: string;
  gender: "girl" | "boy";
  meaning: string;
  myVote: boolean;
  likeCount: number;
  memberCount: number;
  isStar: boolean;
};

export async function getRoundResults(
  roomId: string,
  roundSize = 20
): Promise<RoundRow[]> {
  return apiGetRoundResults(roomId, roundSize);
}
