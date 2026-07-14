"use client";

// SwipeDeck.tsx — Swipe card components extracted from room/[code]/page.tsx.
// The drag interaction, card rendering, and deck display are self-contained here.

import React, { useState, useRef, useCallback } from "react";
import { COLORS, genderColor } from "@/lib/theme";
import type { NameData } from "@/lib/api-client";
import { GENDER_LABELS } from "@/lib/types";

/* ============================ SwipeDeck ============================ */

export function SwipeDeck({
  deck,
  index,
  onVote,
  onSwipeDown,
}: {
  deck: NameData[];
  index: number;
  onVote: (liked: boolean) => void;
  onSwipeDown?: () => void;
}) {
  const remaining = deck.length - index;
  const top = deck[index];
  const next = deck[index + 1];
  const [exiting, setExiting] = useState<"left" | "right" | null>(null);

  const handleVote = useCallback(
    (liked: boolean) => {
      setExiting(liked ? "right" : "left");
      setTimeout(() => {
        setExiting(null);
        onVote(liked);
      }, 250);
    },
    [onVote]
  );

  const handleSwipeDown = useCallback(() => {
    if (onSwipeDown) onSwipeDown();
  }, [onSwipeDown]);

  const progressFraction = deck.length > 0 ? index / deck.length : 0;

  return (
    <main className="anim-slide-up" style={styles.center}>
      <div style={styles.progressWrap}>
        <div
          style={{
            ...styles.progressBar,
            transform: `scaleX(${progressFraction})`,
          }}
        />
      </div>
      <p style={styles.counter}>{remaining} left</p>

      <div style={styles.deckArea}>
        {next && (
          <div className="anim-scale-in">
            <NameCard card={next} stacked />
          </div>
        )}
        {top ? (
          <SwipeCard
            key={top.id}
            card={top}
            onVote={handleVote}
            onSwipeDown={handleSwipeDown}
            exiting={exiting}
          />
        ) : (
          <div style={styles.doneCard}>
            <p className="anim-pulse">Done! Tallying…</p>
          </div>
        )}
      </div>

      <div style={styles.actions}>
        <button
          className="circle"
          style={{ ...styles.circleBtn, color: COLORS.nope, borderColor: COLORS.nope }}
          onClick={() => handleVote(false)}
          aria-label="Nope"
          disabled={!!exiting}
        >
          ✕
        </button>
        <button
          className="circle"
          style={{ ...styles.circleBtn, color: COLORS.like, borderColor: COLORS.like }}
          onClick={() => handleVote(true)}
          aria-label="Like"
          disabled={!!exiting}
        >
          ♥
        </button>
      </div>
    </main>
  );
}

/* ============================ Helpers ============================ */

/* ============================ NameCard ============================ */

function NameCard({ card, stacked }: { card: NameData; stacked?: boolean }) {
  return (
    <div style={{ ...styles.swipeCard, ...(stacked ? styles.stacked : {}) }}>
      <NameCardInner card={card} />
    </div>
  );
}

function NameCardInner({ card }: { card: NameData }) {
  const c = genderColor(card.gender);
  return (
    <>
      <div style={{ ...styles.monogram, background: c }}>{card.name[0]}</div>
      <h2 style={styles.cardName}>{card.name}</h2>
      <span style={{ ...styles.genderPill, background: c }}>
        {GENDER_LABELS[card.gender]}
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
  onSwipeDown,
  exiting,
}: {
  card: NameData;
  onVote: (liked: boolean) => void;
  onSwipeDown?: () => void;
  exiting: "left" | "right" | null;
}) {
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const start = useRef<{ x: number; y: number } | null>(null);

  const onDown = (x: number, y: number) => {
    if (exiting) return;
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
    else if (drag.y > t && onSwipeDown) onSwipeDown();
    else setDrag({ x: 0, y: 0, active: false });
    start.current = null;
  };

  const rot = exiting ? 0 : drag.x / 18;

  // Exit transform: slide card off-screen in the vote direction
  const exitX = exiting === "right" ? 280 : exiting === "left" ? -280 : 0;
  const exitRot = exiting === "right" ? 12 : exiting === "left" ? -12 : 0;
  const exitOpacity = exiting ? 0 : 1;

  const tx = exiting ? exitX : drag.x;
  const ty = exiting ? 0 : drag.y;
  const tr = exiting ? exitRot : rot;

  const likeOp = Math.max(0, Math.min(1, drag.x / 110));
  const nopeOp = Math.max(0, Math.min(1, -drag.x / 110));
  const eitherOp = onSwipeDown ? Math.max(0, Math.min(1, drag.y / 110)) : 0;

  const showLikeStamp = likeOp > 0.7;
  const showNopeStamp = nopeOp > 0.7;

  return (
    <div
      style={{
        ...styles.swipeCard,
        transform: `translate(${tx}px, ${ty}px) rotate(${tr}deg)`,
        opacity: exitOpacity,
        transition: exiting
          ? "transform .25s ease-in, opacity .2s ease-out"
          : drag.active
            ? "none"
            : "transform .35s cubic-bezier(.2,.8,.2,1), opacity .25s ease-out",
        cursor: exiting ? "default" : drag.active ? "grabbing" : "grab",
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
      <span
        className={showLikeStamp ? "anim-pop" : ""}
        style={{
          ...styles.stampLike,
          opacity: likeOp,
          transform: `rotate(-16deg) scale(${likeOp > 0 ? 1 : 0.8})`,
          transition: "opacity .15s ease-out, transform .15s ease-out",
        }}
      >
        LIKE
      </span>
      <span
        className={showNopeStamp ? "anim-pop" : ""}
        style={{
          ...styles.stampNope,
          opacity: nopeOp,
          transform: `rotate(16deg) scale(${nopeOp > 0 ? 1 : 0.8})`,
          transition: "opacity .15s ease-out, transform .15s ease-out",
        }}
      >
        NOPE
      </span>
      {onSwipeDown && (
        <span
          style={{
            ...styles.stampEither,
            opacity: eitherOp,
            transition: "opacity .15s ease-out",
          }}
        >
          EITHER
        </span>
      )}
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
  progressBar: {
    width: "100%",
    height: "100%",
    background: COLORS.girl,
    transformOrigin: "left center",
    transition: "transform .4s cubic-bezier(.25,.46,.45,.94)",
  },
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
  stampEither: {
    position: "absolute",
    bottom: 26,
    left: "50%",
    transform: "translateX(-50%)",
    border: `4px solid ${COLORS.either}`,
    color: COLORS.either,
    fontFamily: "system-ui, sans-serif",
    fontWeight: 800,
    fontSize: 26,
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
