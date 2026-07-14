// app/profile/Profile.tsx
// "Mi perfil" — view/edit display name, see guest vs registered status, and
// (only for guests) a path to upgrade without losing history.
// Also shows a grid of the user's groups when they have any.

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthState, AuthState } from "@/lib/authState";
import { setGuestDisplay } from "@/lib/guestAuth";
import { upgradeGuestToRegistered, logout } from "@/lib/registeredAuth";
import { apiUpdateDisplay, type MyRoomData } from "@/lib/api-client";
import { COLORS } from "@/lib/theme";

const STATUS_LABEL: Record<string, string> = {
  lobby: "En curso",
  swiping: "Deslizando",
  done: "Terminado",
};

export default function Profile({
  onLoggedOut,
  onStartGroup,
  startingGroup = false,
  rooms = [],
}: {
  onLoggedOut: () => void;
  onStartGroup: () => void;
  startingGroup?: boolean;
  rooms?: MyRoomData[];
}) {
  const router = useRouter();
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

  // Layout + dark background live in globals.css (.profile-wrap /
  // .profile-inner) as mobile-first media queries. Profile's wrap previously
  // had no background, so the white <body> showed through — that was the
  // "light mode" bug; .profile-wrap now carries the dark gradient.
  return (
    <main className="profile-wrap" style={{ fontFamily: "system-ui, sans-serif" }}>
      <div className="profile-inner anim-fade-in">
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
            style={{
              ...styles.smallCta,
              transform: saved ? "scale(1.08)" : "scale(1)",
              transition: "transform .2s cubic-bezier(.25,.46,.45,.94), filter .2s ease-out",
            }}
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

      {/* Groups grid — when the user already has groups, show them as cards
          with a "new group" card at the end. Otherwise just the CTA. */}
      {rooms.length > 0 ? (
        <div style={styles.groupsGrid}>
          {rooms.map((r, i) => {
            const d = Math.min(i, 7);
            return (
              <button
                key={r.id}
                className={`opt anim-scale-in anim-d${d}`}
                style={{
                  ...styles.groupCard,
                  transition: "transform .25s cubic-bezier(.25,.46,.45,.94), box-shadow .25s ease-out",
                }}
                onClick={() => router.push(`/room/${r.code}`)}
              >
                <p style={styles.groupCode}>{r.code}</p>
                <p style={styles.groupMeta}>
                  {r.memberCount} {r.memberCount === 1 ? "persona" : "personas"}
                  {" · "}
                  {STATUS_LABEL[r.status] || r.status}
                </p>
                <p style={styles.groupVotes}>
                  {r.voteCount > 0
                    ? `${r.voteCount} votos`
                    : "Sin votos aún"}
                </p>
              </button>
            );
          })}
          <button
            className="opt anim-scale-in anim-d6"
            style={{
              ...styles.newGroupCard,
              transition: "transform .25s cubic-bezier(.25,.46,.45,.94), border-color .25s ease-out",
            }}
            onClick={onStartGroup}
            disabled={startingGroup}
          >
            <span style={styles.newGroupPlus}>+</span>
            <span style={styles.newGroupLabel}>
              {startingGroup ? "Creando…" : "Nuevo grupo"}
            </span>
          </button>
        </div>
      ) : (
        <button
          className="cta"
          style={styles.startGroupBtn}
          onClick={onStartGroup}
          disabled={startingGroup}
        >
          {startingGroup ? "Creando grupo…" : "Iniciar grupo nuevo"}
        </button>
      )}

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
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
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
  startGroupBtn: {
    marginTop: 18,
    width: "100%",
    background: COLORS.girl,
    color: "#fff",
    border: "none",
    borderRadius: 999,
    padding: "15px",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
  },
  groupsGrid: {
    marginTop: 22,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    gap: 12,
  },
  groupCard: {
    background: "rgba(255,255,255,.05)",
    border: "1px solid rgba(255,255,255,.1)",
    borderRadius: 16,
    padding: 16,
    cursor: "pointer",
    textAlign: "left" as const,
    color: "#fff",
    fontFamily: "system-ui, sans-serif",
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
  },
  groupCode: {
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: "3px",
    fontFamily: "Georgia, serif",
    margin: 0,
  },
  groupMeta: {
    fontSize: 12,
    color: COLORS.muted,
    margin: 0,
  },
  groupVotes: {
    fontSize: 11,
    color: "rgba(255,255,255,.5)",
    margin: 0,
  },
  newGroupCard: {
    background: "rgba(255,255,255,.03)",
    border: "2px dashed rgba(255,255,255,.15)",
    borderRadius: 16,
    padding: 16,
    cursor: "pointer",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    color: COLORS.girl,
    fontFamily: "system-ui, sans-serif",
    minHeight: 100,
  },
  newGroupPlus: {
    fontSize: 28,
    fontWeight: 300,
    lineHeight: 1,
  },
  newGroupLabel: {
    fontSize: 13,
    fontWeight: 600,
  },
};
