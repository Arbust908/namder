// lib/authState.ts
// One place the UI can ask "what am I looking at right now" — a guest, a
// registered user, or nobody yet. Keeps the two auth flows (guestAuth.ts,
// registeredAuth.ts) decoupled from how the UI decides what to show.

import { getBrowserPb } from "@/lib/pb";

export type AuthState =
  | { kind: "anonymous" }                                   // no session at all yet
  | { kind: "guest"; userId: string; display: string }       // UUID-backed guest
  | { kind: "registered"; userId: string; email: string; display: string };

export function getAuthState(): AuthState {
  const pb = getBrowserPb();
  const record = pb.authStore.record;

  if (!record || !pb.authStore.isValid) return { kind: "anonymous" };

  if (record.is_guest) {
    return { kind: "guest", userId: record.id, display: record.display || "Guest" };
  }

  return {
    kind: "registered",
    userId: record.id,
    email: record.email,
    display: record.display || record.email,
  };
}

/**
 * Convenience for gating UI: should we show a "Save your progress / create an
 * account" nudge? True only for guests who have actually done something
 * (caller passes whether they've joined a group / cast votes) — no point
 * nagging someone who just opened the app.
 */
export function shouldOfferUpgrade(hasActivity: boolean): boolean {
  const state = getAuthState();
  return state.kind === "guest" && hasActivity;
}
