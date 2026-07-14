// lib/theme.ts
// Canonical Namder palette and shared style fragments.
// Every component that needs colors imports from here — no local COLORS copies.

import { GENDERS, type Gender } from "@/lib/types";

export const COLORS = {
  [GENDERS.girl]: "#FF6B9D",
  [GENDERS.boy]: "#4ECDC4",
  [GENDERS.either]: "#F4A261",
  like: "#5BD6A5",
  nope: "#FF5E7E",
  star: "#FFD15C",
  bg: "#2A1B3D",
  bgGlow: "#4A2B6B",
  card: "#FFF8F0",
  ink: "#1A1023",
  muted: "rgba(255,255,255,.55)",
} as const;

/** Canonical hero background gradients — full-bleed dark screens (app) vs. marketing pages. */
export const heroGradient = `radial-gradient(120% 80% at 50% -10%, ${COLORS.bgGlow} 0%, ${COLORS.bg} 55%)`;
export const heroGradientTight = `radial-gradient(120% 60% at 50% -10%, ${COLORS.bgGlow} 0%, ${COLORS.bg} 45%)`;

/** Shared "kicker" / overline label used in section headers. */
export const kickerText: React.CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: "2px",
  fontSize: 12,
  color: COLORS.girl,
  marginBottom: 4,
};

/** Canonical gender → color mapping. One source of truth. */
export function genderColor(g: Gender): string {
  return (COLORS as Partial<Record<Gender, string>>)[g] ?? COLORS.either;
}
