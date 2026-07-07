// app/room/[code]/GroupView.tsx
// "Mi grupo" — who's in, who's done swiping, and a QR to invite more people.
//
// QR generation: rather than pull in a client-side QR library (extra bundle
// weight for one image), this renders the code via a public QR image
// endpoint (api.qrserver.com — free, no key). If that's ever unavailable
// (offline demo, restricted network), it falls back to the plain code +
// "copy link" so joining still works without the image.

import React, { useEffect, useState } from "react";
import { getBrowserPb } from "@/lib/pb";

type MemberRow = {
  id: string;
  display: string;
  done: boolean;
  user: string;
};

const COLORS = {
  girl: "#FF6B9D",
  boy: "#4ECDC4",
  like: "#5BD6A5",
  muted: "rgba(255,255,255,.55)",
};

export default function GroupView({
  roomId,
  roomCode,
  joinUrlBase,
}: {
  roomId: string;
  roomCode: string;
  joinUrlBase: string;
}) {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [copied, setCopied] = useState(false);
  const [qrFailed, setQrFailed] = useState(false);

  const joinUrl = `${joinUrlBase}?code=${roomCode}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    joinUrl
  )}`;

  const load = async () => {
    const pb = getBrowserPb();
    const rows = await pb.collection("members").getFullList<MemberRow>({
      filter: `room = "${roomId}"`,
      sort: "created",
    });
    setMembers(rows);
  };

  useEffect(() => {
    load();
    const pb = getBrowserPb();
    const unsub = pb.collection("members").subscribe(
      "*",
      () => load(),
      { filter: `room = "${roomId}"` }
    );
    return () => {
      unsub.then((fn) => fn());
    };
  }, [roomId]); // eslint-disable-line

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard blocked — the visible code/link is the fallback already
    }
  };

  const doneCount = members.filter((m) => m.done).length;

  return (
    <main style={styles.wrap}>
      <p style={styles.kicker}>Mi grupo</p>
      <h1 style={styles.h1}>
        {doneCount}/{members.length} listos
      </h1>

      <div style={styles.qrCard}>
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
        <button className="cta" style={styles.copyBtn} onClick={copyLink}>
          {copied ? "¡Copiado!" : "Copiar link de invitación"}
        </button>
      </div>

      <div style={styles.memberList}>
        {members.map((m) => (
          <div key={m.id} style={styles.memberRow}>
            <div
              style={{
                ...styles.avatar,
                background: m.done ? COLORS.like : "rgba(255,255,255,.15)",
              }}
            >
              {m.display[0]?.toUpperCase() || "?"}
            </div>
            <span style={styles.memberName}>{m.display}</span>
            <span
              style={{
                ...styles.statusPill,
                color: m.done ? COLORS.like : COLORS.muted,
                background: m.done ? "rgba(91,214,165,.14)" : "rgba(255,255,255,.08)",
              }}
            >
              {m.done ? "Listo" : "Swipeando…"}
            </span>
          </div>
        ))}
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    maxWidth: 480, margin: "0 auto", padding: "20px 24px 40px",
    color: "#fff", fontFamily: "system-ui, sans-serif", textAlign: "center",
  },
  kicker: {
    textTransform: "uppercase", letterSpacing: "2px", fontSize: 12,
    color: COLORS.girl, marginBottom: 4,
  },
  h1: { fontFamily: "Georgia, serif", fontSize: 28, margin: "0 0 20px" },
  qrCard: {
    background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)",
    borderRadius: 20, padding: 24, display: "flex", flexDirection: "column",
    alignItems: "center", gap: 12,
  },
  qrImg: { borderRadius: 12, background: "#fff", padding: 10 },
  qrFallback: {
    width: 200, height: 200, display: "flex", alignItems: "center",
    justifyContent: "center", background: "rgba(255,255,255,.06)", borderRadius: 12,
  },
  qrFallbackText: { fontSize: 13, color: COLORS.muted, padding: 16 },
  code: {
    fontFamily: "Georgia, serif", fontSize: 26, letterSpacing: "4px",
    fontWeight: 700, margin: 0,
  },
  copyBtn: {
    background: COLORS.girl, color: "#fff", border: "none", borderRadius: 999,
    padding: "12px 22px", fontWeight: 700, cursor: "pointer", fontSize: 14,
  },
  memberList: {
    marginTop: 22, display: "flex", flexDirection: "column", gap: 8, textAlign: "left",
  },
  memberRow: {
    display: "flex", alignItems: "center", gap: 12,
    background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)",
    borderRadius: 14, padding: "10px 14px",
  },
  avatar: {
    width: 34, height: 34, borderRadius: "50%", display: "flex",
    alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0,
  },
  memberName: { flex: 1, fontSize: 15 },
  statusPill: { fontSize: 12, padding: "4px 10px", borderRadius: 999, fontWeight: 600 },
};
