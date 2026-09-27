/** Cross-scene events on game.events (typed names; payloads documented per event). */
export const GameEvents = {
	/** payload: AchievementDef[] (newly unlocked, in order). */
	AchievementsUnlocked: 'achievements-unlocked',
	/** payload: VoiceLine (src/core/voice.ts), shown as a subtitle by the HUD. */
	Voice: 'voice',
} as const;
