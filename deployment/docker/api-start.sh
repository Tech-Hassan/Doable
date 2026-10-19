#!/bin/sh
# API container start: run migrations, then exec the bundled API server.
# Migrations write to a file (printed afterwards) so a lingering tsx/esbuild
# child holding the container stdout pipe can never wedge the chain.
set -e
cd /app
npx tsx services/api/src/db/migrate.ts > /tmp/migrate.log 2>&1 || true
cat /tmp/migrate.log
exec node services/api/src/bundle.mjs
