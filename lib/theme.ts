// lib/theme.ts
// Canonical Namder palette and shared style fragments.
// Every component that needs colors imports from here — no local COLORS copies.

export const COLORS = {
  girl: "#FF6B9D",
  boy: "#4ECDC4",
  either: "#F4A261",
  like: "#5BD6A5",
  nope: "#FF5E7E",
  star: "#FFD15C",
  bg: "#2A1B3D",
  card: "#FFF8F0",
  ink: "#1A1023",
  muted: "rgba(255,255,255,.55)",
} as const;

/** Shared "kicker" / overline label used in section headers. */
export const kickerText: React.CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: "2px",
  fontSize: 12,
  color: COLORS.girl,
  marginBottom: 4,
};

/** Canonical gender → color mapping. One source of truth. */
export function genderColor(g: string): string {
  return g === "girl" ? COLORS.girl : g === "boy" ? COLORS.boy : COLORS.either;
}
