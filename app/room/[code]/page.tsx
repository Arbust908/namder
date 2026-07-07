"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ensureGuest } from "@/lib/guestAuth";
import { joinGroup, findRoomByCode, markDone } from "@/lib/groups";
import { loadDeck, castVote } from "@/lib/vote";
import { getBrowserPb } from "@/lib/pb";
import GroupView from "./GroupView";
import RoundResultsTable from "./RoundResultsTable";

/* ================================================================
   Colors — matches the Namder palette
   ================================================================ */
const C = {
  bg: "#2A1B3D",
  card: "#FFF8F0",
  ink: "#1A1023",
  girl: "#FF6B9D",
  boy: "#4ECDC4",
  either: "#F4A261",
  like: "#5BD6A5",
  nope: "#FF5E7E",
  star: "#FFD15C",
  muted: "rgba(255,255,255,.55)",
};

type Screen = "loading" | "swiping" | "roundResults" | "group";
type DeckName = { id: string; name: string; gender: string; origin: string; meaning: string };

export default function RoomPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const code = params.code?.toUpperCase() || "";

  const [screen, setScreen] = useState<Screen>("loading");
  const [error, setError] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState(code);
  const [deck, setDeck] = useState<DeckName[]>([]);
  const [index, setIndex] = useState(0);
  const [displayName, setDisplayName] = useState("");

  const ROUND_SIZE = 20;

  // ---- bootstrap: auth → join room → load deck ----
  useEffect(() => {
    let cancelled = false;
    async function boot() {
      try {
        // 1) Ensure identity
        await ensureGuest();
        if (cancelled) return;

        // 2) Find & join the room
        const room = await findRoomByCode(code);
        if (!room) { setError("Sala no encontrada."); return; }
        if (cancelled) return;

        const { memberId: mid } = await joinGroup(code);
        if (cancelled) return;

        setRoomId(room.id);
        setRoomCode(room.code);
        setMemberId(mid);

        // Grab display name from the auth record
        const pb = getBrowserPb();
        setDisplayName(pb.authStore.record?.display || "Guest");

        // 3) Load the deck
        const names = await loadDeck(room.id, room.gender);
        if (cancelled) return;
        setDeck(
          names.map((n: any) => ({
            id: n.id,
            name: n.name,
            gender: n.gender,
            origin: n.origin,
            meaning: n.meaning,
          }))
        );
        setScreen("swiping");
      } catch {
        if (!cancelled) setError("No pudimos cargar la sala. Probá de nuevo.");
      }
    }
    if (code) boot();
    return () => { (cancelled as any) = true; };
  }, [code]);

  // ---- vote handler ----
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

      // Finished the round?
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

/* ------------------------------ Header ------------------------------ */
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
        Nam<span style={{ color: C.girl }}>d</span>er
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

/* ------------------------------ Swipe Deck ------------------------------ */
function SwipeDeck({
  deck,
  index,
  onVote,
}: {
  deck: DeckName[];
  index: number;
  onVote: (liked: boolean) => void;
}) {
  const remaining = deck.length - index;
  const top = deck[index];
  const next = deck[index + 1];

  return (
    <main style={styles.center}>
      <div style={styles.progressWrap}>
        <div
          style={{
            ...styles.progressBar,
            width: `${deck.length > 0 ? (index / deck.length) * 100 : 0}%`,
          }}
        />
      </div>
      <p style={styles.counter}>{remaining} left</p>

      <div style={styles.deckArea}>
        {next && <NameCard card={next} stacked />}
        {top ? (
          <SwipeCard key={top.id} card={top} onVote={onVote} />
        ) : (
          <div style={styles.doneCard}>
            <p>Done! Tallying…</p>
          </div>
        )}
      </div>

      <div style={styles.actions}>
        <button
          className="circle"
          style={{ ...styles.circleBtn, color: C.nope, borderColor: C.nope }}
          onClick={() => onVote(false)}
          aria-label="Nope"
        >
          ✕
        </button>
        <button
          className="circle"
          style={{ ...styles.circleBtn, color: C.like, borderColor: C.like }}
          onClick={() => onVote(true)}
          aria-label="Like"
        >
          ♥
        </button>
      </div>
    </main>
  );
}

function genderColor(g: string) {
  return g === "girl" ? C.girl : g === "boy" ? C.boy : C.either;
}

function NameCard({ card, stacked }: { card: DeckName; stacked?: boolean }) {
  return (
    <div style={{ ...styles.swipeCard, ...(stacked ? styles.stacked : {}) }}>
      <NameCardInner card={card} />
    </div>
  );
}

function NameCardInner({ card }: { card: DeckName }) {
  const c = genderColor(card.gender);
  return (
    <>
      <div style={{ ...styles.monogram, background: c }}>{card.name[0]}</div>
      <h2 style={styles.cardName}>{card.name}</h2>
      <span style={{ ...styles.genderPill, background: c }}>
        {card.gender === "girl" ? "Niña" : card.gender === "boy" ? "Niño" : "Either"}
      </span>
      <p style={styles.meaning}>"{card.meaning}"</p>
      <p style={styles.origin}>{card.origin} origin</p>
    </>
  );
}

