# ── Build Next ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build            # produces .next (standalone output)

# ── Next.js standalone runtime ─────────────────────────────────────
FROM node:20-alpine AS next
WORKDIR /app

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
# Drizzle migrations — needed for runtime migration on boot
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/migrate.mjs ./

EXPOSE 3000
CMD ["sh", "-c", "node migrate.mjs && node server.js"]
