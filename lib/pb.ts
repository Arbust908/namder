// lib/pb.ts
// One PocketBase client for the browser, one factory for server routes.
import PocketBase from "pocketbase";

// Browser: PB is exposed at /pb behind the same domain (see DEPLOY.md nginx).
// Server (Next API routes): talk to PB over localhost inside the container.
const BROWSER_URL =
  process.env.NEXT_PUBLIC_PB_URL ?? "/pb";
const SERVER_URL =
  process.env.PB_INTERNAL_URL ?? "http://127.0.0.1:8090";

// Singleton for client components.
let browserPb: PocketBase | null = null;
export function getBrowserPb(): PocketBase {
  if (!browserPb) browserPb = new PocketBase(BROWSER_URL);
  return browserPb;
}

// Fresh instance per request on the server (no shared auth state across users).
export function getServerPb(): PocketBase {
  return new PocketBase(SERVER_URL);
}
