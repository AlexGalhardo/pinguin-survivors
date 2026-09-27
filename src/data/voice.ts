/** Hero voice lines (docs/audio.md): events, cooldowns and variants. Times in seconds. */
export const VO_EVENTS = [
	'runStart',
	'levelUp',
	'lowHp',
	'potion',
	'boss',
	'super',
	'death',
] as const;
export type VoEvent = (typeof VO_EVENTS)[number];

export const VOICE = {
	/** Line variants per hero/event (vo.<hero>.<event>.<lang>.<n>, n = 1…variants). */
	variants: 2,
	/** Minimum gap between any two lines, so barks never overlap. */
	globalGap: 2.5,
	cooldown: {
		runStart: 0,
		levelUp: 20,
		lowHp: 25,
		potion: 12,
		boss: 0,
		super: 8,
		death: 0,
	} satisfies Record<VoEvent, number>,
	/** Events that ignore the global gap (story beats). */
	priority: ['runStart', 'boss', 'death'] satisfies VoEvent[],
	/** lowHp fires when HP drops below `lowHp` and re-arms once it is back above `lowHpReset`. */
	lowHp: 0.25,
	lowHpReset: 0.5,
	subtitleSeconds: 2.6,
} as const;
