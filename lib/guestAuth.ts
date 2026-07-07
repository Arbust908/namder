// lib/guestAuth.ts
// Anonymous "guest" identity for Namder.
//
// A device generates a UUID once and becomes a real PocketBase auth record
// behind the scenes (PB auth needs an email + password, so we synthesize
// throwaway ones). The UUID is the durable identity; the token is persisted
// locally so the same guest comes back across reloads — and can rejoin their
// groups from results, history, etc.
//
// NOTE: localStorage is used for token persistence. In a normal browser/PWA
// this is exactly what you want. (It won't persist inside sandboxed preview
// frames, but works in a real deployment.)

import { getBrowserPb } from "@/lib/pb";

const TOKEN_KEY = "namder.pb.auth";   // persisted PB auth payload
const UUID_KEY = "namder.guest.uuid"; // durable device id

// crypto.randomUUID is available in all modern browsers + node 19+.
function newUuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // fallback
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function guestEmail(uuid: string) {
  // synthetic, never emailed — just satisfies the auth collection's identity field
  return `${uuid}@guest.namder.local`;
}

// Strong-enough random password for the throwaway record.
function randomSecret(len = 32): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Ensure the device is authenticated as its guest user.
 * - Reuses a persisted, still-valid token if present.
 * - Otherwise creates the guest user (first run) or re-auths if the token
 *   expired but we still hold the uuid + secret.
 */
export async function ensureGuest(opts?: {
  displayName?: string;
}): Promise<{ userId: string; uuid: string }> {
  const pb = getBrowserPb();

  // 1) Try to restore a persisted session.
  const saved =
    typeof localStorage !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
  if (saved) {
    try {
      const { token, record } = JSON.parse(saved);
      pb.authStore.save(token, record);
      // cheap validity check / refresh
      await pb.collection("users").authRefresh();
      persist(pb);
      return { userId: pb.authStore.record!.id, uuid: record.guest_uuid };
    } catch {
      // token dead -> fall through and re-auth or recreate
      pb.authStore.clear();
    }
  }

  // 2) We may still have the uuid + secret to re-auth an existing record.
  const uuid =
    (typeof localStorage !== "undefined" && localStorage.getItem(UUID_KEY)) ||
    newUuid();
  const secretKey = `namder.secret.${uuid}`;
  let secret =
    typeof localStorage !== "undefined" ? localStorage.getItem(secretKey) : null;

  if (secret) {
    try {
      await pb.collection("users").authWithPassword(guestEmail(uuid), secret);
      persist(pb);
      return { userId: pb.authStore.record!.id, uuid };
    } catch {
      // record gone or secret rotated -> recreate below
    }
  }

  // 3) First run (or recovery): create the guest user record.
  secret = randomSecret();
  const display = opts?.displayName?.trim() || "Guest";
  await pb.collection("users").create({
    email: guestEmail(uuid),
    password: secret,
    passwordConfirm: secret,
    // custom fields on the users collection (added via migration below):
    guest_uuid: uuid,
    display,
    is_guest: true,
  });
  await pb.collection("users").authWithPassword(guestEmail(uuid), secret);

  if (typeof localStorage !== "undefined") {
    localStorage.setItem(UUID_KEY, uuid);
    localStorage.setItem(secretKey, secret);
  }
  persist(pb);
  return { userId: pb.authStore.record!.id, uuid };
}

function persist(pb: ReturnType<typeof getBrowserPb>) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(
    TOKEN_KEY,
    JSON.stringify({
      token: pb.authStore.token,
      record: pb.authStore.record,
    })
  );
}

/** Update the guest's display name (shown on members/results). */
export async function setGuestDisplay(display: string): Promise<void> {
  const pb = getBrowserPb();
  const id = pb.authStore.record?.id;
  if (!id) throw new Error("no guest session");
  await pb.collection("users").update(id, { display: display.trim() });
  persist(pb);
}

/** Forget this device's guest identity entirely (e.g. "switch user"). */
export function forgetGuest(): void {
  const pb = getBrowserPb();
  pb.authStore.clear();
  if (typeof localStorage === "undefined") return;
  const uuid = localStorage.getItem(UUID_KEY);
  localStorage.removeItem(TOKEN_KEY);
  if (uuid) localStorage.removeItem(`namder.secret.${uuid}`);
  localStorage.removeItem(UUID_KEY);
}
