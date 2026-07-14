// app/(marketing)/Landing.tsx
// Public landing page. No auth required — this is what a cold visitor sees
// before choosing guest vs. registrarse (that choice happens on Welcome.tsx).
//
// "Screenshots": rather than stock photography or placeholder images, these
// are small CSS/HTML phone mockups that mirror the actual swipe card, round
// results table, and QR/group screens already built — same palette, same
// shapes. They're illustrative facsimiles, not live screenshots, but they're
// honest about what the product looks like rather than generic stock art.

import React, { useMemo } from "react";
import { COLORS, heroGradientTight } from "@/lib/theme";

export default function Landing({
  onStart,
  onAbout,
}: {
  onStart: () => void;
  onAbout: () => void;
}) {
  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <span style={styles.logo}>
          Nam<span style={{ color: COLORS.girl }}>d</span>er
        </span>
        <button style={styles.navLink} onClick={onAbout}>
          Nosotros
        </button>
      </nav>

      {/* ---------- Hero ---------- */}
      <header className="anim-slide-up" style={styles.hero}>
        <p style={styles.kicker}>Para parejas (o tríos, o abuelas) eligiendo nombre</p>
        <h1 style={styles.h1}>
          Swipe hasta encontrar<br />el nombre que <em>todos</em> aman.
        </h1>
        <p style={styles.lede}>
          Cada persona del grupo desliza sobre los mismos nombres. Cuando
          todos dicen que sí, aparece la ⭐. Sin discusiones interminables ni
          listas de WhatsApp perdidas.
        </p>
        <button className="cta" style={styles.ctaPrimary} onClick={onStart}>
          Empezar gratis
        </button>
        <p style={styles.ctaHint}>Sin tarjeta. Podés probarlo como invitado en 10 segundos.</p>
      </header>

      {/* ---------- Mock: swipe card ---------- */}
      <section className="anim-slide-up anim-d2" style={styles.section}>
        <div style={styles.mockRow}>
          <PhoneFrame>
            <SwipeMock />
          </PhoneFrame>
          <div style={styles.mockText}>
            <p style={styles.stepTag}>01 · Deslizá</p>
            <h2 style={styles.h2}>Un nombre a la vez, sin presión</h2>
            <p style={styles.body}>
              20 nombres por ronda, con origen y significado. Deslizá a la
              derecha si te gusta, a la izquierda si no. Adaptado a nombres
              argentinos y en español, pero fácil de ampliar a otros países.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- Mock: results table ---------- */}
      <section className="anim-slide-up anim-d3" style={styles.sectionAlt}>
        <div style={{ ...styles.mockRow, flexDirection: "row-reverse" }}>
          <PhoneFrame>
            <ResultsMock />
          </PhoneFrame>
          <div style={styles.mockText}>
            <p style={styles.stepTag}>02 · Comparen</p>
            <h2 style={styles.h2}>Vos, tu pareja, y quién más quieras sumar</h2>
            <p style={styles.body}>
              Al terminar tu ronda ves tu propia lista al lado de cuántos del
              grupo también dijeron que sí — en tiempo real, aunque el resto
              todavía esté deslizando.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- Mock: group + QR ---------- */}
      <section className="anim-slide-up anim-d4" style={styles.section}>
        <div style={styles.mockRow}>
          <PhoneFrame>
            <GroupMock />
          </PhoneFrame>
          <div style={styles.mockText}>
            <p style={styles.stepTag}>03 · Sumá gente</p>
            <h2 style={styles.h2}>Un QR y ya están todos adentro</h2>
            <p style={styles.body}>
              Compartí el código o el QR del grupo. Cada persona entra desde
              su propio celular — nadie tiene que pasarse el teléfono.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- FAQ teaser / final CTA ---------- */}
      <section className="anim-slide-up anim-d5" style={styles.finalCta}>
        <h2 style={styles.h2}>¿Le damos una vuelta?</h2>
        <button className="cta" style={styles.ctaPrimary} onClick={onStart}>
          Empezar gratis
        </button>
        <button style={styles.linkBtn} onClick={onAbout}>
          Preguntas frecuentes y quién hace esto →
        </button>
      </section>
    </div>
  );
}

