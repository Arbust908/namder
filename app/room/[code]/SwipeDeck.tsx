"use client";

// SwipeDeck.tsx — Swipe card components extracted from room/[code]/page.tsx.
// The drag interaction, card rendering, and deck display are self-contained here.

import React, { useState, useRef } from "react";
import { COLORS } from "@/lib/theme";
import type { DeckName } from "@/lib/types";

/* ============================ SwipeDeck ============================ */

export function SwipeDeck({
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
          style={{ ...styles.circleBtn, color: COLORS.nope, borderColor: COLORS.nope }}
          onClick={() => onVote(false)}
          aria-label="Nope"
        >
          ✕
        </button>
        <button
          className="circle"
          style={{ ...styles.circleBtn, color: COLORS.like, borderColor: COLORS.like }}
          onClick={() => onVote(true)}
          aria-label="Like"
        >
          ♥
        </button>
      </div>
    </main>
  );
}

/* ============================ Helpers ============================ */

export function genderColor(g: string) {
  return g === "girl" ? COLORS.girl : g === "boy" ? COLORS.boy : COLORS.either;
}

/* ============================ NameCard ============================ */

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

/* ============================ SwipeCard ============================ */

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

/* ============================ Styles ============================ */

const styles: Record<string, React.CSSProperties> = {
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
  progressWrap: {
    width: "100%",
    height: 5,
    background: "rgba(255,255,255,.12)",
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 4,
  },
  progressBar: { height: "100%", background: COLORS.girl, transition: "width .3s ease" },
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
    background: COLORS.card,
    borderRadius: 28,
    boxShadow: "0 24px 60px rgba(0,0,0,.4)",
    color: COLORS.ink,
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
    border: `4px solid ${COLORS.like}`,
    color: COLORS.like,
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
    border: `4px solid ${COLORS.nope}`,
    color: COLORS.nope,
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
