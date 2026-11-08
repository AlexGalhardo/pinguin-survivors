/** Cross-scene events on game.events (typed names; payloads documented per event). */
export const GameEvents = {
	/** payload: AchievementDef[] (newly unlocked, in order). */
	AchievementsUnlocked: 'achievements-unlocked',
} as const;
