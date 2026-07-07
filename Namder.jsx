import React, { useState, useRef, useEffect, useMemo } from "react";

/* ============================================================================
   NAMDER — swipe to match on baby names with your group.
   ----------------------------------------------------------------------------
   A group of N people (default 2) each swipe through the same deck.
   A name becomes a ⭐ MATCH only when EVERYONE in the group liked it.
   ----------------------------------------------------------------------------
   ADAPTING TO OTHER COUNTRIES / SOURCES
   Replace the body of getNames(). Keep the return shape:
     [{ name, gender: "girl"|"boy", origin, meaning }]
   Good no-key-ish sources: Nationalize.io, behindthename API, a national
   stats CSV you host. Everything else (group, swiping, matching) stays.
   ============================================================================ */

const NAMES = [
  // — Girls (Argentina / Spanish) —
  { name: "Valentina", gender: "girl", origin: "Latin", meaning: "Strong, healthy" },
  { name: "Sofía", gender: "girl", origin: "Greek", meaning: "Wisdom" },
  { name: "Isabella", gender: "girl", origin: "Hebrew", meaning: "Pledged to God" },
  { name: "Martina", gender: "girl", origin: "Latin", meaning: "Of Mars, warlike" },
  { name: "Catalina", gender: "girl", origin: "Greek", meaning: "Pure" },
  { name: "Emilia", gender: "girl", origin: "Latin", meaning: "Rival, eager" },
  { name: "Renata", gender: "girl", origin: "Latin", meaning: "Reborn" },
  { name: "Delfina", gender: "girl", origin: "Greek", meaning: "Dolphin; from Delphi" },
  { name: "Lucía", gender: "girl", origin: "Latin", meaning: "Light" },
  { name: "Pilar", gender: "girl", origin: "Spanish", meaning: "Pillar (of the Virgin)" },
  { name: "Mora", gender: "girl", origin: "Spanish", meaning: "Blackberry, mulberry" },
  { name: "Juana", gender: "girl", origin: "Hebrew", meaning: "God is gracious" },
  { name: "Carmen", gender: "girl", origin: "Latin", meaning: "Song, poem" },
  { name: "Rocío", gender: "girl", origin: "Spanish", meaning: "Morning dew" },
  { name: "Guadalupe", gender: "girl", origin: "Spanish", meaning: "River of the wolf" },
  { name: "Antonella", gender: "girl", origin: "Latin", meaning: "Priceless, of great worth" },
  { name: "Camila", gender: "girl", origin: "Latin", meaning: "Attendant at a ceremony" },
  { name: "Julieta", gender: "girl", origin: "Latin", meaning: "Youthful" },
  { name: "Olivia", gender: "girl", origin: "Latin", meaning: "Olive tree" },
  { name: "Paloma", gender: "girl", origin: "Spanish", meaning: "Dove" },

  // — Boys (Argentina / Spanish) —
  { name: "Mateo", gender: "boy", origin: "Hebrew", meaning: "Gift of God" },
  { name: "Benjamín", gender: "boy", origin: "Hebrew", meaning: "Son of the right hand" },
  { name: "Santiago", gender: "boy", origin: "Hebrew", meaning: "Supplanter (St. James)" },
  { name: "Joaquín", gender: "boy", origin: "Hebrew", meaning: "Raised by God" },
  { name: "Tomás", gender: "boy", origin: "Aramaic", meaning: "Twin" },
  { name: "Bautista", gender: "boy", origin: "Greek", meaning: "Baptist, one who baptizes" },
  { name: "Lautaro", gender: "boy", origin: "Mapuche", meaning: "Swift hawk" },
  { name: "Thiago", gender: "boy", origin: "Hebrew", meaning: "Supplanter" },
  { name: "Felipe", gender: "boy", origin: "Greek", meaning: "Lover of horses" },
  { name: "Ignacio", gender: "boy", origin: "Latin", meaning: "Fiery, ardent" },
  { name: "Facundo", gender: "boy", origin: "Latin", meaning: "Eloquent, fortunate" },
  { name: "Lorenzo", gender: "boy", origin: "Latin", meaning: "From Laurentum; laurel" },
  { name: "Gael", gender: "boy", origin: "Breton", meaning: "Generous lord" },
  { name: "Bruno", gender: "boy", origin: "Germanic", meaning: "Brown; armor" },
  { name: "Dante", gender: "boy", origin: "Latin", meaning: "Enduring, steadfast" },
  { name: "Ramiro", gender: "boy", origin: "Germanic", meaning: "Famous counselor" },
  { name: "Emiliano", gender: "boy", origin: "Latin", meaning: "Rival, eager" },
  { name: "Nicolás", gender: "boy", origin: "Greek", meaning: "Victory of the people" },
  { name: "Valentino", gender: "boy", origin: "Latin", meaning: "Strong, healthy" },
  { name: "Salvador", gender: "boy", origin: "Latin", meaning: "Savior" },
];

