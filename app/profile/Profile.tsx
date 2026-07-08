// app/profile/Profile.tsx
// "Mi perfil" — view/edit display name, see guest vs registered status, and
// (only for guests) a path to upgrade without losing history.

import React, { useEffect, useState } from "react";
import { getAuthState, AuthState } from "@/lib/authState";
import { setGuestDisplay } from "@/lib/guestAuth";
import { upgradeGuestToRegistered, logout } from "@/lib/registeredAuth";
import { apiUpdateDisplay } from "@/lib/api-client";
import { COLORS } from "@/lib/theme";

export default function Profile({ onLoggedOut }: { onLoggedOut: () => void }) {
  const [state, setState] = useState<AuthState>({ kind: "anonymous" });
  const [display, setDisplay] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const s = getAuthState();
    setState(s);
    if (s.kind !== "anonymous") setDisplay(s.display);
  }, []);

  const saveDisplay = async () => {
    if (!display.trim()) return;
    setSavingName(true);
    try {
      if (state.kind === "guest") {
        await setGuestDisplay(display);
      } else if (state.kind === "registered") {
        await apiUpdateDisplay(display.trim());
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } finally {
      setSavingName(false);
    }
  };

  const submitUpgrade = async () => {
    if (!email.trim() || password.length < 8) {
      setError("Email válido y contraseña de al menos 8 caracteres.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await upgradeGuestToRegistered(email.trim(), password);
      setState(getAuthState());
      setShowUpgrade(false);
    } catch {
      setError("No pudimos crear la cuenta. ¿El email ya está en uso?");
    } finally {
      setBusy(false);
    }
  };

  const doLogout = () => {
    logout();
    onLoggedOut();
  };

  return (
    <main style={styles.wrap}>
      <p style={styles.kicker}>Mi perfil</p>
      <h1 style={styles.h1}>{display || "Vos"}</h1>

      <div style={styles.card}>
        <label style={styles.label}>Nombre para mostrar</label>
        <div style={styles.row}>
          <input
            style={styles.input}
            value={display}
            onChange={(e) => setDisplay(e.target.value)}
            maxLength={24}
          />
          <button
            className="cta"
            style={styles.smallCta}
            onClick={saveDisplay}
            disabled={savingName}
          >
            {saved ? "✓" : "Guardar"}
          </button>
        </div>

        <div style={styles.statusRow}>
          <span style={styles.statusLabel}>Estado de cuenta</span>
          <span
            style={{
              ...styles.badge,
              background:
                state.kind === "registered"
                  ? "rgba(91,214,165,.18)"
                  : "rgba(255,209,92,.18)",
              color:
                state.kind === "registered" ? "#5BD6A5" : COLORS.girl,
            }}
          >
            {state.kind === "registered" ? "Registrado" : "Invitado"}
          </span>
        </div>
        {state.kind === "registered" && (
          <p style={styles.emailText}>{state.email}</p>
        )}
      </div>

      {state.kind === "guest" && !showUpgrade && (
        <div style={styles.upgradeCard}>
          <p style={styles.upgradeTitle}>Guardá tu progreso</p>
          <p style={styles.upgradeText}>
            Creá una cuenta para entrar desde otro dispositivo sin perder tus
            grupos ni tus elecciones.
          </p>
          <button
            className="cta"
            style={styles.ctaOutline}
            onClick={() => setShowUpgrade(true)}
          >
            Crear cuenta
          </button>
        </div>
      )}

      {state.kind === "guest" && showUpgrade && (
        <div style={styles.upgradeCard}>
          <input
            style={styles.input}
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            style={{ ...styles.input, marginTop: 10 }}
            placeholder="Contraseña (mín. 8 caracteres)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            className="cta"
            style={{ ...styles.ctaOutline, marginTop: 12 }}
            onClick={submitUpgrade}
            disabled={busy}
          >
            {busy ? "Creando…" : "Confirmar"}
          </button>
          <button
            style={styles.linkBack}
            onClick={() => setShowUpgrade(false)}
          >
            Cancelar
          </button>
        </div>
      )}

      {error && <p style={styles.error}>{error}</p>}

      {state.kind === "registered" && (
        <button style={styles.logoutBtn} onClick={doLogout}>
          Cerrar sesión
        </button>
      )}
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
  },
  kicker: {
    textTransform: "uppercase",
    letterSpacing: "2px",
    fontSize: 12,
    color: COLORS.girl,
    marginBottom: 4,
  },
  h1: { fontFamily: "Georgia, serif", fontSize: 30, margin: "0 0 20px" },
  card: {
    background: "rgba(255,255,255,.05)",
    border: "1px solid rgba(255,255,255,.1)",
    borderRadius: 18,
    padding: 18,
  },
  label: {
    fontSize: 12,
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  row: { display: "flex", gap: 10, marginTop: 8 },
  input: {
    flex: 1,
    background: "rgba(255,255,255,.08)",
    border: "1px solid rgba(255,255,255,.16)",
    borderRadius: 12,
    padding: "12px 14px",
    color: "#fff",
    fontSize: 15,
  },
  smallCta: {
    background: COLORS.girl,
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "0 18px",
    fontWeight: 700,
    cursor: "pointer",
  },
  statusRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 18,
    paddingTop: 14,
    borderTop: "1px solid rgba(255,255,255,.08)",
  },
  statusLabel: { fontSize: 13, color: COLORS.muted },
  badge: {
    fontSize: 12,
    fontWeight: 700,
    padding: "4px 10px",
    borderRadius: 999,
  },
  emailText: { fontSize: 13, color: COLORS.muted, marginTop: 6 },
  upgradeCard: {
    marginTop: 16,
    background: "rgba(255,209,92,.08)",
    border: "1px solid rgba(255,209,92,.25)",
    borderRadius: 18,
    padding: 18,
  },
  upgradeTitle: { fontWeight: 700, fontSize: 15, marginBottom: 4 },
  upgradeText: {
    fontSize: 13,
    color: "rgba(255,255,255,.75)",
    lineHeight: 1.5,
    marginBottom: 12,
  },
  ctaOutline: {
    width: "100%",
    background: "transparent",
    border: `2px solid ${COLORS.girl}`,
    color: "#fff",
    borderRadius: 999,
    padding: "12px",
    fontWeight: 700,
    cursor: "pointer",
  },
  linkBack: {
    display: "block",
    margin: "10px auto 0",
    background: "transparent",
    border: "none",
    color: COLORS.muted,
    fontSize: 13,
    cursor: "pointer",
  },
  error: {
    marginTop: 14,
    color: "#FF8FA8",
    fontSize: 13,
    background: "rgba(255,94,126,.12)",
    padding: "10px 14px",
    borderRadius: 10,
  },
  logoutBtn: {
    marginTop: 24,
    background: "transparent",
    border: "1px solid rgba(255,255,255,.2)",
    color: "rgba(255,255,255,.7)",
    borderRadius: 999,
    padding: "10px 18px",
    fontSize: 13,
    cursor: "pointer",
  },
};
