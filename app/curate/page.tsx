"use client";

// app/curate/page.tsx
// Internal curation tool: swipe through names with gender = "unknown" and
// assign girl/boy/either. Gated to registered users on CURATION_ALLOWLIST.
// Single-curator assumption — no concurrency/locking needed.

import React, { useCallback, useEffect, useState } from "react";
import { CURATION_ALLOWLIST } from "@/lib/curationAllowlist";
import { apiListNames, apiUpdateNameGender, type NameData } from "@/lib/api-client";
import { SwipeDeck } from "@/app/room/[code]/SwipeDeck";
import { COLORS, heroGradient } from "@/lib/theme";
import { useAuthGate } from "@/hooks/useAuthGate";
import type { AuthState } from "@/lib/authState";

function isAuthorized(state: AuthState) {
  return state.kind === "registered" && CURATION_ALLOWLIST.includes(state.email);
}

export default function CuratePage() {
  const state = useAuthGate((s) => !isAuthorized(s), "/");
  const authorized = isAuthorized(state);

  const [deck, setDeck] = useState<NameData[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authorized) return;
    apiListNames("unknown")
      .then(setDeck)
      .catch(() => setError("No pudimos cargar los nombres."))
      .finally(() => setLoading(false));
  }, [authorized]);

  const decide = useCallback(
    async (gender: "girl" | "boy" | "either") => {
      const card = deck[index];
      if (!card) return;
      try {
        await apiUpdateNameGender(card.id, gender);
        setError(null);
        setIndex((i) => i + 1);
      } catch {
        setError("No pudimos guardar. Probá de nuevo.");
      }
    },
    [deck, index]
  );

  if (!authorized) return null;

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <span style={styles.logo}>Curación de nombres</span>
        <span style={styles.counter}>
          {Math.min(index + 1, deck.length)}/{deck.length}
        </span>
      </header>

      {loading && <p style={styles.text}>Cargando…</p>}
      {error && <p style={styles.error}>{error}</p>}

      {!loading && (
        <SwipeDeck
          deck={deck}
          index={index}
          onVote={(liked) => decide(liked ? "boy" : "girl")}
          onSwipeDown={() => decide("either")}
        />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: "100vh",
    background: heroGradient,
    color: "#fff",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  header: {
    width: "100%",
    maxWidth: 480,
    padding: "20px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: { fontSize: 20, fontWeight: 700, letterSpacing: "-.5px" },
  counter: {
    fontFamily: "system-ui, sans-serif",
    fontSize: 13,
    background: "rgba(255,255,255,.14)",
    padding: "5px 12px",
    borderRadius: 999,
  },
  text: {
    color: COLORS.muted,
    fontFamily: "system-ui, sans-serif",
    marginTop: 40,
    fontSize: 16,
  },
  error: {
    color: "#FF8FA8",
    fontSize: 14,
    marginTop: 16,
    background: "rgba(255,94,126,.12)",
    padding: "10px 16px",
    borderRadius: 10,
  },
};