/* Replace this to use a different dataset or a live API. */
async function getNames({ gender }) {
  let pool = NAMES;
  if (gender === "girl") pool = NAMES.filter((n) => n.gender === "girl");
  if (gender === "boy") pool = NAMES.filter((n) => n.gender === "boy");
  return [...pool].sort(() => Math.random() - 0.5);
}

const COLORS = {
  bg: "#2A1B3D",
  card: "#FFF8F0",
  ink: "#1A1023",
  girl: "#FF6B9D",
  boy: "#4ECDC4",
  either: "#F4A261",
  like: "#5BD6A5",
  nope: "#FF5E7E",
  star: "#FFD15C",
  muted: "#8B7A99",
};

const MAX_PEOPLE = 8;

export default function Namder() {
  // screen: setup -> swipe -> handoff -> ... -> results
  const [screen, setScreen] = useState("setup");
  const [people, setPeople] = useState(["", ""]);
  const [gender, setGender] = useState("either");
  const [deck, setDeck] = useState([]);
  const [index, setIndex] = useState(0);
  const [activePerson, setActivePerson] = useState(0);
  // votes[personIdx] = { [name]: true|false }
  const [votes, setVotes] = useState([{}, {}]);
  const [loading, setLoading] = useState(false);

  const names = people.map((p, i) => p.trim() || `Person ${i + 1}`);

  const startSession = async (g) => {
    setLoading(true);
    setGender(g);
    const deckNames = await getNames({ gender: g });
    setDeck(deckNames);
    setIndex(0);
    setActivePerson(0);
    setVotes(people.map(() => ({})));
    setLoading(false);
    setScreen("swipe");
  };

  const vote = (liked) => {
    const card = deck[index];
    if (!card) return;
    setVotes((prev) => {
      const next = prev.map((v) => ({ ...v }));
      next[activePerson][card.name] = liked;
      return next;
    });
    setIndex((i) => i + 1);
  };

  // when the active person reaches the end of the deck
  const personDone = index >= deck.length && deck.length > 0 && screen === "swipe";
  useEffect(() => {
    if (!personDone) return;
    if (activePerson < people.length - 1) {
      setActivePerson((p) => p + 1);
      setIndex(0);
      setScreen("handoff");
    } else {
      setScreen("results");
    }
  }, [personDone]); // eslint-disable-line

  // tally: how many people liked each name
  const tally = useMemo(() => {
    const map = {};
    deck.forEach((c) => {
      let likes = 0;
      votes.forEach((v) => {
        if (v[c.name] === true) likes++;
      });
      map[c.name] = likes;
    });
    return map;
  }, [deck, votes]);

  const resetToSetup = () => {
    setScreen("setup");
    setVotes(people.map(() => ({})));
    setIndex(0);
    setActivePerson(0);
  };

  return (
    <div style={styles.app}>
      <style>{globalCSS}</style>
      <header style={styles.header}>
        <span style={styles.logo}>
          Nam<span style={{ color: COLORS.girl }}>d</span>er
        </span>
        {screen === "swipe" && (
          <span style={styles.turnTag}>
            {names[activePerson]} · {activePerson + 1}/{people.length}
          </span>
        )}
      </header>

      {screen === "setup" && (
        <Setup
          people={people}
          setPeople={setPeople}
          loading={loading}
          onStart={startSession}
        />
      )}

      {screen === "handoff" && (
        <Handoff person={names[activePerson]} onReady={() => setScreen("swipe")} />
      )}

      {screen === "swipe" && (
        <SwipeDeck deck={deck} index={index} onVote={vote} />
      )}

      {screen === "results" && (
        <Results
          deck={deck}
          tally={tally}
          groupSize={people.length}
          names={names}
          onRestart={resetToSetup}
        />
      )}
    </div>
  );
}

