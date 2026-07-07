// lib/types.ts
// Shared record interfaces for PocketBase collections.
// Use these with the SDK's generic methods (e.g. getFullList<NameRecord>())
// instead of casting to `any`.

export interface NameRecord {
  id: string;
  name: string;
  gender: "girl" | "boy";
  origin: string;
  meaning: string;
  source?: string;
}

export interface RoomRecord {
  id: string;
  code: string;
  gender: "girl" | "boy" | "either";
  status: "lobby" | "swiping" | "done";
  owner: string;
}

export interface MemberRecord {
  id: string;
  room: string;
  user: string;
  display: string;
  done: boolean;
}

export interface VoteRecord {
  id: string;
  room: string;
  user: string;
  name: string;
  liked: boolean;
}

export type DeckName = {
  id: string;
  name: string;
  gender: string;
  origin: string;
  meaning: string;
};
