// lib/types.ts
// Shared types for the Namder domain model.
// These were previously PocketBase record interfaces; now they're plain domain types.

export const GENDERS = {
  girl: "girl",
  boy: "boy",
  either: "either",
  unknown: "unknown",
} as const;

export type Gender = (typeof GENDERS)[keyof typeof GENDERS];

export function isGender(value: string): value is Gender {
  return value in GENDERS;
}

export type AssignableGender = Exclude<Gender, "unknown">;

export const ASSIGNABLE_GENDERS: AssignableGender[] = (
  Object.values(GENDERS) as Gender[]
).filter((g): g is AssignableGender => g !== "unknown");

export function isAssignableGender(value: string): value is AssignableGender {
  return (ASSIGNABLE_GENDERS as string[]).includes(value);
}

export const GENDER_LABELS: Record<Gender, string> = {
  girl: "Niña",
  boy: "Niño",
  either: "Either",
  unknown: "N/A",
};

export interface NameRecord {
  id: string;
  name: string;
  gender: Gender;
  origin: string;
  meaning: string;
  source?: string;
}

export interface RoomRecord {
  id: string;
  code: string;
  gender: Gender;
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

