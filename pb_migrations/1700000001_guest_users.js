// pb_migrations/1700000001_guest_users.js
// Extend the default `users` auth collection so device-generated guests work:
//   - guest_uuid : the durable device identity (unique)
//   - display    : name shown on members/results
//   - is_guest   : flag to distinguish throwaway guests from real signups
// Also opens createRule so a device can self-register its guest record, and
// sets identity auth on email (the synthetic guest email).
//
// VERSION NOTE: targets PocketBase 0.22.x JSVM migration API. If you bump the
// pinned PB version, re-verify field/collection shapes against that release.

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");

    // --- add custom fields (guard against re-run) ---
    if (!users.fields.getByName("guest_uuid")) {
      users.fields.add(
        new Field({
          name: "guest_uuid",
          type: "text",
          required: false,
          // unique enforced via index below
        })
      );
    }
    if (!users.fields.getByName("display")) {
      users.fields.add(
        new Field({ name: "display", type: "text", required: false })
      );
    }
    if (!users.fields.getByName("is_guest")) {
      users.fields.add(
        new Field({ name: "is_guest", type: "bool", required: false })
      );
    }

    // unique index on guest_uuid (partial: only where set, so real users with
    // empty guest_uuid don't collide). SQLite partial-index syntax:
    users.indexes = [
      ...(users.indexes || []),
      'CREATE UNIQUE INDEX idx_users_guest_uuid ON users (guest_uuid) WHERE guest_uuid != ""',
    ];

    // --- access rules ---
    // Allow open self-registration for BOTH flows:
    //   - guests:     is_guest = true  (synthetic email, random secret)
    //   - registered: is_guest = false (real email the person chose)
    // Anyone can create a users record either way; there's no invite-only
    // gate here. Add email domain restrictions or a captcha at the proxy if
    // that ever becomes necessary.
    users.createRule = "";
    // A user can view/update only their own record. This same rule is what
    // allows upgradeGuestToRegistered() to update email+password in place —
    // it's still "my own record", just switching is_guest to false.
    users.viewRule = "id = @request.auth.id";
    users.updateRule = "id = @request.auth.id";
    users.listRule = "id = @request.auth.id";

    app.save(users);
  },

  (app) => {
    // down: remove the added fields + index + rules
    const users = app.findCollectionByNameOrId("users");
    users.indexes = (users.indexes || []).filter(
      (ix) => !ix.includes("idx_users_guest_uuid")
    );
    ["guest_uuid", "display", "is_guest"].forEach((f) => {
      const field = users.fields.getByName(f);
      if (field) users.fields.removeByName(f);
    });
    users.createRule = null;
    app.save(users);
  }
);
