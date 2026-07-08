// lib/registeredAuth.ts
// The "I want an account" flow — sits next to lib/guestAuth.ts.
//
// Three entry points:
//   1. registerNew(email, password, display)  — brand-new registered user
//   2. login(email, password)                 — existing registered user
//   3. upgradeGuestToRegistered(email, password) — turn the current guest
//      into a real account, same user id, so all votes/memberships carry over.

import {
  getProfile,
  saveToken,
  clearSession,
  apiRegister,
  apiLogin,
  apiUpgradeGuest,
} from "@/lib/api-client";

type AuthResult = { userId: string; isNewAccount: boolean };

/** Brand-new registered account, no prior guest activity attached. */
export async function registerNew(
  email: string,
  password: string,
  display?: string
): Promise<AuthResult> {
  const { token, profile } = await apiRegister({
    email: email.trim(),
    password,
    display: display?.trim(),
  });
  saveToken(token, profile);
  return { userId: profile.id, isNewAccount: true };
}

/** Existing registered user signing back in (any device). */
export async function login(
  email: string,
  password: string
): Promise<AuthResult> {
  const { token, profile } = await apiLogin({
    email: email.trim(),
    password,
  });
  saveToken(token, profile);
  return { userId: profile.id, isNewAccount: false };
}

/**
 * Turn the CURRENT device's guest session into a real account.
 * Same record id → existing votes/memberships are untouched.
 */
export async function upgradeGuestToRegistered(
  email: string,
  password: string
): Promise<AuthResult> {
  const profile = getProfile();
  if (!profile) throw new Error("no session");

  const { token, profile: newProfile } = await apiUpgradeGuest({
    email: email.trim(),
    password,
  });
  saveToken(token, newProfile);
  return { userId: newProfile.id, isNewAccount: false };
}

/** Sign out. */
export function logout(): void {
  clearSession();
}

/** True if the currently authenticated user is still a guest. */
export function isGuestSession(): boolean {
  return getProfile()?.isGuest ?? false;
}
