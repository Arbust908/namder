// lib/db.ts
// Drizzle + pg client. Server-side only — used in API routes.
// Browser code uses lib/api-client.ts (fetch wrapper) instead.

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "@/node_modules/@types/pg";
import * as schema from "./schema";

const DATABASE_URL = process.env.DATABASE_URL!;

// pg Pool — reused across requests in the Node.js runtime.
const pool = new Pool({ connectionString: DATABASE_URL, max: 10 });

export const db = drizzle(pool, { schema });
