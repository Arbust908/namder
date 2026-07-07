// pb_migrations/1700000000_init.js
// Auto-applies the Namder schema on PocketBase boot.
// The schema itself lives in schema.js (and pb_schema.json for reference).
const collections = require("./schema.js");

migrate(
  (app) => {
    // PocketBase v0.22+: use app.save() per collection instead of importCollections
    for (const plain of collections) {
      const collection = new Collection(plain);
      app.save(collection);
    }
  },
  (app) => {
    // Down: drop in reverse dependency order.
    for (const name of ["matches", "votes", "members", "rooms", "names"]) {
      try {
        const c = app.findCollectionByNameOrId(name);
        app.delete(c);
      } catch (_) {}
    }
  }
);
