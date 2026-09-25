import type { AbilityId } from '../data/abilities';
import type { SpecialCardId } from '../data/cards';
import type { Rarity } from '../data/rarity';
import type { Tag } from '../data/synergies';
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
	evolved: 'EVOLVED',
	sell: 'SELL',
	lock: 'LOCK',
	locked: 'LOCKED',
	synergies: 'SYNERGIES',
	shop: 'SHOP',
	continue: 'CONTINUE',
	sold: 'SOLD',
	shopHint: '1-4 BUY  L LOCK  R REROLL  CLICK OWNED: SELL',
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
	arc_turret: { name: 'ARC TURRET', desc: 'DEPLOYS TURRETS THAT SHOOT NEARBY FOES' },
	saw_disc: { name: 'SAW DISC', desc: 'SPINNING DISCS CUT THROUGH EVERYTHING' },
	gravity_well: { name: 'GRAVITY WELL', desc: 'VORTEX THAT PULLS AND CRUSHES FOES' },
	nanite_swarm: { name: 'NANITE SWARM', desc: 'NANITES EAT ENEMIES OVER TIME' },
};

/** Names of the evolved abilities. */
export const EVOLVED_NAMES: Record<AbilityId, string> = {
	orbital_drones: 'DRONE STORM',
	chain_lightning: 'THUNDER GRID',
	plasma_nova: 'SUPERNOVA',
	cryo_field: 'ABSOLUTE ZERO',
	homing_missiles: 'SWARM BARRAGE',
	laser_beam: 'DEATH RAY',
	arc_turret: 'TESLA FORTRESS',
	saw_disc: 'BUZZ STORM',
	gravity_well: 'BLACK HOLE',
	nanite_swarm: 'GREY GOO',
};

export const MODIFIER_NAMES = { swarm: 'SWARM', armored: 'ARMORED', fast: 'FAST' } as const;

export const TAG_NAMES: Record<Tag, string> = {
	energy: 'ENERGY',
	kinetic: 'KINETIC',
	cryo: 'CRYO',
	psi: 'PSI',
	bio: 'BIO',
	tech: 'TECH',
};

/** Compact stat labels for narrow panels (shop cards, stats panel). */
export const STAT_SHORT: Record<StatKey, string> = {
	maxHp: 'MAX HP',
	maxHpPct: 'MAX HP',
	hpRegen: 'REGEN',
	lifesteal: 'LIFESTEAL',
	damage: 'DAMAGE',
	attackSpeed: 'ATK SPD',
	critChance: 'CRIT',
	critDamage: 'CRIT DMG',
	abilityPower: 'ABILITY',
	range: 'RANGE',
	moveSpeed: 'SPEED',
	armor: 'ARMOR',
	dodge: 'DODGE',
	pickupRange: 'PICKUP',
	luck: 'LUCK',
	projectiles: 'PROJ',
	pierce: 'PIERCE',
};

export const MENU = {
	play: 'PLAY',
	settings: 'SETTINGS',
	back: 'BACK',
	resume: 'RESUME',
	quitRun: 'QUIT RUN',
	quitConfirm: 'QUIT THIS RUN?',
	yes: 'YES',
	no: 'NO',
	paused: 'PAUSED',
	chooseClass: 'CHOOSE YOUR SURVIVOR',
	start: 'START',
	retry: 'RETRY',
	mainMenu: 'MAIN MENU',
	newBest: 'NEW BEST!',
	best: 'BEST',
	subtitle: 'SURVIVE THE ENDLESS SWARM',
	menuHint: 'ARROWS/WASD + ENTER',
	selectHint: '1/2/3 OR ARROWS + ENTER   ESC BACK',
	sfxVolume: 'SFX VOLUME',
	musicVolume: 'MUSIC VOLUME',
	fullscreen: 'FULLSCREEN',
	screenShake: 'SCREEN SHAKE',
	damageNumbers: 'DAMAGE NUMBERS',
	on: 'ON',
	off: 'OFF',
	waveReached: 'WAVE',
	time: 'TIME',
	kills: 'KILLS',
	damage: 'DAMAGE',
	goldTotal: 'GOLD',
	build: 'BUILD',
	unlocked: 'NEW SURVIVOR!',
	continueLabel: 'CONTINUE',
	records: 'RECORDS',
	runs: 'RUNS',
	bosses: 'BOSSES KILLED',
	lastRuns: 'LAST RUNS',
	noRuns: 'NO RUNS YET',
	locked: 'LOCKED',
	passive: 'PASSIVE',
} as const;

/** How to unlock each class (character select). */
export const UNLOCK_TEXT: Record<'warrior' | 'ranger' | 'mage', string> = {
	warrior: '',
	ranger: 'REACH WAVE 10 WITH THE WARRIOR',
	mage: 'KILL A BOSS',
};

export const PASSIVE_TEXT: Record<'warrior' | 'ranger' | 'mage', string> = {
	warrior: '+1 ARMOR PER NEARBY ENEMY (MAX 5)',
	ranger: '+20% ATK SPEED WHILE MOVING',
	mage: '+1% ABILITY PER KILL IN THE WAVE',
};

export const CHARACTER_TEXT: Record<'warrior' | 'ranger' | 'mage', { name: string; desc: string }> =
	{
		warrior: { name: 'WARRIOR', desc: 'HEAVY ARMOR, ENERGY BLADE. TOUGH BUT SHORT RANGE.' },
		ranger: { name: 'RANGER', desc: 'AGILE SCOUT WITH A RAPID BLASTER.' },
		mage: { name: 'MAGE', desc: 'PSIONIC. +50% ABILITY POWER, FRAGILE.' },
	};

export const WEAPON_NAMES: Record<'energy_blade' | 'blaster' | 'psi_orb', string> = {
	energy_blade: 'ENERGY BLADE',
	blaster: 'BLASTER',
	psi_orb: 'PSI ORB',
};
