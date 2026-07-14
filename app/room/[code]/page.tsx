"use client";

import React, { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { castVote } from "@/lib/vote";
import { markDone } from "@/lib/groups";
import { COLORS, heroGradient } from "@/lib/theme";
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

  const { roomId, memberId, roomCode, deck, displayName, error, loading, hasVotes: bootHasVotes } =
    useRoomBoot(code);

  const [votedThisSession, setVotedThisSession] = useState(false);

  // hasVotes is true if boot found historical votes OR we've voted this session.
  const hasVotes = bootHasVotes || votedThisSession;

  // Transition from loading → group (lobby) once boot completes. The group
  // view is the lobby: invite people, then tap "start swiping" to enter the
  // deck. Swiping is never the landing screen for a fresh entry.
  useEffect(() => {
    if (!loading && !error && screen === "loading") {
      setScreen("group");
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
      setVotedThisSession(true);
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
      <div className="anim-fade-in" style={styles.app}>
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
        hasVotes={hasVotes}
        onResults={() => setScreen("roundResults")}
      />

      {screen === "loading" && (
        <main className="anim-fade-in" style={styles.center}>
          <p className="anim-pulse" style={styles.loadingText}>Entrando a la sala…</p>
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
          currentMemberId={memberId}
          canStart={index < deck.length}
          onStartSwiping={() => setScreen("swiping")}
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
  hasVotes,
  onResults,
}: {
  screen: Screen;
  displayName: string;
  index: number;
  deckLen: number;
  hasVotes: boolean;
  onResults: () => void;
}) {
  return (
    <header className="anim-slide-down" style={styles.header}>
      <Link href="/" style={styles.logo} aria-label="Ir al inicio">
        Nam<span style={{ color: COLORS.girl }}>d</span>er
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {screen === "swiping" && (
          <span style={styles.turnTag}>
            {displayName} · {Math.min(index + 1, deckLen)}/{deckLen}
          </span>
        )}
        {screen !== "roundResults" && (
          <button
            className="ghost"
            style={{
              ...styles.resultsBtn,
              opacity: hasVotes ? 1 : 0.4,
            }}
            onClick={onResults}
            disabled={!hasVotes}
            aria-label="Ver resultados"
          >
            Resultados
          </button>
        )}
        <Link
          href="/profile"
          className="ghost"
          style={styles.groupBtn}
          aria-label="Ver mi perfil"
        >
          👤
        </Link>
      </div>
    </header>
  );
}

/* ============================ Styles ============================ */

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
  logo: {
    fontSize: 26,
    fontWeight: 700,
    letterSpacing: "-.5px",
    color: "#fff",
    textDecoration: "none",
  },
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
    color: "#fff",
    textDecoration: "none",
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
  resultsBtn: {
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "system-ui, sans-serif",
    color: "#fff",
    background: "rgba(255,255,255,.08)",
    border: "1px solid rgba(255,255,255,.15)",
    borderRadius: 999,
    padding: "6px 14px",
    cursor: "pointer",
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
