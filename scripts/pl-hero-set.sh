#!/usr/bin/env bash
# Full animation set of one hero tier, sequential (PixelLab has few concurrent job slots).
# Usage: bash scripts/pl-hero-set.sh <key> <characterId> "<attack action>" [super action]
# Budget rule P-54: templates (1 gen/direction) + v3 12-frame attack; super only facing south.
set -euo pipefail
KEY=$1
CHAR=$2
ATTACK=${3:-}
SUPER=${4:-}
run() { bun scripts/pl-animate.ts --key "$KEY" --char "$CHAR" "$@"; }
run --anim idle --template breathing-idle
run --anim walk8 --template walking-8-frames
run --anim hurt --template taking-punch
run --anim death --template falling-back-death
if [ -n "$ATTACK" ]; then run --anim attack --frames 12 --action "$ATTACK"; else run --anim attack --template attack; fi
if [ -n "$SUPER" ]; then run --anim super --frames 12 --dirs south --action "$SUPER"; fi
bun scripts/pack-heroes.ts "$KEY"
echo "SET-DONE $KEY"
