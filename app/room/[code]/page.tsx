"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { castVote } from "@/lib/vote";
import { markDone } from "@/lib/groups";
import { COLORS } from "@/lib/theme";
import { useRoomBoot } from "@/hooks/useRoomBoot";
import { SwipeDeck } from "./SwipeDeck";
import GroupView from "./GroupView";
import RoundResultsTable from "./RoundResultsTable";

type Screen = "loading" | "swiping" | "roundResults" | "group";
const ROUND_SIZE = 20;

export default function RoomPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const code = params.code?.toUpperCase() || "";

  const [screen, setScreen] = useState<Screen>("loading");
  const [index, setIndex] = useState(0);

  const { roomId, memberId, roomCode, deck, displayName, error, loading } =
    useRoomBoot(code);

  // Transition from loading → swiping once boot completes.
  useEffect(() => {
    if (!loading && !error && screen === "loading") {
      setScreen("swiping");
    }
  }, [loading, error, screen]);

  const vote = useCallback(
    async (liked: boolean) => {
      const card = deck[index];
      if (!card || !roomId) return;
      try {
        await castVote({ roomId, nameId: card.id, liked });
      } catch {
        // keep going — don't block the swipe
      }
      const next = index + 1;
      setIndex(next);

      if (next >= deck.length || next % ROUND_SIZE === 0) {
        if (memberId) {
          try { await markDone(memberId); } catch {}
        }
        setScreen("roundResults");
      }
    },
    [deck, index, roomId, memberId]
  );

  if (error) {
    return (
      <div style={styles.app}>
        <main style={styles.center}>
          <p style={styles.errorText}>{error}</p>
          <button className="cta" style={styles.cta} onClick={() => router.push("/")}>
            Volver
          </button>
        </main>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      <Header
        screen={screen}
        displayName={displayName}
        index={index}
        deckLen={deck.length}
        onGroup={() => setScreen("group")}
      />

      {screen === "loading" && (
        <main style={styles.center}>
          <p style={styles.loadingText}>Entrando a la sala…</p>
        </main>
      )}

      {screen === "swiping" && (
        <SwipeDeck deck={deck} index={index} onVote={vote} />
      )}

      {screen === "roundResults" && roomId && (
        <RoundResultsTable
          roomId={roomId}
          roundSize={ROUND_SIZE}
          onContinue={() => setScreen("group")}
        />
      )}

      {screen === "group" && roomId && (
        <GroupView
          roomId={roomId}
          roomCode={roomCode}
          joinUrlBase={typeof window !== "undefined" ? `${window.location.origin}/room` : ""}
        />
      )}
    </div>
  );
}

/* ============================ Header ============================ */

function Header({
  screen,
  displayName,
  index,
  deckLen,
  onGroup,
}: {
  screen: Screen;
  displayName: string;
  index: number;
  deckLen: number;
  onGroup: () => void;
}) {
  return (
    <header style={styles.header}>
      <span style={styles.logo}>
        Nam<span style={{ color: COLORS.girl }}>d</span>er
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {screen === "swiping" && (
          <span style={styles.turnTag}>
            {displayName} · {Math.min(index + 1, deckLen)}/{deckLen}
          </span>
        )}
        <button
          className="ghost"
          style={styles.groupBtn}
          onClick={onGroup}
          aria-label="Ver grupo"
        >
          👥
        </button>
      </div>
    </header>
  );
}

/* ============================ Styles ============================ */

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: "100vh",
    background: `radial-gradient(120% 80% at 50% -10%, #4A2B6B 0%, ${COLORS.bg} 55%)`,
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
  logo: { fontSize: 26, fontWeight: 700, letterSpacing: "-.5px" },
  turnTag: {
    fontFamily: "system-ui, sans-serif",
    fontSize: 13,
    background: "rgba(255,255,255,.14)",
    padding: "5px 12px",
    borderRadius: 999,
  },
  groupBtn: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "transparent",
    border: "1px solid rgba(255,255,255,.18)",
    cursor: "pointer",
    fontSize: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    width: "100%",
    maxWidth: 480,
    flex: 1,
    padding: "8px 24px 36px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center" as const,
  },
  loadingText: {
    color: COLORS.muted,
    fontFamily: "system-ui, sans-serif",
    marginTop: 40,
    fontSize: 16,
  },
  errorText: {
    color: "#FF8FA8",
    fontSize: 15,
    marginTop: 40,
    background: "rgba(255,94,126,.12)",
    padding: "14px 18px",
    borderRadius: 12,
    marginBottom: 16,
  },
  cta: {
    background: COLORS.girl,
    color: "#fff",
    border: "none",
    borderRadius: 999,
    padding: "14px 30px",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "system-ui, sans-serif",
  },
};
