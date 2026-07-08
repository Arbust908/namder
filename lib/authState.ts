// lib/authState.ts
// One place the UI can ask "what am I looking at right now" — a guest, a
// registered user, or nobody yet.

import { getToken, getProfile } from "@/lib/api-client";

export type AuthState =
  | { kind: "anonymous" }
  | { kind: "guest"; userId: string; display: string }
  | { kind: "registered"; userId: string; email: string; display: string };

export function getAuthState(): AuthState {
  const token = getToken();
  const profile = getProfile();

  if (!token || !profile) return { kind: "anonymous" };

  if (profile.isGuest) {
    return { kind: "guest", userId: profile.id, display: profile.display || "Guest" };
  }

  return {
    kind: "registered",
    userId: profile.id,
    email: profile.email || "",
    display: profile.display || profile.email || "",
  };
}

/** Should we show a "Save your progress" nudge? */
export function shouldOfferUpgrade(hasActivity: boolean): boolean {
  const state = getAuthState();
  return state.kind === "guest" && hasActivity;
}
