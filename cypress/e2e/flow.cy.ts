// cypress/e2e/flow.cy.ts
// End-to-end coverage for the entry flow we wired:
//   Landing → Welcome → Profile → GroupView (lobby) → SwipeDeck → Results → GroupView
//
// All /api/* calls are stubbed with cy.intercept, so these specs run without a
// database. The Next dev server only has to serve the pages.

const ROOM = {
  id: "room-1",
  code: "TEST42",
  gender: "either",
  status: "lobby",
  ownerId: "u1",
} as const;

const NAMES = [
  { id: "n1", name: "Valentina", gender: "girl", origin: "Latin", meaning: "Fuerte, sana" },
  { id: "n2", name: "Mateo", gender: "boy", origin: "Hebrew", meaning: "Regalo de Dios" },
];

const MEMBER = {
  id: "m1",
  roomId: "room-1",
  userId: "u1",
  display: "Fran",
  done: false,
};

const RESULTS = [
  { nameId: "n1", name: "Valentina", gender: "girl", meaning: "Fuerte, sana", myVote: true, likeCount: 1, memberCount: 1, isStar: true },
  { nameId: "n2", name: "Mateo", gender: "boy", meaning: "Regalo de Dios", myVote: true, likeCount: 0, memberCount: 1, isStar: false },
];

describe("Entry flow", () => {
  beforeEach(() => {
    // Start each test anonymous.
    cy.clearLocalStorage();

    // ── Auth ──
    cy.intercept("POST", "/api/auth/guest", {
      token: "guest-token",
      profile: { id: "u1", display: "Fran", isGuest: true },
    }).as("guest");

    cy.intercept("POST", "/api/auth/register", {
      token: "reg-token",
      profile: { id: "u2", display: "Fran", isGuest: false, email: "fran@example.com" },
    }).as("register");

    // ── Room create / lookup / join ──
    cy.intercept("POST", "/api/rooms", ROOM).as("createRoom");
    cy.intercept("GET", /\/api\/rooms\?code=/, ROOM).as("findRoom");
    cy.intercept("GET", "/api/rooms?mine=true", []).as("myRooms");
    cy.intercept("POST", /\/api\/rooms\/[^/]+\/join/, MEMBER).as("join");

    // ── Members polling ──
    cy.intercept("GET", /\/api\/rooms\/[^/]+\/members/, [MEMBER]).as("members");

    // ── Deck ──
    cy.intercept("GET", "/api/names", NAMES).as("names");
    cy.intercept("GET", /\/api\/votes\?roomId=/, []).as("myVotes");

    // ── Voting ──
    cy.intercept("POST", "/api/votes", (req) => {
      req.reply({
        id: `v-${Date.now()}`,
        roomId: "room-1",
        nameId: req.body.nameId,
        liked: req.body.liked,
      });
    }).as("vote");

    // markDone after a round completes
    cy.intercept("PATCH", /\/api\/members\/[^/]+/, { ...MEMBER, done: true }).as("markDone");

    // ── Results ──
    cy.intercept("GET", /\/api\/rooms\/[^/]+\/results/, RESULTS).as("results");

    // ── External QR image: stub so the suite never hits the network ──
    cy.intercept("GET", "https://api.qrserver.com/**", { statusCode: 200, body: "" });
  });

  it("guest path: Landing → Welcome → Profile → GroupView → SwipeDeck → Results → GroupView", () => {
    cy.visit("/");
    cy.contains("button", "Empezar gratis").click();
    cy.url().should("include", "/welcome");

    // Welcome gate — guest with a name
    cy.contains("¿Cómo querés empezar?");
    cy.get('input[placeholder*="Tu nombre"]').type("Fran");
    cy.contains("button", "Continuar como invitado").click();
    cy.wait("@guest");
    cy.url().should("include", "/profile");

    // Profile — kick off a new group
    cy.contains("Mi perfil");
    cy.contains("button", "Iniciar grupo nuevo").click();
    cy.wait("@createRoom");
    cy.url().should("include", "/room/TEST42");

    // GroupView lobby — code visible + a CTA into the deck
    cy.contains("Mi grupo");
    cy.contains("TEST42");
    cy.contains("button", "Empezar").click();

    // SwipeDeck — vote through the 2-card deck
    cy.get('button[aria-label="Like"]').should("be.visible");
    cy.get('button[aria-label="Like"]').click();
    cy.get('button[aria-label="Like"]').click();
    cy.wait("@results");

    // RoundResultsTable
    cy.contains("Ronda completa");
    cy.contains("button", "Continuar").click();

    // Back to the lobby — deck exhausted, so the start-swiping CTA is gone
    cy.contains("Mi grupo");
    cy.contains("button", "Empezar").should("not.exist");
  });

  it("register path: Welcome → register form → Profile → GroupView", () => {
    cy.visit("/welcome");
    cy.contains("button", "Regístrate").click();
    cy.contains("Creá tu cuenta");

    cy.get('input[placeholder="Tu nombre"]').type("Fran");
    cy.get('input[type="email"]').type("fran@example.com");
    cy.get('input[type="password"]').type("supersecret");
    cy.contains("button", "Crear cuenta").click();

    cy.wait("@register");
    cy.url().should("include", "/profile");
    cy.contains("button", "Iniciar grupo nuevo").click();
    cy.wait("@createRoom");
    cy.url().should("include", "/room/TEST42");
    cy.contains("Mi grupo");
  });
});
