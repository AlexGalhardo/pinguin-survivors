import { PALETTE as P } from '../../config/palette';
import { PixelCanvas } from './pixel-canvas';

/**
 * 16x16 icons drawn by code (key: icon.<id>). Ids: stat keys, ability ids,
 * special card ids, item ids and a few UI symbols.
 */
type Draw = (c: PixelCanvas) => void;

const O = P.void;

function heart(c: PixelCanvas, color: number): void {
	c.pattern(
		2,
		3,
		[
			'.##...##.',
			'####.####',
			'#########',
			'#########',
			'.#######.',
			'..#####..',
			'...###...',
			'....#....',
		].map((r) => r.replaceAll('#', 'a')),
		{ a: color },
	);
	c.px(4, 4, P.white);
}

function bolt(c: PixelCanvas, color: number): void {
	c.pattern(
		4,
		1,
		['....aa', '...aa.', '..aa..', '.aaaa.', '..aa..', '.aa...', 'aa....', 'a.....'],
		{
			a: color,
		},
	);
	c.pattern(4, 9, ['.aa...', 'aa....', 'a.....'], { a: color });
}

function sword(c: PixelCanvas, color: number): void {
	c.line(3, 12, 12, 3, color);
	c.line(4, 12, 12, 4, P.white);
	c.line(2, 10, 5, 13, P.amber);
	c.px(2, 13, P.brown);
}

function circleIcon(c: PixelCanvas, fill: number, inner: number): void {
	c.circle(8, 8, 6, fill);
	c.circle(8, 8, 3, inner);
}

