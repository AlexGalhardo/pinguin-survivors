/** Feel of crits, dodges and parries (numbers only; colors live in `config/palette.ts`). */
export const COMBAT_FX = {
	/** Critical hit: number size (px), pop scale at birth and how long the pop and the shake last. */
	crit: {
		fontSize: 22,
		stroke: 4,
		popScale: 1.9,
		popTime: 0.18,
		shake: 2.5,
		shakeTime: 0.25,
		sparks: 8,
	},
	/** Dodge: afterimages of the hero left behind (count, spacing in px, life in seconds, start alpha). */
	dodge: { ghosts: 3, spacing: 30, life: 0.4, alpha: 0.6 },
	/** Parry: metal sparks at the hero, and the seconds the reflected damage number takes to fly. */
	parry: { sparks: 24, flash: 46, travel: 0.25 },
	/** Item drops: pulse (seconds per cycle), beam height (px) and the edge arrow margin (px). */
	drop: { pulse: 1.1, beam: 70, arrowMargin: 36, arrowSize: 30 },
} as const;
