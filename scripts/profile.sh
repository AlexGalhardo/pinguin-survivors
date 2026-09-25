#!/usr/bin/env bash
# CPU profile of the stress scenario (300 enemies + 500 shots): bash scripts/profile.sh [seconds]
# Needs `bun run dev` on :5173. Prints frame-time percentiles and the top self-time functions.
set -eu
SECS=${1:-8}
AB="bunx agent-browser@0.38.1"
export AGENT_BROWSER_SESSION=${AGENT_BROWSER_SESSION:-profile}
DIR=$(cd "$(dirname "$0")" && pwd)
OUT="${TMPDIR:-${TEMP:-/tmp}}/starfall-profile.json"
$AB set viewport 1920 1080 >/dev/null
$AB open "http://localhost:5173/?skipMenu=1&char=mage&wave=12&seed=1&god=1" >/dev/null
sleep 3
$AB eval "$(cat "$DIR/profile-stress.js")" >/dev/null
sleep 4
$AB profiler start >/dev/null
sleep "$SECS"
$AB profiler stop "$OUT" >/dev/null
$AB eval "(() => { const d = __FT__.slice(60).sort((a, b) => a - b); const q = (p) => +d[Math.floor(d.length * p)].toFixed(2); return JSON.stringify({ frames: d.length, p50: q(0.5), p95: q(0.95), p99: q(0.99) }); })()"
bun "$DIR/profile-agg.ts" "$OUT"
