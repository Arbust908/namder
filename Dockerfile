# ── Build Next ────────────────────────────────────────────────────────────
FROM node:20-alpine AS web
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build            # produces .next (standalone output recommended)

# ── Runtime: Next standalone + PocketBase binary ────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app

# --- PocketBase (PIN this version; hook API is version-sensitive) ---
ARG PB_VERSION=0.22.21
RUN apk add --no-cache unzip wget ca-certificates \
 && wget -q https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip \
 && unzip pocketbase_${PB_VERSION}_linux_amd64.zip -d /pb \
 && rm pocketbase_${PB_VERSION}_linux_amd64.zip

# --- Next standalone output ---
# next.config.js must set: output: "standalone"
COPY --from=web /app/.next/standalone ./
COPY --from=web /app/.next/static ./.next/static
COPY --from=web /app/public ./public

# --- PocketBase hooks + migrations live in the repo, copied in ---
COPY pb_hooks /pb/pb_hooks
COPY pb_migrations /pb/pb_migrations

# /pb_data is the ONLY stateful path -> mount a volume here in Dokploy
VOLUME /pb_data

COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 3000 8090
CMD ["/start.sh"]
