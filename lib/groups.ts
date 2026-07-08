// lib/groups.ts
// "Groups" = rooms. A guest joins a group by its code, which creates a
// `members` row tying their user id to the room. Membership is what determines
// when a name is starred (liked by everyone).

import {
  apiFindRoom,
  apiJoinRoom,
  apiUpdateMember,
  apiLeaveRoom,
  type RoomData,
} from "@/lib/api-client";
import { ensureGuest } from "@/lib/guestAuth";

export type Room = RoomData;

/** Look up a room by its shareable code. */
export async function findRoomByCode(code: string): Promise<Room | null> {
  return apiFindRoom(code.toUpperCase());
}

/**
 * Join a group by code. Ensures a guest identity first, then creates the
 * membership (idempotent — re-joining returns the existing membership).
 */
export async function joinGroup(
  code: string,
  displayName?: string
): Promise<{ room: Room; memberId: string; userId: string }> {
  const { userId } = await ensureGuest({ displayName });

  const room = await findRoomByCode(code);
  if (!room) throw new Error("Room not found");

  const member = await apiJoinRoom(room.id, displayName);

  return { room, memberId: member.id, userId };
}

/** Leave a group (removes membership). */
export async function leaveGroup(memberId: string): Promise<void> {
  await apiLeaveRoom(memberId);
}

/** Every group this guest currently belongs to. */
export async function myGroups(): Promise<
  Array<{ memberId: string; room: Room; done: boolean }>
> {
  // This is a simplified version — for now we don't have a "my groups" API.
  // The feature wasn't wired up yet anyway.
  return [];
}

/** Mark this guest as finished swiping in a group. */
export async function markDone(memberId: string): Promise<void> {
  await apiUpdateMember(memberId, { done: true });
}
