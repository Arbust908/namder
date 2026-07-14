// lib/api-client.ts — FIX: guest auth now passes uuid
// Browser-side fetch wrapper — replaces PocketBase SDK for client components.

import type { AssignableGender, Gender, NameRecord } from "@/lib/types";

const TOKEN_KEY = "namder.token";

// ── token helpers ──────────────────────────────────────────────────

export function getToken(): string | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const data = JSON.parse(localStorage.getItem(TOKEN_KEY) || "null");
    if (data?.token) return data.token;
  } catch {}
  return null;
}

export function saveToken(token: string, profile: UserProfile) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(TOKEN_KEY, JSON.stringify({ token, profile }));
}

export function getProfile(): UserProfile | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const data = JSON.parse(localStorage.getItem(TOKEN_KEY) || "null");
    if (data?.profile) return data.profile;
  } catch {}
  return null;
}

export function clearSession() {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

export type UserProfile = {
  id: string;
  display: string;
  isGuest: boolean;
  email?: string;
};

// ── fetch wrapper ──────────────────────────────────────────────────

async function api<T = any>(
  path: string,
  opts: { method?: string; body?: unknown } = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(path, {
    method: opts.method || "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, err.error || "request failed");
  }

  return res.json();
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// ── auth endpoints ─────────────────────────────────────────────────

export type AuthResponse = { token: string; profile: UserProfile };

export async function apiGuestAuth(opts?: {
  uuid?: string;
  displayName?: string;
}): Promise<AuthResponse> {
  return api("/api/auth/guest", { method: "POST", body: opts });
}

export async function apiRegister(opts: {
  email: string;
  password: string;
  display?: string;
}): Promise<AuthResponse> {
  return api("/api/auth/register", { method: "POST", body: opts });
}

export async function apiLogin(opts: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return api("/api/auth/login", { method: "POST", body: opts });
}

export async function apiUpgradeGuest(opts: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return api("/api/auth/upgrade", { method: "PATCH", body: opts });
}

// ── user endpoints ─────────────────────────────────────────────────

export async function apiUpdateDisplay(display: string): Promise<UserProfile> {
  return api("/api/users/me", { method: "PATCH", body: { display } });
}

// ── rooms endpoints ────────────────────────────────────────────────

export type RoomData = {
  id: string;
  code: string;
  gender: Gender;
  status: "lobby" | "swiping" | "done";
  ownerId: string | null;
};

export async function apiFindRoom(code: string): Promise<RoomData | null> {
  try {
    return await api(`/api/rooms?code=${encodeURIComponent(code)}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export async function apiCreateRoom(opts: {
  gender: string;
}): Promise<RoomData> {
  return api("/api/rooms", { method: "POST", body: opts });
}

export type MyRoomData = RoomData & {
  memberId: string;
  done: boolean;
  memberCount: number;
  voteCount: number;
  createdAt: string;
};

/** List rooms the authenticated user is a member of. */
export async function apiListMyRooms(): Promise<MyRoomData[]> {
  return api("/api/rooms?mine=true");
}

// ── members endpoints ──────────────────────────────────────────────

export type MemberData = {
  id: string;
  roomId: string;
  userId: string;
  display: string;
  done: boolean;
};

export async function apiJoinRoom(
  roomId: string,
  displayName?: string
): Promise<MemberData> {
  return api(`/api/rooms/${roomId}/join`, {
    method: "POST",
    body: { displayName },
  });
}

export async function apiListMembers(roomId: string): Promise<MemberData[]> {
  return api(`/api/rooms/${roomId}/members`);
}

export async function apiUpdateMember(
  memberId: string,
  data: { done?: boolean }
): Promise<MemberData> {
  return api(`/api/members/${memberId}`, { method: "PATCH", body: data });
}

export async function apiLeaveRoom(memberId: string): Promise<void> {
  return api(`/api/members/${memberId}`, { method: "DELETE" });
}

// ── votes endpoints ────────────────────────────────────────────────

export type VoteData = {
  id: string;
  roomId: string;
  nameId: string;
  liked: boolean;
};

export async function apiCastVote(opts: {
  roomId: string;
  nameId: string;
  liked: boolean;
}): Promise<VoteData> {
  return api("/api/votes", { method: "POST", body: opts });
}

export async function apiListMyVotes(
  roomId: string
): Promise<Array<{ nameId: string }>> {
  return api(`/api/votes?roomId=${encodeURIComponent(roomId)}`);
}

// ── names endpoints ────────────────────────────────────────────────

export type NameData = NameRecord;

export async function apiListNames(gender?: string): Promise<NameData[]> {
  const qs =
    gender && gender !== "either" ? `?gender=${encodeURIComponent(gender)}` : "";
  return api(`/api/names${qs}`);
}

export async function apiUpdateNameGender(
  id: string,
  gender: AssignableGender
): Promise<NameData> {
  return api(`/api/names/${id}`, { method: "PATCH", body: { gender } });
}

// ── results endpoint ───────────────────────────────────────────────

export type RoundRowData = {
  nameId: string;
  name: string;
  gender: Gender;
  meaning: string;
  myVote: boolean;
  likeCount: number;
  memberCount: number;
  isStar: boolean;
};

export async function apiGetRoundResults(
  roomId: string,
  roundSize?: number
): Promise<RoundRowData[]> {
  const qs = roundSize ? `?roundSize=${roundSize}` : "";
  return api(`/api/rooms/${roomId}/results${qs}`);
}
