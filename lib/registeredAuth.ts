// lib/registeredAuth.ts
// The "I want an account" flow — sits next to lib/guestAuth.ts.
//
// Three entry points:
//   1. registerNew(email, password, display)   — brand-new registered user
//   2. login(email, password)                  — existing registered user
//   3. upgradeGuestToRegistered(email, password) — turn *this device's*
//      current guest into a real account, same record id, so all of its
//      votes/memberships carry over untouched.
//
// PocketBase has no special "anonymous auth" primitive — this is the
// documented pattern (confirmed against PocketBase's own discussion of the
// topic): create the guest with a random password behind the scenes, and on
// "register", update() that same record with the email + password the person
// actually chose. Nothing about votes/members/matches needs to change because
// the user id never changes.

import { getBrowserPb } from "@/lib/pb";
import { ensureGuest, forgetGuest } from "@/lib/guestAuth";

type AuthResult = { userId: string; isNewAccount: boolean };

/** Brand-new registered account, no prior guest activity attached. */
export async function registerNew(
  email: string,
  password: string,
  display?: string
): Promise<AuthResult> {
  const pb = getBrowserPb();
  await pb.collection("users").create({
    email,
    password,
    passwordConfirm: password,
    display: display?.trim() || email.split("@")[0],
    is_guest: false,
  });
  await pb.collection("users").authWithPassword(email, password);
  persist(pb);
  return { userId: pb.authStore.record!.id, isNewAccount: true };
}

/** Existing registered user signing back in (any device). */
export async function login(email: string, password: string): Promise<AuthResult> {
  const pb = getBrowserPb();
  await pb.collection("users").authWithPassword(email, password);
  persist(pb);
  return { userId: pb.authStore.record!.id, isNewAccount: false };
}

/**
 * Turn the CURRENT device's guest session into a real account.
 * Same record id -> existing votes/memberships/matches are untouched.
 * Call this from a "Save your progress / create an account" prompt.
 */
export async function upgradeGuestToRegistered(
  email: string,
  password: string
): Promise<AuthResult> {
  const pb = getBrowserPb();

  // Make sure we actually have a guest session to upgrade.
  const { userId } = await ensureGuest();

  await pb.collection("users").update(userId, {
    email,
    password,
    passwordConfirm: password,
    is_guest: false,
    emailVisibility: true,
  });

  // Password/email changes invalidate old tokens — re-authenticate.
  await pb.collection("users").authWithPassword(email, password);
  persist(pb);
  return { userId, isNewAccount: false };
}

/** Sign out. For a registered user this is a real logout (no data loss —
 *  they can log back in from any device). For a guest, prefer forgetGuest()
 *  instead, since clearing the session there also drops the local secret. */
export function logout(): void {
  const pb = getBrowserPb();
  pb.authStore.clear();
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem("namder.pb.auth");
  }
}

/** True if the currently authenticated record is still a guest. */
export function isGuestSession(): boolean {
  const pb = getBrowserPb();
  return Boolean(pb.authStore.record?.is_guest);
}

function persist(pb: ReturnType<typeof getBrowserPb>) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(
    "namder.pb.auth",
    JSON.stringify({ token: pb.authStore.token, record: pb.authStore.record })
  );
}

// Re-export so callers only need one module for "do I have identity yet".
export { ensureGuest, forgetGuest };
