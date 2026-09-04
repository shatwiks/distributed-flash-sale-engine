#!/bin/sh
set -e

# ==============================================================================
# Container Entrypoint Script for Flash-Sale Ticket Booking API
# Handles pre-flight database schema migrations before starting the web server.
# ==============================================================================

echo "[Entrypoint] Verifying database connectivity & executing migrations..."
node src/db/migrate.js
echo "[Entrypoint] Database migrations completed successfully."

echo "[Entrypoint] Starting application process: $@"
exec "$@"
