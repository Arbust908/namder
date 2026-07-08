// pb_migrations/1700000000_init.js
// Auto-applies the Namder schema on PocketBase boot.
// Schema is inlined here because goja's require() has spotty module.exports support.
// If you edit schema.json, copy the changes here too.

const collections = [
  {
    id: "n7d3bbqm0bt87nm",
    name: "names",
    type: "base",
    schema: [
      { id: "nm1a2b3c", name: "name", type: "text", required: true, options: {} },
      { id: "nm4d5e6f", name: "gender", type: "select", required: true, options: { maxSelect: 1, values: ["girl", "boy"] } },
      { id: "nm7g8h9i", name: "origin", type: "text", options: {} },
      { id: "nm0j1k2l", name: "meaning", type: "text", options: {} },
      { id: "nm3m4n5o", name: "source", type: "text", options: {} },
    ],
    indexes: [],
    listRule: "",
    viewRule: "",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    options: {},
  },
  {
    id: "r9d1bbqm0bt87rm",
    name: "rooms",
    type: "base",
    schema: [
      { id: "rm1a2b3c", name: "code", type: "text", required: true, options: {} },
      { id: "rm4d5e6f", name: "gender", type: "select", required: true, options: { maxSelect: 1, values: ["girl", "boy", "either"] } },
      { id: "rm7g8h9i", name: "status", type: "select", required: true, options: { maxSelect: 1, values: ["lobby", "swiping", "done"] } },
      { id: "rm0j1k2l", name: "owner", type: "relation", required: false, options: { collectionId: "_pb_users_auth_", maxSelect: 1 } },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_room_code ON rooms (code)"],
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "owner = @request.auth.id",
    deleteRule: null,
    options: {},
  },
  {
    id: "m5e2bbqm0bt87mb",
    name: "members",
    type: "base",
    schema: [
      { id: "mb1a2b3c", name: "room", type: "relation", required: true, options: { collectionId: "r9d1bbqm0bt87rm", cascadeDelete: true, maxSelect: 1 } },
      { id: "mb4d5e6f", name: "user", type: "relation", required: true, options: { collectionId: "_pb_users_auth_", maxSelect: 1 } },
      { id: "mb7g8h9i", name: "display", type: "text", required: true, options: {} },
      { id: "mb0j1k2l", name: "done", type: "bool" },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_member_room_user ON members (room, user)"],
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != '' && user = @request.auth.id",
    updateRule: "user = @request.auth.id",
    deleteRule: "user = @request.auth.id",
    options: {},
  },
  {
    id: "v4f6bbqm0bt87vt",
    name: "votes",
    type: "base",
    schema: [
      { id: "vt1a2b3c", name: "room", type: "relation", required: true, options: { collectionId: "r9d1bbqm0bt87rm", cascadeDelete: true, maxSelect: 1 } },
      { id: "vt4d5e6f", name: "user", type: "relation", required: true, options: { collectionId: "_pb_users_auth_", maxSelect: 1 } },
      { id: "vt7g8h9i", name: "name", type: "relation", required: true, options: { collectionId: "n7d3bbqm0bt87nm", maxSelect: 1 } },
      { id: "vt0j1k2l", name: "liked", type: "bool" },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_vote_unique ON votes (room, user, name)"],
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != '' && user = @request.auth.id",
    updateRule: "user = @request.auth.id",
    deleteRule: null,
    options: {},
  },
  {
    id: "c8g4bbqm0bt87mc",
    name: "matches",
    type: "base",
    schema: [
      { id: "mc1a2b3c", name: "room", type: "relation", required: true, options: { collectionId: "r9d1bbqm0bt87rm", cascadeDelete: true, maxSelect: 1 } },
      { id: "mc4d5e6f", name: "name", type: "relation", required: true, options: { collectionId: "n7d3bbqm0bt87nm", maxSelect: 1 } },
      { id: "mc7g8h9i", name: "like_count", type: "number" },
      { id: "mc0j1k2l", name: "is_star", type: "bool" },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_match_room_name ON matches (room, name)"],
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    options: {},
  },
];

migrate(
  (db) => {
    const dao = new Dao(db);
    for (const plain of collections) {
      const collection = new Collection(plain);
      dao.saveCollection(collection);
    }
  },
  (db) => {
    const dao = new Dao(db);
    for (const name of ["matches", "votes", "members", "rooms", "names"]) {
      try {
        const c = dao.findCollectionByNameOrId(name);
        dao.deleteCollection(c);
      } catch (_) {}
    }
  }
);
