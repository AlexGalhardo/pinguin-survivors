import { achPtBR } from './achievements.pt-BR';
import type { I18nKey } from './en';

export const ptBR: Record<I18nKey, string> = {
	...achPtBR,
	'game.title': 'Pinguin Survivors',
	'boot.loading': 'Carregando…',
	'hud.round': 'ROUND {n}',
	'fx.dodge': 'ESQUIVA',
	'fx.parry': 'APARO',
	'hud.hp': 'HP {hp}/{max}',
	'hud.kills': 'ABATES {n}',
	'hud.boss': 'URSO POLAR ZUMBI',
	'ach.unlocked': 'CONQUISTA DESBLOQUEADA',
	'ach.point': '+1 ponto de conquista',
	'hud.speed': '{n}x ▶▶',
	'hero.jack': 'Jack',
	'hero.bob': 'Bob',
	'hero.lucia': 'Lucia',
	'debug.stats': '{fps} FPS · chunks {chunks} · enemies {enemies} · x {x} y {y}',
};
