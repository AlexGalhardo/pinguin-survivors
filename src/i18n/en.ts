import { achEn } from './achievements.en';

export const en = {
	...achEn,
	'game.title': 'Pinguin Survivors',
	'boot.loading': 'Loading…',
	'hud.round': 'ROUND {n}',
	'hud.speed': '{n}x ▶▶',
	'hero.jack': 'Jack',
	'hero.bob': 'Bob',
	'hero.lucia': 'Lucia',
	'debug.stats': '{fps} FPS · chunks {chunks} · x {x} y {y}',
} as const;

export type I18nKey = keyof typeof en;
