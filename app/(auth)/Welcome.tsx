// app/(auth)/Welcome.tsx
// First screen a new visitor sees. Two paths, one screen:
//   - "Continue as guest" — just a display name, nothing else. Calls
//     ensureGuest({ displayName }) under the hood; the synthetic email/secret
//     PocketBase needs never surface in the UI.
//   - "Regístrate" CTA — takes them to the real signup form (email + password).
//
// This is intentionally the ONLY place a brand-new visitor is asked anything.
// Existing guests/registered users skip this screen entirely (see App.tsx-level
// routing: if getAuthState().kind !== "anonymous", go straight to the room flow).

import React, { useState } from "react";
import { ensureGuest } from "@/lib/guestAuth";
import { registerNew } from "@/lib/registeredAuth";

const COLORS = {
  girl: "#FF6B9D",
  ink: "#1A1023",
  muted: "rgba(255,255,255,.6)",
};

type Props = {
  onReady: () => void; // called once a session (guest or registered) exists
};

export default function Welcome({ onReady }: Props) {
  const [mode, setMode] = useState<"pick" | "guest" | "register">("pick");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const continueAsGuest = async () => {
    if (!name.trim()) {
      setError("Poné un nombre para que tu grupo te reconozca.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await ensureGuest({ displayName: name });
      onReady();
    } catch {
      setError("No pudimos crear tu sesión. Probá de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  const submitRegister = async () => {
    if (!email.trim() || password.length < 8) {
      setError("Email válido y contraseña de al menos 8 caracteres.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await registerNew(email.trim(), password, name);
      onReady();
    } catch (e: any) {
      setError(
        e?.response?.message === "Failed to create record."
          ? "Ese email ya está registrado. Probá iniciar sesión."
          : "No pudimos crear tu cuenta. Revisá los datos."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <main style={styles.wrap}>
      <span style={styles.logo}>
        Nam<span style={{ color: COLORS.girl }}>d</span>er
      </span>

      {mode === "pick" && (
        <>
          <h1 style={styles.h1}>¿Cómo querés empezar?</h1>
          <p style={styles.lede}>
            Podés probar ya mismo solo con un nombre, o crear una cuenta para
            volver a entrar desde otro dispositivo.
          </p>

          <div style={styles.card}>
            <p style={styles.cardLabel}>Rápido, sin vueltas</p>
            <input
              style={styles.input}
              placeholder="Tu nombre (ej. Fran)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={24}
            />
            <button
              className="cta"
              style={styles.ctaPrimary}
              onClick={continueAsGuest}
              disabled={busy}
            >
              {busy ? "Un momento…" : "Continuar como invitado"}
            </button>
          </div>

          <div style={styles.divider}>
            <span style={styles.dividerLine} />
            <span style={styles.dividerText}>o</span>
            <span style={styles.dividerLine} />
          </div>

          <button
            className="ghost-cta"
            style={styles.ctaSecondary}
            onClick={() => setMode("register")}
          >
            Regístrate
          </button>
          <p style={styles.hint}>
            Con cuenta podés entrar desde el celu de otra persona y seguir
            donde quedaste.
          </p>
        </>
      )}

      {mode === "register" && (
        <>
          <h1 style={styles.h1}>Creá tu cuenta</h1>
          <div style={styles.card}>
            <input
              style={styles.input}
              placeholder="Tu nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={24}
            />
            <input
              style={styles.input}
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              style={styles.input}
              placeholder="Contraseña (mín. 8 caracteres)"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              className="cta"
              style={styles.ctaPrimary}
              onClick={submitRegister}
              disabled={busy}
            >
              {busy ? "Creando cuenta…" : "Crear cuenta"}
            </button>
          </div>
          <button
            className="ghost-cta"
            style={styles.linkBack}
            onClick={() => setMode("pick")}
          >
            ← Volver
          </button>
        </>
      )}

      {error && <p style={styles.error}>{error}</p>}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    minHeight: "100vh",
    background: "radial-gradient(120% 80% at 50% -10%, #4A2B6B 0%, #2A1B3D 55%)",
    color: "#fff",
    fontFamily: "system-ui, sans-serif",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "28px 24px 40px",
    textAlign: "center",
    maxWidth: 480,
    margin: "0 auto",
  },
  logo: {
    fontFamily: "Georgia, serif",
    fontSize: 26,
    fontWeight: 700,
    marginBottom: 28,
    alignSelf: "flex-start",
  },
  h1: { fontFamily: "Georgia, serif", fontSize: 28, margin: "8px 0 10px" },
  lede: { fontSize: 15, color: COLORS.muted, lineHeight: 1.5, maxWidth: 360 },
  card: {
    width: "100%",
    background: "rgba(255,255,255,.06)",
    border: "1px solid rgba(255,255,255,.12)",
    borderRadius: 20,
    padding: 20,
    marginTop: 22,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  cardLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "1.5px",
    color: COLORS.muted,
    textAlign: "left",
  },
  input: {
    background: "rgba(255,255,255,.08)",
    border: "1px solid rgba(255,255,255,.16)",
    borderRadius: 12,
    padding: "13px 14px",
    color: "#fff",
    fontSize: 16,
  },
  ctaPrimary: {
    background: COLORS.girl,
    color: "#fff",
    border: "none",
    borderRadius: 999,
    padding: "14px",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
  },
  ctaSecondary: {
    width: "100%",
    background: "transparent",
    border: "2px solid rgba(255,255,255,.25)",
    color: "#fff",
    borderRadius: 999,
    padding: "13px",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 4,
  },
  linkBack: {
    background: "transparent",
    border: "none",
    color: COLORS.muted,
    fontSize: 14,
    marginTop: 18,
    cursor: "pointer",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    width: "100%",
    margin: "22px 0 14px",
  },
  dividerLine: { flex: 1, height: 1, background: "rgba(255,255,255,.15)" },
  dividerText: { fontSize: 13, color: COLORS.muted },
  hint: { fontSize: 12, color: COLORS.muted, marginTop: 10, maxWidth: 320 },
  error: {
    marginTop: 18,
    color: "#FF8FA8",
    fontSize: 13,
    background: "rgba(255,94,126,.12)",
    padding: "10px 14px",
    borderRadius: 10,
  },
};