function SwipeCard({
  card,
  onVote,
}: {
  card: DeckName;
  onVote: (liked: boolean) => void;
}) {
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const start = useRef<{ x: number; y: number } | null>(null);

  const onDown = (x: number, y: number) => {
    start.current = { x, y };
    setDrag((d) => ({ ...d, active: true }));
  };
  const onMove = (x: number, y: number) => {
    if (!start.current) return;
    setDrag({ x: x - start.current.x, y: y - start.current.y, active: true });
  };
  const onUp = () => {
    if (!start.current) return;
    const t = 110;
    if (drag.x > t) onVote(true);
    else if (drag.x < -t) onVote(false);
    else setDrag({ x: 0, y: 0, active: false });
    start.current = null;
  };

  const rot = drag.x / 18;
  const likeOp = Math.max(0, Math.min(1, drag.x / 110));
  const nopeOp = Math.max(0, Math.min(1, -drag.x / 110));

  return (
    <div
      style={{
        ...styles.swipeCard,
        transform: `translate(${drag.x}px, ${drag.y}px) rotate(${rot}deg)`,
        transition: drag.active
          ? "none"
          : "transform .35s cubic-bezier(.2,.8,.2,1)",
        cursor: drag.active ? "grabbing" : "grab",
      }}
      onMouseDown={(e) => onDown(e.clientX, e.clientY)}
      onMouseMove={(e) => drag.active && onMove(e.clientX, e.clientY)}
      onMouseUp={onUp}
      onMouseLeave={() => drag.active && onUp()}
      onTouchStart={(e) =>
        onDown(e.touches[0].clientX, e.touches[0].clientY)
      }
      onTouchMove={(e) =>
        onMove(e.touches[0].clientX, e.touches[0].clientY)
      }
      onTouchEnd={onUp}
    >
      <span style={{ ...styles.stampLike, opacity: likeOp }}>LIKE</span>
      <span style={{ ...styles.stampNope, opacity: nopeOp }}>NOPE</span>
      <NameCardInner card={card} />
    </div>
  );
}

/* ------------------------------ Styles ------------------------------ */
const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: "100vh",
    background: `radial-gradient(120% 80% at 50% -10%, #4A2B6B 0%, ${C.bg} 55%)`,
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
    color: C.muted,
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
    background: C.girl,
    color: "#fff",
    border: "none",
    borderRadius: 999,
    padding: "14px 30px",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "system-ui, sans-serif",
  },

  // swipe
  progressWrap: {
    width: "100%",
    height: 5,
    background: "rgba(255,255,255,.12)",
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 4,
  },
  progressBar: { height: "100%", background: C.girl, transition: "width .3s ease" },
  counter: {
    fontFamily: "system-ui, sans-serif",
    fontSize: 13,
    color: "rgba(255,255,255,.6)",
    margin: "10px 0 4px",
  },
  deckArea: {
    position: "relative",
    width: "100%",
    height: 420,
    marginTop: 8,
    display: "flex",
    justifyContent: "center",
  },
  swipeCard: {
    position: "absolute",
    top: 0,
    width: "100%",
    maxWidth: 340,
    height: 400,
    background: C.card,
    borderRadius: 28,
    boxShadow: "0 24px 60px rgba(0,0,0,.4)",
    color: C.ink,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    userSelect: "none",
    overflow: "hidden",
  },
  stacked: {
    transform: "scale(.94) translateY(14px)",
    filter: "brightness(.96)",
  },
  monogram: {
    width: 84,
    height: 84,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 40,
    fontWeight: 700,
    color: "#fff",
    marginBottom: 18,
  },
  cardName: { fontSize: 40, margin: "0 0 10px", fontWeight: 700, lineHeight: 1 },
  genderPill: {
    fontFamily: "system-ui, sans-serif",
    fontSize: 12,
    fontWeight: 600,
    color: "#fff",
    padding: "4px 12px",
    borderRadius: 999,
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  meaning: {
    fontSize: 18,
    fontStyle: "italic",
    margin: "20px 0 6px",
    color: "#3A2B4A",
  },
  origin: {
    fontFamily: "system-ui, sans-serif",
    fontSize: 13,
    color: "#8B7A99",
  },
  stampLike: {
    position: "absolute",
    top: 26,
    left: 22,
    transform: "rotate(-16deg)",
    border: `4px solid ${C.like}`,
    color: C.like,
    fontFamily: "system-ui, sans-serif",
    fontWeight: 800,
    fontSize: 30,
    padding: "2px 14px",
    borderRadius: 10,
    letterSpacing: "2px",
  },
  stampNope: {
    position: "absolute",
    top: 26,
    right: 22,
    transform: "rotate(16deg)",
    border: `4px solid ${C.nope}`,
    color: C.nope,
    fontFamily: "system-ui, sans-serif",
    fontWeight: 800,
    fontSize: 30,
    padding: "2px 14px",
    borderRadius: 10,
    letterSpacing: "2px",
  },
  doneCard: {
    width: "100%",
    maxWidth: 340,
    height: 400,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "rgba(255,255,255,.7)",
    fontFamily: "system-ui, sans-serif",
  },
  actions: { display: "flex", gap: 28, marginTop: 26 },
  circleBtn: {
    width: 66,
    height: 66,
    borderRadius: "50%",
    background: "#fff",
    border: "3px solid",
    fontSize: 26,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 20px rgba(0,0,0,.3)",
    transition: "transform .15s",
  },
};
