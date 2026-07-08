// lib/types.ts
// Shared types for the Namder domain model.
// These were previously PocketBase record interfaces; now they're plain domain types.

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
  ownerId: string | null;
}

export interface MemberRecord {
  id: string;
  roomId: string;
  userId: string;
  display: string;
  done: boolean;
}

export interface VoteRecord {
  id: string;
  roomId: string;
  userId: string;
  nameId: string;
  liked: boolean;
}

