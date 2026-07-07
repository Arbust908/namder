#!/bin/sh
set -e

# Start PocketBase, pointing at the persistent volume + repo hooks/migrations.
# Migrations auto-apply on boot; hooks are loaded from /pb/pb_hooks.
/pb/pocketbase serve \
  --http=0.0.0.0:8090 \
  --dir=/pb_data \
  --hooksDir=/pb/pb_hooks \
  --migrationsDir=/pb/pb_migrations &
PB_PID=$!

# Start Next standalone server.
node server.js &
NEXT_PID=$!

# If either dies, take the container down so Dokploy restarts it.
wait -n "$PB_PID" "$NEXT_PID"
exit $?
