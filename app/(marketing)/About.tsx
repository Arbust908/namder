// app/(marketing)/About.tsx
// "Nosotros" / About page. Bio + site link are placeholders — search for
// [EDITAR: ...] markers and replace with the real copy before shipping.

import React, { useState, useRef, useEffect } from "react";
import { COLORS, heroGradientTight } from "@/lib/theme";

const FAQS: Array<{ q: string; a: string }> = [
  {
    q: "¿Namder guarda mis datos?",
    a: "Sí, lo mínimo necesario: tu nombre para mostrar, tus votos, y a qué grupos pertenecés. Si entrás como invitado, podés crear una cuenta después sin perder nada de lo que ya elegiste.",
  },
  {
    q: "¿Necesito crear una cuenta para usarlo?",
    a: "No. Podés entrar solo con un nombre y empezar a swipear al toque. Crear cuenta es opcional, para cuando quieras seguir desde otro dispositivo.",
  },
  {
    q: "¿Cuántas personas pueden estar en un grupo?",
    a: "Hasta 8. Un nombre se marca con ⭐ solo cuando absolutamente todos en el grupo lo eligieron.",
  },
  {
    q: "¿De dónde salen los nombres?",
    a: "Un dataset curado de nombres argentinos y en español, con origen y significado. La base está pensada para poder ampliarse a otros países o fuentes más adelante.",
  },
  {
    q: "¿Puedo usarlo si no estoy esperando un bebé humano?",
    a: "Nada te lo impide — algunas parejas lo usan para nombrar mascotas, plantas o proyectos. El mecanismo de match es el mismo.",
  },
  {
    q: "¿Es gratis?",
    a: "Sí.",
  },
];

export default function About({ onBack }: { onBack: () => void }) {
  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <span style={styles.logo}>
          Nam<span style={{ color: COLORS.girl }}>d</span>er
        </span>
        <button style={styles.navLink} onClick={onBack}>
          ← Volver
        </button>
      </nav>

      {/* ---------- Bio ---------- */}
      <section className="anim-slide-up" style={styles.bioSection}>
        <div style={styles.avatarPlaceholder}>[EDITAR: FOTO]</div>
        <h1 style={styles.h1}>[EDITAR: Nombre y Apellido]</h1>
        <p style={styles.bioText}>
          [EDITAR: 2-3 líneas contando quién sos, por qué armaste Namder, y
          cualquier contexto que quieras compartir — por ejemplo qué te llevó
          a construir esta herramienta y para quién la pensaste.]
        </p>
        <a
          href="[EDITAR: https://tu-sitio.com]"
          target="_blank"
          rel="noreferrer"
          style={styles.siteLink}
        >
          [EDITAR: tu-sitio.com] →
        </a>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="anim-slide-up anim-d3" style={styles.faqSection}>
        <p style={styles.kicker}>Preguntas frecuentes</p>
        <h2 style={styles.h2}>Lo que la gente suele preguntar</h2>
        <div style={styles.faqList}>
          {FAQS.map((item, i) => (
            <FaqItem key={i} q={item.q} a={item.a} />
          ))}
        </div>
      </section>

      <footer style={styles.footer}>
        <span style={styles.footerText}>Namder · hecho con cariño 💛</span>
      </footer>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLParagraphElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [a]);

  return (
    <div style={styles.faqItem}>
      <button
        style={styles.faqQuestion}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span>{q}</span>
        <span
          style={{
            ...styles.faqChevron,
            transform: open ? "rotate(45deg)" : "rotate(0deg)",
            transition: "transform .25s ease-out",
          }}
        >
          +
        </span>
      </button>
      <div
        style={{
          overflow: "hidden",
          maxHeight: open ? contentHeight || 500 : 0,
          opacity: open ? 1 : 0,
          transition: "max-height .3s ease-out, opacity .25s ease-out",
        }}
      >
        <p ref={contentRef} style={styles.faqAnswer}>{a}</p>
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
    maxWidth: 640, margin: "0 auto", padding: "22px 24px",
    display: "flex", justifyContent: "space-between", alignItems: "center",
  },
  logo: { fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700 },
  navLink: {
    background: "transparent", border: "none", color: COLORS.muted,
    fontSize: 14, cursor: "pointer",
    transition: "color .2s ease-out",
  },

  bioSection: {
    maxWidth: 480, margin: "0 auto", padding: "20px 24px 50px",
    textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center",
  },
  avatarPlaceholder: {
    width: 96, height: 96, borderRadius: "50%",
    background: "rgba(255,255,255,.08)", border: "1px dashed rgba(255,255,255,.3)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 11, color: COLORS.muted, marginBottom: 18, textAlign: "center", padding: 8,
  },
  h1: { fontFamily: "Georgia, serif", fontSize: 28, margin: "0 0 14px" },
  bioText: { fontSize: 15, lineHeight: 1.65, color: "rgba(255,255,255,.8)" },
  siteLink: {
    marginTop: 18, color: COLORS.boy, fontSize: 15, fontWeight: 600,
    textDecoration: "none",
  },

  faqSection: { maxWidth: 640, margin: "0 auto", padding: "10px 24px 60px" },
  kicker: {
    textTransform: "uppercase", letterSpacing: "2px", fontSize: 12,
    color: COLORS.girl, marginBottom: 6, textAlign: "center",
  },
  h2: {
    fontFamily: "Georgia, serif", fontSize: 26, textAlign: "center",
    margin: "0 0 28px",
  },
  faqList: { display: "flex", flexDirection: "column", gap: 10 },
  faqItem: {
    background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)",
    borderRadius: 14, overflow: "hidden",
  },
  faqQuestion: {
    width: "100%", background: "transparent", border: "none", color: "#fff",
    padding: "16px 18px", fontSize: 15, fontWeight: 600, textAlign: "left",
    cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center",
  },
  faqChevron: { color: COLORS.girl, fontSize: 20, flexShrink: 0, marginLeft: 12 },
  faqAnswer: {
    padding: "0 18px 16px", fontSize: 14, lineHeight: 1.6, color: "rgba(255,255,255,.75)",
  },

  footer: { textAlign: "center", padding: "20px 24px 40px" },
  footerText: { fontSize: 13, color: COLORS.muted },
};
