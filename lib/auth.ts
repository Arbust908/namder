// lib/auth.ts
// JWT token helpers — sign and verify session tokens.
// Server-side only. The JWT payload is the user's id + basic profile.
// Browser code reads the token from localStorage and sends it as a Bearer header.

import { SignJWT, jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET env var is required in production");
  }
  console.warn("JWT_SECRET not set — using dev default (insecure outside localhost)");
}

const SECRET = new TextEncoder().encode(
  JWT_SECRET || "namder-dev-secret-change-in-production"
);

const ISSUER = "namder";
const EXPIRATION = "30d"; // long-lived for guest persistence

export type TokenPayload = {
  sub: string; // user id
  display: string;
  isGuest: boolean;
  email?: string;
};

export async function signToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setExpirationTime(EXPIRATION)
    .sign(SECRET);
}

export async function verifyToken(
  token: string
): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET, {
      issuer: ISSUER,
    });
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

// ── auth middleware helper ───────────────────────────────────────────
// Every authenticated route called this same 6-line incantation.
// Now it's one call + one guard.

export async function getAuthPayload(
  req: NextRequest
): Promise<TokenPayload | null> {
  const header = req.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  return verifyToken(token);
}

export const UNAUTHORIZED = () =>
  NextResponse.json({ error: "No autorizado." }, { status: 401 });
