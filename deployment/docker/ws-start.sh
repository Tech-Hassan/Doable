#!/bin/sh
# WS container start: run the bundled realtime server (no tsx at runtime).
set -e
cd /app
exec node services/ws/src/bundle.mjs
