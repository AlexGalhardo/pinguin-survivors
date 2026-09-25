#!/usr/bin/env bash
# Automated playtest with agent-browser: bash scripts/playtest.sh <class> [seed] [targetWave] [speed]
# Needs `bun run dev` on :5173. Prints one JSON line per wave and the final result.
set -u
CLASS=${1:-warrior}; SEED=${2:-1}; TARGET=${3:-30}; SPEED=${4:-4}
AB="bunx agent-browser@0.38.1"
export AGENT_BROWSER_SESSION=${AGENT_BROWSER_SESSION:-playtest-$CLASS}
DIR=$(cd "$(dirname "$0")" && pwd)
$AB set viewport 1366 768 >/dev/null
$AB open "http://localhost:5173/?skipMenu=1&char=$CLASS&seed=$SEED&speed=$SPEED&unlockAll=1" >/dev/null
sleep 2
$AB eval "window.__botTarget = $TARGET; 1" >/dev/null
$AB eval "$(cat "$DIR/playtest-bot.js")" >/dev/null
for _ in $(seq 1 400); do
	sleep 5
	DONE=$($AB eval "window.__bot && window.__bot.done")
	[ "$DONE" = "true" ] && break
done
$AB eval "JSON.stringify({result: __bot.result, errors: __bot.errors, log: __bot.log})"
