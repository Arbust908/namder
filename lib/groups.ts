// lib/groups.ts
// "Groups" = rooms. A guest joins a group by its code, which creates a
// `members` row tying their user id to the room. Membership is what the match
// hook counts when deciding if a name is starred (liked by everyone).

import { getBrowserPb } from "@/lib/pb";
import { ensureGuest } from "@/lib/guestAuth";
import type { RoomRecord, MemberRecord } from "@/lib/types";

export type Room = RoomRecord;

/** Look up a room by its shareable code. */
export async function findRoomByCode(code: string): Promise<Room | null> {
  const pb = getBrowserPb();
  try {
    return await pb
      .collection("rooms")
      .getFirstListItem<Room>(`code = "${code.toUpperCase()}"`);
  } catch {
    return null;
  }
}

/**
 * Join a group by code. Ensures a guest identity first, then creates the
 * membership (idempotent — re-joining returns the existing membership thanks
 * to the unique (room, user) index).
 */
export async function joinGroup(
  code: string,
  displayName?: string
): Promise<{ room: Room; memberId: string; userId: string }> {
  const pb = getBrowserPb();
  const { userId } = await ensureGuest({ displayName });

  const room = await findRoomByCode(code);
  if (!room) throw new Error("Room not found");

  // already a member?
  try {
    const existing = await pb
      .collection("members")
      .getFirstListItem(`room = "${room.id}" && user = "${userId}"`);
    return { room, memberId: existing.id, userId };
  } catch {
    // not yet — create membership
  }

  const member = await pb.collection("members").create({
    room: room.id,
    user: userId,
    display: displayName?.trim() || "Guest",
    done: false,
  });

  return { room, memberId: member.id, userId };
}

/** Leave a group (removes membership; the hook recomputes stars for the room). */
export async function leaveGroup(memberId: string): Promise<void> {
  const pb = getBrowserPb();
  await pb.collection("members").delete(memberId);
}

/** Every group this guest currently belongs to (for a "my rooms" screen). */
export async function myGroups(): Promise<
  Array<{ memberId: string; room: Room; done: boolean }>
> {
  const pb = getBrowserPb();
  const { userId } = await ensureGuest();
  const rows = await pb.collection("members").getFullList({
    filter: `user = "${userId}"`,
    expand: "room",
    sort: "-created",
  });
  return rows.map((m) => ({
    memberId: m.id,
    done: m.done,
    room: (m as unknown as MemberRecord & { expand?: { room?: RoomRecord } }).expand?.room as Room,
  }));
}

/** Mark this guest as finished swiping in a group. */
export async function markDone(memberId: string): Promise<void> {
  const pb = getBrowserPb();
  await pb.collection("members").update(memberId, { done: true });
}
