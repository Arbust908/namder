// lib/guestAuth.ts — FIX: passes uuid to API
// Anonymous "guest" identity for Namder.
//
// A device generates a UUID once. On first use, the server creates a user
// record with is_guest=true and returns a JWT.

import {
  getToken,
  getProfile,
  saveToken,
  clearSession,
  apiGuestAuth,
  apiUpdateDisplay,
} from "@/lib/api-client";

const UUID_KEY = "namder.guest.uuid";

function newUuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getOrCreateUuid(): string {
  if (typeof localStorage === "undefined") return newUuid();
  let uuid = localStorage.getItem(UUID_KEY);
  if (!uuid) {
    uuid = newUuid();
    localStorage.setItem(UUID_KEY, uuid);
  }
  return uuid;
}

export async function ensureGuest(opts?: {
  displayName?: string;
}): Promise<{ userId: string; uuid: string }> {
  // 1) Try existing token.
  const token = getToken();
  const profile = getProfile();
  if (token && profile) {
    return { userId: profile.id, uuid: getOrCreateUuid() };
  }

  // 2) Get or create guest identity via API.
  const uuid = getOrCreateUuid();
  const displayName = opts?.displayName?.trim() || undefined;

  try {
    const { token: newToken, profile: newProfile } = await apiGuestAuth({
      uuid,
      displayName,
    });
    saveToken(newToken, newProfile);
    return { userId: newProfile.id, uuid };
  } catch {
    throw new Error("No pudimos crear tu sesión. Probá de nuevo.");
  }
}

export async function setGuestDisplay(display: string): Promise<void> {
  const profile = await apiUpdateDisplay(display.trim());
  const token = getToken();
  if (token) saveToken(token, profile);
}

export function forgetGuest(): void {
  clearSession();
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(UUID_KEY);
}