/* ---------------- Phone frame + mini mocks ---------------- */

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div style={styles.phone}>
      <div style={styles.phoneNotch} />
      <div style={styles.phoneScreen}>{children}</div>
    </div>
  );
}

function SwipeMock() {
  return (
    <div style={styles.mockInner}>
      <div style={styles.mockCard}>
        <div style={{ ...styles.mockMonogram, background: COLORS.girl }}>V</div>
        <p style={styles.mockName}>Valentina</p>
        <span style={{ ...styles.mockPill, background: COLORS.girl }}>Niña</span>
        <p style={styles.mockMeaning}>"Fuerte, sana"</p>
      </div>
      <div style={styles.mockActions}>
        <span style={{ ...styles.mockCircle, borderColor: COLORS.nope, color: COLORS.nope }}>✕</span>
        <span style={{ ...styles.mockCircle, borderColor: COLORS.like, color: COLORS.like }}>♥</span>
      </div>
    </div>
  );
}

function ResultsMock() {
  const rows = [
    { name: "Valentina", mine: true, tally: "3/3", star: true },
    { name: "Delfina", mine: true, tally: "2/3", star: false },
    { name: "Mora", mine: false, tally: "1/3", star: false },
  ];
  return (
    <div style={styles.mockInner}>
      <p style={styles.mockTableTitle}>Te gustaron 2 de 3 · 1 ⭐</p>
      <div style={styles.mockTable}>
        {rows.map((r) => (
          <div key={r.name} style={styles.mockTableRow}>
            <span style={styles.mockTableName}>
              {r.name} {r.star && "⭐"}
            </span>
            <span style={{ color: r.mine ? COLORS.like : COLORS.nope }}>
              {r.mine ? "♥" : "✕"}
            </span>
            <span style={styles.mockTallyBadge}>{r.tally}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GroupMock() {
  const qrCells = useMemo(
    () =>
      Array.from({ length: 25 }).map(() => Math.random() > 0.5),
    []
  );
  return (
    <div style={styles.mockInner}>
      <div style={styles.mockQrBox}>
        <div style={styles.mockQrGrid}>
          {qrCells.map((on, i) => (
            <span
              key={i}
              style={{ background: on ? "#1A1023" : "transparent" }}
            />
          ))}
        </div>
      </div>
      <p style={styles.mockCode}>MORA42</p>
      <div style={styles.mockMemberRow}>
        <span style={{ ...styles.mockAvatar, background: COLORS.like }}>F</span>
        <span style={styles.mockMemberLabel}>Fran · Listo</span>
      </div>
      <div style={styles.mockMemberRow}>
        <span style={styles.mockAvatar}>P</span>
        <span style={styles.mockMemberLabel}>Partner · Swipeando…</span>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    background: heroGradientTight,
    color: "#fff",
    fontFamily: "system-ui, sans-serif",
    minHeight: "100vh",
  },
  nav: {
    maxWidth: 960, margin: "0 auto", padding: "22px 24px",
    display: "flex", justifyContent: "space-between", alignItems: "center",
  },
  logo: { fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700 },
  navLink: { background: "transparent", border: "none", color: COLORS.muted, fontSize: 14, cursor: "pointer", transition: "color .2s ease-out" },

  hero: { maxWidth: 640, margin: "0 auto", padding: "40px 24px 20px", textAlign: "center" },
  kicker: {
    textTransform: "uppercase", letterSpacing: "2px", fontSize: 12,
    color: COLORS.girl, marginBottom: 10,
  },
  h1: { fontFamily: "Georgia, serif", fontSize: 38, lineHeight: 1.15, margin: "0 0 16px" },
  lede: { fontSize: 16, lineHeight: 1.6, color: COLORS.muted, maxWidth: 480, margin: "0 auto" },
  ctaPrimary: {
    marginTop: 26, background: COLORS.girl, color: "#fff", border: "none",
    borderRadius: 999, padding: "16px 36px", fontSize: 17, fontWeight: 700, cursor: "pointer",
    boxShadow: "0 10px 26px rgba(255,107,157,.35)",
  },
  ctaHint: { marginTop: 10, fontSize: 13, color: COLORS.muted },

  section: { maxWidth: 960, margin: "0 auto", padding: "50px 24px" },
  sectionAlt: {
    maxWidth: 960, margin: "0 auto", padding: "50px 24px",
    background: "rgba(255,255,255,.03)", borderRadius: 32,
  },
  mockRow: {
    display: "flex", alignItems: "center", gap: 44, flexWrap: "wrap",
    justifyContent: "center",
  },
  mockText: { flex: "1 1 280px", maxWidth: 380, textAlign: "left" },
  stepTag: {
    fontSize: 12, textTransform: "uppercase", letterSpacing: "1.5px",
    color: COLORS.boy, marginBottom: 8, fontWeight: 700,
  },
  h2: { fontFamily: "Georgia, serif", fontSize: 26, margin: "0 0 12px" },
  body: { fontSize: 15, lineHeight: 1.6, color: "rgba(255,255,255,.78)" },

  // phone frame
  phone: {
    width: 220, height: 440, background: "#0F0918", borderRadius: 36,
    padding: 10, boxShadow: "0 24px 60px rgba(0,0,0,.5)", flexShrink: 0,
    position: "relative",
  },
  phoneNotch: {
    position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
    width: 70, height: 18, background: "#0F0918", borderRadius: 10, zIndex: 2,
  },
  phoneScreen: {
    width: "100%", height: "100%", background: COLORS.bg, borderRadius: 26,
    overflow: "hidden", display: "flex", flexDirection: "column",
  },
  mockInner: {
    flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", padding: 16, gap: 12,
  },

  // swipe mock
  mockCard: {
    width: "100%", background: COLORS.card, borderRadius: 18, padding: 16,
    display: "flex", flexDirection: "column", alignItems: "center", color: COLORS.ink,
  },
  mockMonogram: {
    width: 44, height: 44, borderRadius: "50%", display: "flex",
    alignItems: "center", justifyContent: "center", color: "#fff",
    fontWeight: 700, fontSize: 20, marginBottom: 8,
  },
  mockName: { fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, margin: "0 0 6px" },
  mockPill: {
    fontSize: 10, color: "#fff", padding: "2px 8px", borderRadius: 999,
    textTransform: "uppercase", fontWeight: 700,
  },
  mockMeaning: { fontSize: 12, fontStyle: "italic", marginTop: 8, color: "#5A4A6A" },
  mockActions: { display: "flex", gap: 20 },
  mockCircle: {
    width: 38, height: 38, borderRadius: "50%", border: "2px solid",
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "#fff", fontSize: 16,
  },

  // results mock
  mockTableTitle: { fontSize: 12, color: COLORS.muted, alignSelf: "flex-start" },
  mockTable: { width: "100%", display: "flex", flexDirection: "column", gap: 6 },
  mockTableRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    background: "rgba(255,255,255,.06)", borderRadius: 10, padding: "8px 10px",
    fontSize: 12,
  },
  mockTableName: { flex: 1 },
  mockTallyBadge: {
    fontSize: 10, background: "rgba(255,255,255,.12)", padding: "2px 6px", borderRadius: 999,
  },

  // group/QR mock
  mockQrBox: { background: "#fff", borderRadius: 12, padding: 10 },
  mockQrGrid: {
    width: 90, height: 90, display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)", gridTemplateRows: "repeat(5, 1fr)",
  },
  mockCode: { fontFamily: "Georgia, serif", fontSize: 16, letterSpacing: "3px", fontWeight: 700 },
  mockMemberRow: { display: "flex", alignItems: "center", gap: 8, width: "100%" },
  mockAvatar: {
    width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,.15)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 11, fontWeight: 700, flexShrink: 0,
  },
  mockMemberLabel: { fontSize: 11, color: "rgba(255,255,255,.8)" },

  finalCta: { textAlign: "center", padding: "60px 24px 80px" },
  linkBtn: {
    display: "block", margin: "16px auto 0", background: "transparent",
    border: "none", color: COLORS.muted, fontSize: 14, cursor: "pointer",
  },
};