/* ----------------------------- Setup ----------------------------- */
function Setup({ people, setPeople, onStart, loading }) {
  const setName = (i, val) =>
    setPeople((p) => p.map((x, idx) => (idx === i ? val : x)));
  const addPerson = () =>
    people.length < MAX_PEOPLE && setPeople((p) => [...p, ""]);
  const removePerson = (i) =>
    people.length > 1 && setPeople((p) => p.filter((_, idx) => idx !== i));

  const opts = [
    { key: "girl", label: "Girl", color: COLORS.girl, sub: "Niña" },
    { key: "boy", label: "Boy", color: COLORS.boy, sub: "Niño" },
    { key: "either", label: "Either", color: COLORS.either, sub: "Cualquiera" },
  ];

  return (
    <main style={styles.center}>
      <p style={styles.kicker}>Find a name you all love</p>
      <h1 style={styles.h1}>Everyone swipes.<br />Stars need a yes from all.</h1>

      <div style={styles.peopleBlock}>
        <p style={styles.sectionLabel}>Who's deciding?</p>
        {people.map((p, i) => (
          <div key={i} style={styles.personRow}>
            <span style={styles.personNum}>{i + 1}</span>
            <input
              style={styles.input}
              value={p}
              onChange={(e) => setName(i, e.target.value)}
              placeholder={`Person ${i + 1}`}
              maxLength={20}
            />
            {people.length > 1 && (
              <button
                className="ghost"
                style={styles.removeBtn}
                onClick={() => removePerson(i)}
                aria-label={`Remove person ${i + 1}`}
              >
                ✕
              </button>
            )}
          </div>
        ))}
        {people.length < MAX_PEOPLE && (
          <button className="ghost" style={styles.addBtn} onClick={addPerson}>
            + Add person
          </button>
        )}
      </div>

      <p style={styles.pick}>Looking for a name for a…</p>
      <div style={styles.optRow}>
        {opts.map((o) => (
          <button
            key={o.key}
            className="opt"
            style={{ ...styles.optBtn, borderColor: o.color }}
            onClick={() => onStart(o.key)}
            disabled={loading}
          >
            <span style={{ ...styles.optLabel, color: o.color }}>{o.label}</span>
            <span style={styles.optSub}>{o.sub}</span>
          </button>
        ))}
      </div>
      {loading && <p style={styles.muted}>Shuffling the deck…</p>}
    </main>
  );
}

/* ----------------------------- Handoff ----------------------------- */
function Handoff({ person, onReady }) {
  return (
    <main style={styles.center}>
      <div style={styles.handoffCard}>
        <p style={styles.kicker}>Pass the phone</p>
        <h2 style={styles.h2}>{person}, you're up.</h2>
        <p style={styles.lede}>
          Swipe on your own honest gut — nobody sees anyone else's picks. The
          stars stay hidden until everyone's done.
        </p>
        <button className="cta" style={styles.cta} onClick={onReady}>
          I'm {person} — start swiping
        </button>
      </div>
    </main>
  );
}

/* ----------------------------- Swipe deck ----------------------------- */
function genderColor(g) {
  return g === "girl" ? COLORS.girl : g === "boy" ? COLORS.boy : COLORS.either;
}

