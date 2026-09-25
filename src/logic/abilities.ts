import { ABILITY_DATA, MAX_ABILITY_LEVEL } from '../data/abilities';

interface Growth {
	base: number;
	perLevel: number;
}

/** Value of a growing stat at a level (1..5). */
export function atLevel(g: Growth, level: number): number {
	const l = Math.min(MAX_ABILITY_LEVEL, Math.max(1, level));
	return g.base + g.perLevel * (l - 1);
}

export function dronesAt(level: number) {
	const d = ABILITY_DATA.orbital_drones;
	return { count: atLevel(d.count, level), damage: atLevel(d.damage, level) };
}

export function chainAt(level: number) {
	const d = ABILITY_DATA.chain_lightning;
	return {
		damage: atLevel(d.damage, level),
		jumps: atLevel(d.jumps, level),
		cooldown: atLevel(d.cooldown, level),
	};
}

export function novaAt(level: number) {
	const d = ABILITY_DATA.plasma_nova;
	return {
		damage: atLevel(d.damage, level),
		radius: atLevel(d.radius, level),
		cooldown: atLevel(d.cooldown, level),
	};
}

export function cryoAt(level: number) {
	const d = ABILITY_DATA.cryo_field;
	return {
		dps: atLevel(d.dps, level),
		radius: atLevel(d.radius, level),
		slow: atLevel(d.slow, level),
	};
}

export function missilesAt(level: number) {
	const d = ABILITY_DATA.homing_missiles;
	return { count: atLevel(d.count, level), damage: atLevel(d.damage, level) };
}

export function laserAt(level: number) {
	const d = ABILITY_DATA.laser_beam;
	return {
		damage: atLevel(d.damage, level),
		duration: atLevel(d.duration, level),
		width: atLevel(d.width, level),
	};
}

/** Squared distance from point P to segment AB (used by the laser). */
export function distToSegmentSq(
	px: number,
	py: number,
	ax: number,
	ay: number,
	bx: number,
	by: number,
): number {
	const abx = bx - ax;
	const aby = by - ay;
	const len2 = abx * abx + aby * aby;
	let t = len2 > 0 ? ((px - ax) * abx + (py - ay) * aby) / len2 : 0;
	t = Math.max(0, Math.min(1, t));
	const dx = ax + abx * t - px;
	const dy = ay + aby * t - py;
	return dx * dx + dy * dy;
}

export function turretAt(level: number) {
	const d = ABILITY_DATA.arc_turret;
	return { damage: atLevel(d.damage, level), turrets: Math.floor(atLevel(d.turrets, level)) };
}

export function sawAt(level: number) {
	const d = ABILITY_DATA.saw_disc;
	return { damage: atLevel(d.damage, level), count: Math.floor(atLevel(d.count, level)) };
}

export function gravityAt(level: number) {
	const d = ABILITY_DATA.gravity_well;
	return { damage: atLevel(d.damage, level), radius: atLevel(d.radius, level) };
}

export function nanitesAt(level: number) {
	const d = ABILITY_DATA.nanite_swarm;
	return { dps: atLevel(d.dps, level), targets: Math.floor(atLevel(d.targets, level)) };
}
