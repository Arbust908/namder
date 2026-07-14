// app/room/[code]/GroupView.tsx
// "Mi grupo" — who's in, who's finished, and a QR to invite more people.
// Not real-time: a plain API view that refreshes every 60s and on demand via
// the "Actualizar" button. (It replaced an earlier PocketBase SSE design; the
// old 3s poll hammered the API and is gone.)

import React, { useEffect, useState, useCallback } from "react";
import { apiListMembers, type MemberData } from "@/lib/api-client";
import { COLORS } from "@/lib/theme";

// Refresh cadence for the member list. Long on purpose — this is a lobby, not
// a live feed. Users who want an immediate update tap "Actualizar".
const REFRESH_MS = 60_000;

export default function GroupView({
  roomId,
  roomCode,
  joinUrlBase,
  currentMemberId,
  canStart,
  onStartSwiping,
}: {
  roomId: string;
  roomCode: string;
  joinUrlBase: string;
  /** The logged-in member's id. Their row gets the "Empezar" button instead
   *  of a "Swipeando…" pill — the others just show their status. */
  currentMemberId?: string | null;
  canStart?: boolean;
  onStartSwiping?: () => void;
}) {
  const [members, setMembers] = useState<MemberData[]>([]);
  const [copied, setCopied] = useState(false);
  const [qrFailed, setQrFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const joinUrl = `${joinUrlBase}?code=${roomCode}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    joinUrl
  )}`;

  const load = useCallback(async () => {
    try {
      const rows = await apiListMembers(roomId);
      setMembers(rows);
    } catch {
      // keep stale data on error
    }
  }, [roomId]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  useEffect(() => {
    load();
    // Slow refresh — this is a lobby, not a live feed. Manual "Actualizar"
    // covers the "did they join yet?" moment without hammering the API.
    const interval = setInterval(load, REFRESH_MS);
    return () => clearInterval(interval);
  }, [load]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard blocked — the visible code is the fallback
    }
  };

  const doneCount = members.filter((m) => m.done).length;

  const STAGGERS = ["", "anim-d1", "anim-d2", "anim-d3", "anim-d4", "anim-d5", "anim-d6", "anim-d7"];

  return (
    <main className="anim-fade-in" style={styles.wrap}>
      <p style={styles.kicker}>Mi grupo</p>
      <h1 style={styles.h1}>
        {doneCount}/{members.length} listos
      </h1>

      <div className="anim-scale-in" style={styles.qrCard}>
        {!qrFailed ? (
          <img
            src={qrSrc}
            alt="Código QR para sumarse al grupo"
            width={200}
            height={200}
            style={styles.qrImg}
            onError={() => setQrFailed(true)}
          />
        ) : (
          <div style={styles.qrFallback}>
            <p style={styles.qrFallbackText}>
              No pudimos generar el QR. Compartí el código directamente:
            </p>
          </div>
        )}
        <p style={styles.code}>{roomCode}</p>
        <button
          className="cta"
          style={{
            ...styles.copyBtn,
            transform: copied ? "scale(1.04)" : "scale(1)",
            transition: "transform .2s cubic-bezier(.25,.46,.45,.94), filter .2s ease-out",
          }}
          onClick={copyLink}
        >
          {copied ? "¡Copiado!" : "Copiar link de invitación"}
        </button>
      </div>

      <div style={styles.memberList}>
        {members.map((m, i) => {
          const isMe = !!currentMemberId && m.id === currentMemberId;
          const showStart = isMe && canStart && !!onStartSwiping;
          return (
            <div
              key={m.id}
              className={`anim-member-enter ${STAGGERS[Math.min(i, 7)]}`}
              style={styles.memberRow}
            >
              <div
                style={{
                  ...styles.avatar,
                  background: m.done ? COLORS.like : "rgba(255,255,255,.15)",
                  transition: "background .35s ease-out",
                }}
              >
                {m.display[0]?.toUpperCase() || "?"}
              </div>
              <span style={styles.memberName}>
                {m.display}
                {isMe && <span style={styles.meTag}> (vos)</span>}
              </span>
              {showStart ? (
                <button
                  className="cta anim-glow"
                  style={styles.startRowCta}
                  onClick={onStartSwiping}
                >
                  Empezar
                </button>
              ) : (
                <span
                  style={{
                    ...styles.statusPill,
                    color: m.done ? COLORS.like : COLORS.muted,
                    background: m.done
                      ? "rgba(91,214,165,.14)"
                      : "rgba(255,255,255,.08)",
                    transition: "background .35s ease-out, color .35s ease-out",
                  }}
                >
                  {m.done ? "Listo" : "Pendiente"}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <button
        className="ghost"
        style={styles.refreshBtn}
        onClick={refresh}
        disabled={refreshing}
      >
        {refreshing ? "Actualizando…" : "Actualizar"}
      </button>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    maxWidth: 480,
    margin: "0 auto",
    padding: "20px 24px 40px",
    color: "#fff",
    fontFamily: "system-ui, sans-serif",
    textAlign: "center",
  },
  kicker: {
    textTransform: "uppercase",
    letterSpacing: "2px",
    fontSize: 12,
    color: COLORS.girl,
    marginBottom: 4,
  },
  h1: { fontFamily: "Georgia, serif", fontSize: 28, margin: "0 0 20px" },
  qrCard: {
    background: "rgba(255,255,255,.05)",
    border: "1px solid rgba(255,255,255,.1)",
    borderRadius: 20,
    padding: 24,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
  },
  qrImg: { borderRadius: 12, background: "#fff", padding: 10 },
  qrFallback: {
    width: 200,
    height: 200,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255,255,255,.06)",
    borderRadius: 12,
  },
  qrFallbackText: { fontSize: 13, color: COLORS.muted, padding: 16 },
  code: {
    fontFamily: "Georgia, serif",
    fontSize: 26,
    letterSpacing: "4px",
    fontWeight: 700,
    margin: 0,
  },
  copyBtn: {
    background: COLORS.girl,
    color: "#fff",
    border: "none",
    borderRadius: 999,
    padding: "12px 22px",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 14,
  },
  memberList: {
    marginTop: 22,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    textAlign: "left",
  },
  memberRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "rgba(255,255,255,.05)",
    border: "1px solid rgba(255,255,255,.08)",
    borderRadius: 14,
    padding: "10px 14px",
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    flexShrink: 0,
  },
  memberName: { flex: 1, fontSize: 15 },
  meTag: { color: COLORS.muted, fontSize: 13 },
  statusPill: {
    fontSize: 12,
    padding: "4px 10px",
    borderRadius: 999,
    fontWeight: 600,
  },
  startRowCta: {
    background: COLORS.girl,
    color: "#fff",
    border: "none",
    borderRadius: 999,
    padding: "8px 18px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "system-ui, sans-serif",
    flexShrink: 0,
  },
  refreshBtn: {
    marginTop: 16,
    background: "transparent",
    border: "1px solid rgba(255,255,255,.2)",
    color: "rgba(255,255,255,.7)",
    borderRadius: 999,
    padding: "9px 18px",
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "system-ui, sans-serif",
  },
};
