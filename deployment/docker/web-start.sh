#!/bin/sh
# Web container start: link the static assets into the standalone tree, then
# run the runtime entrypoint (rewrites NEXT_PUBLIC_* placeholders) which
# execs the Next.js standalone server.
set -e
cd /app
mkdir -p /app/apps/web/.next/standalone/apps/web/.next
ln -sfn /app/apps/web/.next/static /app/apps/web/.next/standalone/apps/web/.next/static
exec sh /app/deployment/docker/web-runtime-entrypoint.sh node /app/apps/web/.next/standalone/apps/web/server.js
