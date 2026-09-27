import { achEn } from './achievements.en';

export const en = {
	...achEn,
	'game.title': 'Pinguin Survivors',
	'boot.loading': 'Loading…',
	'hud.round': 'ROUND {n}',
	'hud.fish': 'FISH {n}',
	'fx.levelUp': 'LEVEL UP!',
	'hud.level': 'LV {n}',
	'over.title': 'YOU DIED',
	'over.bossTimeout': 'THE BOSS OUTLASTED YOU',
	'over.round': 'Round {n}',
	'over.stats': '{kills} kills · {time} · {damage} damage',
	'over.rewards': '+{xp} XP · +{fish} fish · {levels} level ups',
	'over.retry': 'ENTER  retry',
	'over.newBest': 'NEW BEST!',
	'unlock.bob': 'BOB UNLOCKED!',
	'unlock.lucia': 'LUCIA UNLOCKED!',
	'fx.dodge': 'DODGE',
	'fx.parry': 'PARRY',
	'hud.hp': 'HP {hp}/{max}',
	'hud.kills': 'KILLS {n}',
	'hud.boss': 'ZOMBIE POLAR BEAR',
	'ach.unlocked': 'ACHIEVEMENT UNLOCKED',
	'ach.point': '+1 achievement point',
	'hud.speed': '{n}x ▶▶',
	'hero.jack': 'Jack',
	'hero.bob': 'Bob',
	'hero.lucia': 'Lucia',
	'debug.stats': '{fps} FPS · chunks {chunks} · enemies {enemies} · x {x} y {y}',
} as const;

export type I18nKey = keyof typeof en;
