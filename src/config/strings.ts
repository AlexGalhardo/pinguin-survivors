import type { AbilityId } from '../data/abilities';
import type { SpecialCardId } from '../data/cards';
import type { Rarity } from '../data/rarity';
import type { StatKey } from '../logic/stats';

/** All player-facing text lives here (English only, see docs/decisions.md D-14). */
export const STRINGS = {
	gameTitle: 'STARFALL SURVIVORS',
	dodge: 'DODGE',
	youDied: 'YOU DIED',
	wave: 'WAVE',
	waveCleared: 'WAVE CLEARED',
	cleared: 'CLEARED',
	chooseUpgrade: 'CHOOSE AN UPGRADE',
	cardNew: 'NEW',
	level: 'LV',
	reroll: 'REROLL',
	gold: 'GOLD',
	revived: 'REVIVED!',
	pickHint: '1/2/3 OR ARROWS + ENTER',
	boss: 'BOSS',
} as const;

export const RARITY_NAMES: Record<Rarity, string> = {
	common: 'COMMON',
	rare: 'RARE',
	epic: 'EPIC',
	legendary: 'LEGENDARY',
};

/** Short stat labels (HUD, stat panels, card descriptions). */
export const STAT_LABELS: Record<StatKey, string> = {
	maxHp: 'MAX HP',
	maxHpPct: 'MAX HP',
	hpRegen: 'HP REGEN',
	lifesteal: 'LIFESTEAL',
	damage: 'DAMAGE',
	attackSpeed: 'ATTACK SPEED',
	critChance: 'CRIT CHANCE',
	critDamage: 'CRIT DAMAGE',
	abilityPower: 'ABILITY POWER',
	range: 'RANGE',
	moveSpeed: 'MOVE SPEED',
	armor: 'ARMOR',
	dodge: 'DODGE',
	pickupRange: 'PICKUP RANGE',
	luck: 'LUCK',
	projectiles: 'PROJECTILES',
	pierce: 'PIERCE',
};

/** Stat card titles by card id. */
export const STAT_CARD_NAMES: Record<string, string> = {
	max_hp: 'REINFORCED PLATING',
	hp_regen: 'NANO REPAIR',
	lifesteal: 'SIPHON CORE',
	damage: 'POWER CELL',
	attack_speed: 'RAPID CYCLER',
	crit_chance: 'TARGET LOCK',
	crit_damage: 'HOLLOW POINTS',
	ability_power: 'PSI FOCUS',
	range: 'LONG BARREL',
	move_speed: 'SERVO LEGS',
	armor: 'ARMOR PLATE',
	dodge: 'PHASE STEP',
	pickup_range: 'TRACTOR BEAM',
	luck: 'LUCKY STAR',
};

export const SPECIAL_CARD_TEXT: Record<SpecialCardId, { name: string; desc: string }> = {
	projectile: { name: 'SPLIT SHOT', desc: '+1 PROJECTILE' },
	pierce: { name: 'PIERCING ROUNDS', desc: '+1 PIERCE' },
	revive: { name: 'SECOND LIFE', desc: 'REVIVE ONCE WITH 50% HP' },
	full_heal: { name: 'FULL REPAIR', desc: 'RESTORE ALL HP' },
};

export const ABILITY_TEXT: Record<AbilityId, { name: string; desc: string }> = {
	orbital_drones: { name: 'ORBITAL DRONES', desc: 'DRONES ORBIT YOU AND HIT ON CONTACT' },
	chain_lightning: { name: 'CHAIN LIGHTNING', desc: 'LIGHTNING JUMPS BETWEEN ENEMIES' },
	plasma_nova: { name: 'PLASMA NOVA', desc: 'PERIODIC BLAST AROUND YOU' },
	cryo_field: { name: 'CRYO FIELD', desc: 'AURA THAT SLOWS AND CHILLS' },
	homing_missiles: { name: 'HOMING MISSILES', desc: 'MISSILES SEEK RANDOM TARGETS' },
	laser_beam: { name: 'LASER BEAM', desc: 'BEAM TOWARD THE DENSEST CROWD' },
};