export const ICONS: Record<string, Draw> = {
	// Stats
	maxHp: (c) => heart(c, P.red),
	hpRegen: (c) => {
		heart(c, P.green);
		c.rect(7, 5, 2, 6, P.white);
		c.rect(5, 7, 6, 2, P.white);
	},
	lifesteal: (c) => {
		c.pattern(5, 2, ['..a..', '..a..', '.aaa.', '.aaa.', 'aaaaa', 'aaaaa', 'aaaaa', '.aaa.'], {
			a: P.crimson,
		});
		c.px(6, 8, P.salmon);
	},
	damage: (c) => sword(c, P.silver),
	attackSpeed: (c) => bolt(c, P.yellow),
	critChance: (c) => {
		c.ring(8, 8, 7, 1, P.red);
		c.ring(8, 8, 4, 1, P.red);
		c.rect(7, 1, 2, 14, P.red);
		c.rect(1, 7, 14, 2, P.red);
		c.rect(7, 7, 2, 2, P.yellow);
	},
	critDamage: (c) => {
		c.pattern(
			1,
			1,
			[
				'..a..a..a..',
				'...aaaaa...',
				'..aayyyaa..',
				'aaayyyyyaaa',
				'..aayyyaa..',
				'...aaaaa...',
				'..a..a..a..',
			].map((r) => `${r}`),
			{
				a: P.orange,
				y: P.yellow,
			},
		);
	},
	abilityPower: (c) => {
		c.circle(8, 8, 6, P.plum);
		c.circle(8, 8, 4, P.orchid);
		c.circle(7, 7, 1.5, P.white);
	},
	range: (c) => {
		c.line(2, 8, 13, 8, P.cyan);
		c.line(10, 5, 13, 8, P.cyan);
		c.line(10, 11, 13, 8, P.cyan);
		c.rect(2, 6, 2, 5, P.steel);
	},
	moveSpeed: (c) => {
		c.pattern(2, 4, ['..aaaa....', '.aaaaaa...', 'aaaaaaaaa.', 'aaaaaaaaaa', '.....aaaa.'], {
			a: P.blue,
		});
		c.line(0, 12, 5, 12, P.cyan);
		c.line(2, 14, 8, 14, P.cyan);
	},
	armor: (c) => {
		c.pattern(
			3,
			2,
			[
				'aaaaaaaaaa',
				'abbbbbbbba',
				'abbbbbbbba',
				'abbbbbbbba',
				'abbbbbbbba',
				'.abbbbbba.',
				'.abbbbbba.',
				'..abbbba..',
				'...abba...',
				'....aa....',
			],
			{
				a: P.silver,
				b: P.slate,
			},
		);
	},
	dodge: (c) => {
		c.circle(6, 8, 4, P.cyan, 110);
		c.circle(10, 8, 4, P.cyan);
		c.px(10, 7, P.white);
	},
	pickupRange: (c) => {
		c.pattern(
			2,
			3,
			[
				'aa......aa',
				'aa......aa',
				'aa......aa',
				'aa......aa',
				'aaa....aaa',
				'.aaa..aaa.',
				'..aaaaaa..',
				'...aaaa...',
			],
			{
				a: P.red,
			},
		);
		c.rect(2, 3, 2, 2, P.silver);
		c.rect(10, 3, 2, 2, P.silver);
	},
	luck: (c) => {
		c.pattern(
			2,
			2,
			[
				'....aa....',
				'...aaaa...',
				'aaaaaaaaaa',
				'.aaaaaaaa.',
				'..aaaaaa..',
				'.aaa..aaa.',
				'aa......aa',
			],
			{
				a: P.yellow,
			},
		);
		c.rect(6, 10, 4, 1, P.amber);
	},
	projectiles: (c) => {
		c.ellipse(5, 5, 3, 2, P.amber);
		c.ellipse(11, 8, 3, 2, P.amber);
		c.ellipse(5, 11, 3, 2, P.amber);
	},
	pierce: (c) => {
		c.rect(7, 2, 2, 12, P.darkSlate);
		c.line(1, 8, 14, 8, P.yellow);
		c.line(11, 5, 14, 8, P.yellow);
		c.line(11, 11, 14, 8, P.yellow);
	},
	// Specials / UI
	revive: (c) => {
		heart(c, P.amber);
		c.rect(7, 5, 2, 6, P.white);
		c.rect(5, 6, 6, 2, P.white);
	},
	full_heal: (c) => {
		c.rect(2, 3, 12, 11, P.white);
		c.rect(6, 5, 4, 8, P.red);
		c.rect(4, 7, 8, 4, P.red);
	},
	gold: (c) => {
		c.pattern(
			4,
			3,
			['..aaaa..', '.ayyyya.', 'ayywyyya', 'ayyyyyya', 'ayyyyyya', '.ayyyya.', '..aaaa..'],
			{
				a: P.orange,
				y: P.amber,
				w: P.white,
			},
		);
	},
	// Abilities
	orbital_drones: (c) => {
		c.ring(8, 8, 7, 1, P.darkSlate);
		c.circle(8, 8, 2, P.orange);
		c.circle(3, 5, 2.5, P.cyan);
		c.circle(13, 11, 2.5, P.cyan);
	},
	chain_lightning: (c) => bolt(c, P.cyan),
	plasma_nova: (c) => {
		c.ring(8, 8, 7, 2, P.cyan);
		c.ring(8, 8, 4, 1, P.white);
		c.circle(8, 8, 1.5, P.white);
	},
	cryo_field: (c) => {
		c.line(8, 1, 8, 14, P.cyan);
		c.line(2, 4, 14, 11, P.cyan);
		c.line(2, 11, 14, 4, P.cyan);
		c.circle(8, 8, 2, P.white);
	},
	homing_missiles: (c) => {
		c.rect(4, 6, 8, 3, P.silver);
		c.px(12, 7, P.red);
		c.px(12, 6, P.red);
		c.px(12, 8, P.red);
		c.rect(1, 6, 3, 3, P.orange);
		c.px(0, 7, P.yellow);
		c.rect(5, 4, 2, 2, P.steel);
		c.rect(5, 9, 2, 2, P.steel);
	},
	arc_turret: (c) => {
		c.rect(4, 9, 8, 5, P.slate);
		c.rect(5, 10, 6, 3, P.steel);
		c.rect(7, 4, 2, 6, P.darkSlate);
		c.rect(6, 2, 4, 3, P.cyan);
		c.px(7, 3, P.white);
	},
	saw_disc: (c) => {
		c.circle(8, 8, 6, P.silver);
		c.circle(8, 8, 2, P.darkSlate);
		for (const [x, y] of [
			[8, 1],
			[15, 8],
			[8, 15],
			[1, 8],
			[3, 3],
			[13, 3],
			[3, 13],
			[13, 13],
		] as const)
			c.px(x, y, P.white);
	},
	gravity_well: (c) => {
		c.ring(8, 8, 7, 1, P.plum);
		c.ring(8, 8, 5, 1, P.orchid);
		c.circle(8, 8, 2.5, P.void);
		c.px(3, 6, P.white);
		c.px(12, 10, P.white);
	},
	nanite_swarm: (c) => {
		for (const [x, y] of [
			[3, 4],
			[7, 3],
			[11, 5],
			[4, 9],
			[9, 8],
			[12, 11],
			[6, 12],
			[10, 13],
			[2, 12],
		] as const) {
			c.rect(x, y, 2, 2, P.green);
		}
		c.px(8, 8, P.yellow);
	},
	laser_beam: (c) => {
		c.rect(0, 6, 16, 4, P.cyan);
		c.rect(0, 7, 16, 2, P.white);
		c.circle(2, 8, 2.5, P.white);
	},
};

export function renderIcon(id: string): PixelCanvas {
	const c = new PixelCanvas(16, 16);
	const draw = ICONS[id];
	if (draw) draw(c);
	else circleIcon(c, P.slate, P.steel);
	c.outline(O);
	return c;
}