function SwipeDeck({ deck, index, onVote }) {
  const remaining = deck.length - index;
  const top = deck[index];
  const next = deck[index + 1];

  return (
    <main style={styles.center}>
      <div style={styles.progressWrap}>
        <div style={{ ...styles.progressBar, width: `${(index / deck.length) * 100}%` }} />
      </div>
      <p style={styles.counter}>{remaining} left</p>

      <div style={styles.deckArea}>
        {next && <NameCard card={next} stacked />}
        {top ? (
          <SwipeCard key={top.name} card={top} onVote={onVote} />
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

function SwipeCard({ card, onVote }) {
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const start = useRef(null);

  const onDown = (x, y) => {
    start.current = { x, y };
    setDrag((d) => ({ ...d, active: true }));
  };
  const onMove = (x, y) => {
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
        transition: drag.active ? "none" : "transform .35s cubic-bezier(.2,.8,.2,1)",
        cursor: drag.active ? "grabbing" : "grab",
      }}
      onMouseDown={(e) => onDown(e.clientX, e.clientY)}
      onMouseMove={(e) => drag.active && onMove(e.clientX, e.clientY)}
      onMouseUp={onUp}
      onMouseLeave={() => drag.active && onUp()}
      onTouchStart={(e) => onDown(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchMove={(e) => onMove(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={onUp}
    >
      <span style={{ ...styles.stampLike, opacity: likeOp }}>LIKE</span>
      <span style={{ ...styles.stampNope, opacity: nopeOp }}>NOPE</span>
      <NameCardInner card={card} />
    </div>
  );
}

function NameCard({ card, stacked }) {
  return (
    <div style={{ ...styles.swipeCard, ...(stacked ? styles.stacked : {}) }}>
      <NameCardInner card={card} />
    </div>
  );
}

function NameCardInner({ card }) {
  const c = genderColor(card.gender);
  return (
    <>
      <div style={{ ...styles.monogram, background: c }}>{card.name[0]}</div>
      <h2 style={styles.cardName}>{card.name}</h2>
      <span style={{ ...styles.genderPill, background: c }}>
        {card.gender === "girl" ? "Niña" : card.gender === "boy" ? "Niño" : "Either"}
      </span>
      <p style={styles.meaning}>“{card.meaning}”</p>
      <p style={styles.origin}>{card.origin} origin</p>
    </>
  );
}

/* ----------------------------- Results ----------------------------- */
function Results({ deck, tally, groupSize, onRestart }) {
  // Starred = liked by everyone. Then partials, descending by like count.
  const ranked = deck
    .map((c) => ({ ...c, likes: tally[c.name] || 0 }))
    .filter((c) => c.likes > 0)
    .sort((a, b) => b.likes - a.likes || a.name.localeCompare(b.name));

  const starred = ranked.filter((c) => c.likes === groupSize);
  const partial = ranked.filter((c) => c.likes < groupSize);

  return (
    <main style={styles.center}>
      <p style={styles.kicker}>
        {starred.length} {starred.length === 1 ? "match" : "matches"}
      </p>
      <h2 style={styles.h2}>
        {starred.length > 0 ? "Everyone said yes ⭐" : "No unanimous picks yet"}
      </h2>

      {starred.length === 0 && (
        <p style={styles.lede}>
          Nobody hit a full house this round. The near-misses below show where
          you're close — reshuffle and try again.
        </p>
      )}

      {starred.length > 0 && (
        <div style={styles.matchList}>
          {starred.map((c) => (
            <div key={c.name} style={{ ...styles.matchRow, ...styles.starRow }}>
              <div style={{ ...styles.matchDot, background: genderColor(c.gender) }}>
                {c.name[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={styles.matchName}>
                  {c.name} <span style={styles.starIcon}>⭐</span>
                </div>
                <div style={styles.matchMeaning}>{c.meaning}</div>
              </div>
              <div style={styles.likeBadge}>
                {c.likes}/{groupSize}
              </div>
            </div>
          ))}
        </div>
      )}

      {partial.length > 0 && (
        <>
          <p style={{ ...styles.sectionLabel, marginTop: 26 }}>So close</p>
          <div style={styles.matchList}>
            {partial.map((c) => (
              <div key={c.name} style={styles.matchRow}>
                <div
                  style={{
                    ...styles.matchDot,
                    background: genderColor(c.gender),
                    opacity: 0.55,
                  }}
                >
                  {c.name[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={styles.matchName}>{c.name}</div>
                  <div style={styles.matchMeaning}>{c.meaning}</div>
                </div>
                <div style={{ ...styles.likeBadge, opacity: 0.7 }}>
                  {c.likes}/{groupSize}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <button className="cta" style={styles.cta} onClick={onRestart}>
        Start a new round
      </button>
    </main>
  );
}

/* ----------------------------- styles ----------------------------- */
const globalCSS = `
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  .opt:hover { transform: translateY(-4px); }
  .opt:focus-visible, .cta:focus-visible, .circle:focus-visible,
  .ghost:focus-visible, input:focus-visible {
    outline: 3px solid #fff; outline-offset: 3px;
  }
  .cta:hover { filter: brightness(1.08); transform: translateY(-2px); }
  .circle:hover { transform: scale(1.08); }
  .circle:active { transform: scale(.94); }
  .ghost:hover { background: rgba(255,255,255,.12); }
  input::placeholder { color: rgba(255,255,255,.4); }
  button { font-family: inherit; }
  @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
`;

const styles = {
  app: {
    minHeight: "100vh",
    background: `radial-gradient(120% 80% at 50% -10%, #4A2B6B 0%, ${COLORS.bg} 55%)`,
    color: "#fff",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  header: {
    width: "100%", maxWidth: 480, padding: "20px 24px",
    display: "flex", alignItems: "center", justifyContent: "space-between",
  },
  logo: { fontSize: 26, fontWeight: 700, letterSpacing: "-.5px" },
  turnTag: {
    fontFamily: "system-ui, sans-serif", fontSize: 13,
    background: "rgba(255,255,255,.14)", padding: "5px 12px", borderRadius: 999,
  },
  center: {
    width: "100%", maxWidth: 480, flex: 1, padding: "8px 24px 36px",
    display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
  },
  kicker: {
    fontFamily: "system-ui, sans-serif", textTransform: "uppercase",
    letterSpacing: "2px", fontSize: 12, color: COLORS.girl, margin: "8px 0 6px",
  },
  h1: { fontSize: 34, lineHeight: 1.12, margin: "4px 0 16px", fontWeight: 700 },
  h2: { fontSize: 30, margin: "4px 0 14px", fontWeight: 700 },
  lede: {
    fontFamily: "system-ui, sans-serif", fontSize: 16, lineHeight: 1.5,
    color: "rgba(255,255,255,.82)", maxWidth: 360,
  },
  sectionLabel: {
    fontFamily: "system-ui, sans-serif", fontSize: 13, letterSpacing: "1px",
    textTransform: "uppercase", color: "rgba(255,255,255,.55)",
    alignSelf: "flex-start", marginBottom: 10,
  },

  // people setup
  peopleBlock: {
    width: "100%", background: "rgba(255,255,255,.05)",
    border: "1px solid rgba(255,255,255,.1)", borderRadius: 18,
    padding: "18px 16px", marginTop: 8,
  },
  personRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 10 },
  personNum: {
    width: 26, height: 26, flexShrink: 0, borderRadius: "50%",
    background: "rgba(255,255,255,.12)", display: "flex",
    alignItems: "center", justifyContent: "center",
    fontFamily: "system-ui, sans-serif", fontSize: 13,
  },
  input: {
    flex: 1, background: "rgba(255,255,255,.08)",
    border: "1px solid rgba(255,255,255,.16)", borderRadius: 12,
    padding: "11px 14px", color: "#fff", fontSize: 16,
    fontFamily: "system-ui, sans-serif",
  },
  removeBtn: {
    width: 32, height: 32, flexShrink: 0, borderRadius: 10,
    background: "transparent", border: "1px solid rgba(255,255,255,.18)",
    color: "rgba(255,255,255,.7)", cursor: "pointer", fontSize: 13,
  },
  addBtn: {
    width: "100%", marginTop: 4, padding: "11px",
    background: "transparent", border: "1px dashed rgba(255,255,255,.3)",
    borderRadius: 12, color: "rgba(255,255,255,.8)", cursor: "pointer",
    fontFamily: "system-ui, sans-serif", fontSize: 15,
  },

  pick: {
    fontFamily: "system-ui, sans-serif", marginTop: 26, marginBottom: 14,
    fontSize: 15, color: "rgba(255,255,255,.7)",
  },
  optRow: { display: "flex", gap: 12, width: "100%" },
  optBtn: {
    flex: 1, background: "rgba(255,255,255,.05)", border: "2px solid",
    borderRadius: 18, padding: "18px 8px", display: "flex",
    flexDirection: "column", gap: 4, cursor: "pointer", transition: "transform .2s",
  },
  optLabel: { fontSize: 20, fontWeight: 700 },
  optSub: { fontFamily: "system-ui, sans-serif", fontSize: 12, color: "rgba(255,255,255,.55)" },
  muted: { fontFamily: "system-ui, sans-serif", color: COLORS.muted, marginTop: 18 },

  handoffCard: {
    background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)",
    borderRadius: 24, padding: "32px 26px", marginTop: 40,
  },

  progressWrap: {
    width: "100%", height: 5, background: "rgba(255,255,255,.12)",
    borderRadius: 999, overflow: "hidden", marginTop: 4,
  },
  progressBar: { height: "100%", background: COLORS.girl, transition: "width .3s ease" },
  counter: {
    fontFamily: "system-ui, sans-serif", fontSize: 13,
    color: "rgba(255,255,255,.6)", margin: "10px 0 4px",
  },

  deckArea: {
    position: "relative", width: "100%", height: 420, marginTop: 8,
    display: "flex", justifyContent: "center",
  },
  swipeCard: {
    position: "absolute", top: 0, width: "100%", maxWidth: 340, height: 400,
    background: COLORS.card, borderRadius: 28, boxShadow: "0 24px 60px rgba(0,0,0,.4)",
    color: COLORS.ink, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", padding: 28,
    userSelect: "none", overflow: "hidden",
  },
  stacked: { transform: "scale(.94) translateY(14px)", filter: "brightness(.96)" },
  monogram: {
    width: 84, height: 84, borderRadius: "50%", display: "flex",
    alignItems: "center", justifyContent: "center", fontSize: 40,
    fontWeight: 700, color: "#fff", marginBottom: 18,
  },
  cardName: { fontSize: 40, margin: "0 0 10px", fontWeight: 700, lineHeight: 1 },
  genderPill: {
    fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 600,
    color: "#fff", padding: "4px 12px", borderRadius: 999,
    textTransform: "uppercase", letterSpacing: "1px",
  },
  meaning: { fontSize: 18, fontStyle: "italic", margin: "20px 0 6px", color: "#3A2B4A" },
  origin: { fontFamily: "system-ui, sans-serif", fontSize: 13, color: COLORS.muted },
  stampLike: {
    position: "absolute", top: 26, left: 22, transform: "rotate(-16deg)",
    border: `4px solid ${COLORS.like}`, color: COLORS.like,
    fontFamily: "system-ui, sans-serif", fontWeight: 800, fontSize: 30,
    padding: "2px 14px", borderRadius: 10, letterSpacing: "2px",
  },
  stampNope: {
    position: "absolute", top: 26, right: 22, transform: "rotate(16deg)",
    border: `4px solid ${COLORS.nope}`, color: COLORS.nope,
    fontFamily: "system-ui, sans-serif", fontWeight: 800, fontSize: 30,
    padding: "2px 14px", borderRadius: 10, letterSpacing: "2px",
  },
  doneCard: {
    width: "100%", maxWidth: 340, height: 400, display: "flex",
    alignItems: "center", justifyContent: "center",
    color: "rgba(255,255,255,.7)", fontFamily: "system-ui, sans-serif",
  },

  actions: { display: "flex", gap: 28, marginTop: 26 },
  circleBtn: {
    width: 66, height: 66, borderRadius: "50%", background: "#fff",
    border: "3px solid", fontSize: 26, cursor: "pointer", display: "flex",
    alignItems: "center", justifyContent: "center",
    boxShadow: "0 8px 20px rgba(0,0,0,.3)", transition: "transform .15s",
  },

  cta: {
    marginTop: 26, background: COLORS.girl, color: "#fff", border: "none",
    borderRadius: 999, padding: "16px 34px", fontSize: 17, fontWeight: 700,
    cursor: "pointer", fontFamily: "system-ui, sans-serif",
    transition: "transform .15s, filter .15s", boxShadow: "0 10px 26px rgba(255,107,157,.4)",
  },

  matchList: { width: "100%", marginTop: 8, display: "flex", flexDirection: "column", gap: 10 },
  matchRow: {
    display: "flex", alignItems: "center", gap: 14,
    background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.1)",
    borderRadius: 16, padding: "12px 16px", textAlign: "left",
  },
  starRow: {
    background: "rgba(255,209,92,.12)", border: `1px solid ${COLORS.star}55`,
  },
  matchDot: {
    width: 48, height: 48, borderRadius: "50%", display: "flex",
    alignItems: "center", justifyContent: "center", fontSize: 22,
    fontWeight: 700, flexShrink: 0,
  },
  matchName: { fontSize: 20, fontWeight: 700 },
  starIcon: { fontSize: 16 },
  matchMeaning: {
    fontFamily: "system-ui, sans-serif", fontSize: 13, color: "rgba(255,255,255,.65)",
  },
  likeBadge: {
    fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 600,
    background: "rgba(255,255,255,.12)", padding: "5px 10px",
    borderRadius: 999, flexShrink: 0,
  },
};
