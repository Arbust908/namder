// app/room/[code]/RoundResultsTable.tsx
// Shown right after a person finishes their 20-name round. Two columns of
// truth: what THEY picked, and what the GROUP currently agrees on. The star
// column shows the group tally at fetch time; stars are live in GroupView.
// since other members might still be swiping.

import React, { useEffect, useState } from "react";
import { apiGetRoundResults, type RoundRowData } from "@/lib/api-client";
import { COLORS, genderColor, kickerText } from "@/lib/theme";

export default function RoundResultsTable({
  roomId,
  roundSize = 20,
  onContinue,
}: {
  roomId: string;
  roundSize?: number;
  onContinue: () => void;
}) {
  const [rows, setRows] = useState<RoundRowData[] | null>(null);

  useEffect(() => {
    apiGetRoundResults(roomId, roundSize).then(setRows);
  }, [roomId, roundSize]);

  if (!rows) {
    return <p className="anim-pulse" style={styles.loading}>Armando tu resumen…</p>;
  }

  const likedCount = rows.filter((r) => r.myVote).length;
  const starCount = rows.filter((r) => r.isStar).length;

  const STAGGERS = ["", "anim-d1", "anim-d2", "anim-d3", "anim-d4", "anim-d5", "anim-d6", "anim-d7"];

  return (
    <div className="anim-slide-up" style={styles.wrap}>
      <p style={{ ...kickerText, margin: "8px 0 6px" }}>Ronda completa</p>
      <h2 style={styles.h2}>
        Te gustaron {likedCount} de {rows.length}
        {starCount > 0 && <> · {starCount} ⭐</>}
      </h2>

      <div style={styles.table}>
        <div style={styles.headRow}>
          <span style={{ flex: 1 }}>Nombre</span>
          <span style={styles.headCol}>Vos</span>
          <span style={styles.headCol}>Grupo</span>
        </div>
        {rows.map((r, i) => (
          <div
            key={r.nameId}
            className={`anim-row-enter ${STAGGERS[Math.min(i, 7)]}`}
            style={styles.row}
          >
            <div style={styles.nameCell}>
              <span
                style={{ ...styles.dot, background: genderColor(r.gender) }}
              />
              <span style={styles.nameText}>{r.name}</span>
              {r.isStar && <span style={styles.starTag}>⭐</span>}
            </div>
            <span style={styles.voteCell}>
              {r.myVote ? (
                <span style={{ color: COLORS.like }}>♥</span>
              ) : (
                <span style={{ color: COLORS.nope }}>✕</span>
              )}
            </span>
            <span style={styles.voteCell}>
              <span style={styles.groupBadge}>
                {r.likeCount}/{r.memberCount}
              </span>
            </span>
          </div>
        ))}
      </div>

      <button className="cta anim-slide-up anim-d6" style={styles.cta} onClick={onContinue}>
        Continuar
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { width: "100%", maxWidth: 480, margin: "0 auto", padding: "8px 24px 36px" },
  loading: { color: COLORS.muted, fontFamily: "system-ui, sans-serif", textAlign: "center", marginTop: 40 },
  h2: { fontFamily: "Georgia, serif", fontSize: 26, color: "#fff", margin: "4px 0 20px" },
  table: {
    background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)",
    borderRadius: 16, overflow: "hidden",
  },
  headRow: {
    display: "flex", padding: "10px 16px", fontSize: 11,
    textTransform: "uppercase", letterSpacing: "1px", color: COLORS.muted,
    fontFamily: "system-ui, sans-serif", borderBottom: "1px solid rgba(255,255,255,.08)",
  },
  headCol: { width: 56, textAlign: "center" },
  row: {
    display: "flex", alignItems: "center", padding: "12px 16px",
    borderBottom: "1px solid rgba(255,255,255,.06)", color: "#fff",
    fontFamily: "system-ui, sans-serif",
  },
  nameCell: { flex: 1, display: "flex", alignItems: "center", gap: 8, minWidth: 0 },
  dot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  nameText: { fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  starTag: { fontSize: 12, flexShrink: 0 },
  voteCell: { width: 56, textAlign: "center", fontSize: 16 },
  groupBadge: {
    fontSize: 12, background: "rgba(255,255,255,.1)", borderRadius: 999,
    padding: "3px 8px",
  },
  cta: {
    marginTop: 22, width: "100%", background: COLORS.girl, color: "#fff",
    border: "none", borderRadius: 999, padding: "15px", fontSize: 16,
    fontWeight: 700, cursor: "pointer", fontFamily: "system-ui, sans-serif",
  },
};
