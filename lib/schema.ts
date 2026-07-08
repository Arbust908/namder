// lib/schema.ts
// Drizzle ORM schema for Namder — PostgreSQL tables replacing PocketBase collections.
// The `matches` collection is gone; star status is computed via SQL JOIN.

import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ── users ──────────────────────────────────────────────────────────
// Replaces PocketBase's built-in `users` auth collection.
// Guests have guest_uuid set and is_guest = true (password_hash is null).
// Registered users have password_hash set and is_guest = false.
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").unique(),
    passwordHash: text("password_hash"),
    guestUuid: text("guest_uuid").unique(),
    display: text("display").notNull().default("Guest"),
    isGuest: boolean("is_guest").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
);

// ── names ──────────────────────────────────────────────────────────
// The shared deck of names (global, not per-room).
export const names = pgTable("names", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  gender: text("gender").notNull(), // 'girl' | 'boy'
  origin: text("origin"),
  meaning: text("meaning"),
  source: text("source"),
});

// ── rooms ──────────────────────────────────────────────────────────
// A swipe room / group.
export const rooms = pgTable(
  "rooms",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: text("code").notNull().unique(),
    gender: text("gender").notNull(), // 'girl' | 'boy' | 'either'
    status: text("status").notNull().default("lobby"), // 'lobby' | 'swiping' | 'done'
    ownerId: uuid("owner_id").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("idx_room_code").on(t.code)]
);

// ── members ────────────────────────────────────────────────────────
// Who's in a room + their done state.
export const members = pgTable(
  "members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    display: text("display").notNull(),
    done: boolean("done").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("idx_member_room_user").on(t.roomId, t.userId)]
);

// ── votes ──────────────────────────────────────────────────────────
// Each individual swipe decision.
export const votes = pgTable(
  "votes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    nameId: uuid("name_id")
      .notNull()
      .references(() => names.id, { onDelete: "cascade" }),
    liked: boolean("liked").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("idx_vote_unique").on(t.roomId, t.userId, t.nameId)]
);
