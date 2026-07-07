// pb_migrations/1700000000_init.js
// Creates the Namder collections. Auto-applied on PocketBase boot.
// NOTE: the migration API (Collection shape, field types) is version-specific.
// This targets the 0.22.x JSVM migration style. If you pin a different PB
// version, regenerate by building the collections in the admin UI and exporting,
// or adjust field definitions to match that version's schema format.

migrate(
  (app) => {
    // ---- names (the deck) ----
    const names = new Collection({
      type: "base",
      name: "names",
      fields: [
        { name: "name", type: "text", required: true },
        { name: "gender", type: "select", required: true,
          maxSelect: 1, values: ["girl", "boy"] },
        { name: "origin", type: "text" },
        { name: "meaning", type: "text" },
        { name: "source", type: "text" },
      ],
      // public read (deck is shared); writes via admin/seed only
      listRule: "",
      viewRule: "",
    });
    app.save(names);

    // ---- rooms ----
    const rooms = new Collection({
      type: "base",
      name: "rooms",
      fields: [
        { name: "code", type: "text", required: true },
        { name: "gender", type: "select", required: true,
          maxSelect: 1, values: ["girl", "boy", "either"] },
        { name: "status", type: "select", required: true,
          maxSelect: 1, values: ["lobby", "swiping", "done"] },
        { name: "owner", type: "relation", required: false,
          maxSelect: 1, collectionId: "_pb_users_auth_" },
      ],
      indexes: ["CREATE UNIQUE INDEX idx_room_code ON rooms (code)"],
      // anyone authed can look up a room (they need the code to find it)
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "owner = @request.auth.id",
    });
    app.save(rooms);

    // ---- members ----
    const members = new Collection({
      type: "base",
      name: "members",
      fields: [
        { name: "room", type: "relation", required: true,
          maxSelect: 1, collectionId: rooms.id, cascadeDelete: true },
        { name: "user", type: "relation", required: true,
          maxSelect: 1, collectionId: "_pb_users_auth_" },
        { name: "display", type: "text", required: true },
        { name: "done", type: "bool" },
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_member_room_user ON members (room, user)",
      ],
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      // you can only add yourself
      createRule: "@request.auth.id != '' && user = @request.auth.id",
      updateRule: "user = @request.auth.id",
      deleteRule: "user = @request.auth.id",
    });
    app.save(members);

    // ---- votes ----
    const votes = new Collection({
      type: "base",
      name: "votes",
      fields: [
        { name: "room", type: "relation", required: true,
          maxSelect: 1, collectionId: rooms.id, cascadeDelete: true },
        { name: "user", type: "relation", required: true,
          maxSelect: 1, collectionId: "_pb_users_auth_" },
        { name: "name", type: "relation", required: true,
          maxSelect: 1, collectionId: names.id },
        { name: "liked", type: "bool" },
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_vote_unique ON votes (room, user, name)",
      ],
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      // only cast/change your own votes
      createRule: "@request.auth.id != '' && user = @request.auth.id",
      updateRule: "user = @request.auth.id",
    });
    app.save(votes);

    // ---- matches (hook-owned, read-only to clients) ----
    const matches = new Collection({
      type: "base",
      name: "matches",
      fields: [
        { name: "room", type: "relation", required: true,
          maxSelect: 1, collectionId: rooms.id, cascadeDelete: true },
        { name: "name", type: "relation", required: true,
          maxSelect: 1, collectionId: names.id },
        { name: "like_count", type: "number" },
        { name: "is_star", type: "bool" },
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_match_room_name ON matches (room, name)",
      ],
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      // no create/update/delete rules -> clients can't write; hook uses admin ctx
      createRule: null,
      updateRule: null,
      deleteRule: null,
    });
    app.save(matches);
  },

  (app) => {
    // ---- down: drop in reverse dependency order ----
    for (const n of ["matches", "votes", "members", "rooms", "names"]) {
      try {
        const c = app.findCollectionByNameOrId(n);
        app.delete(c);
      } catch (_) {}
    }
  }
);
