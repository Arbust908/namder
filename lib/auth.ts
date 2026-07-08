// lib/auth.ts
// JWT token helpers — sign and verify session tokens.
// Server-side only. The JWT payload is the user's id + basic profile.
// Browser code reads the token from localStorage and sends it as a Bearer header.

import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "namder-dev-secret-change-in-production"
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
