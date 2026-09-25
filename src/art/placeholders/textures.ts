import { PALETTE as P } from '../../config/palette';
import { TEX, type TextureKey } from '../manifest';
import { PixelCanvas } from './pixel-canvas';

/**
 * Placeholder art drawn by code (Alpha). One generator per texture key of the manifest.
 * Rules (docs/art-and-assets.md): Endesga 32 only, 1 px dark outline on gameplay sprites,
 * warm player colors, cold enemies, enemy projectiles always red/orange.
 */
export interface PlaceholderSpec {
	w: number;
	h: number;
	draw: (c: PixelCanvas) => void;
}

const OUTLINE = P.void;

function warrior(c: PixelCanvas): void {
	c.rect(11, 25, 4, 5, P.darkSlate);
	c.rect(17, 25, 4, 5, P.darkSlate);
	c.ellipse(16, 20, 8, 7, P.slate);
	c.ellipse(16, 19, 6, 5, P.steel);
	c.circle(8.5, 17.5, 3.5, P.silver);
	c.circle(23.5, 17.5, 3.5, P.silver);
	c.circle(16, 11, 6, P.silver);
	c.rect(11, 9, 10, 3, P.orange);
	c.rect(12, 9, 3, 1, P.yellow);
	c.line(27, 5, 27, 21, P.cyan);
	c.line(28, 6, 28, 20, P.white);
	c.rect(26, 22, 3, 3, P.amber);
	c.outline(OUTLINE);
}

function ranger(c: PixelCanvas): void {
	c.rect(12, 25, 3, 5, P.pine);
	c.rect(17, 25, 3, 5, P.pine);
	c.ellipse(16, 20, 6, 6, P.forest);
	c.ellipse(16, 19, 4, 4, P.green);
	c.rect(10, 16, 12, 2, P.amber);
	c.circle(16, 11, 5, P.peach);
	c.rect(11, 6, 10, 4, P.brown);
	c.rect(12, 11, 8, 2, P.darkBrown);
	c.rect(13, 11, 2, 1, P.yellow);
	c.rect(17, 11, 2, 1, P.yellow);
	c.rect(22, 18, 7, 3, P.darkSlate);
	c.rect(28, 18, 2, 2, P.orange);
	c.outline(OUTLINE);
}

function mage(c: PixelCanvas): void {
	c.ellipse(16, 22, 8, 8, P.plum);
	c.ellipse(16, 21, 6, 6, P.orchid);
	c.rect(15, 15, 2, 14, P.amber);
	c.circle(16, 11, 6, P.plum);
	c.circle(16, 12, 4, P.darkBrown);
	c.rect(13, 11, 2, 2, P.cyan);
	c.rect(17, 11, 2, 2, P.cyan);
	c.circle(26, 9, 3, P.orchid);
	c.px(26, 8, P.white);
	c.outline(OUTLINE);
}

function chaser(c: PixelCanvas): void {
	c.ellipse(16, 18, 10, 9, P.forest);
	c.ellipse(16, 16, 8, 6, P.green);
	c.rect(11, 14, 3, 3, P.yellow);
	c.rect(18, 14, 3, 3, P.yellow);
	c.px(12, 15, P.void);
	c.px(19, 15, P.void);
	c.rect(13, 21, 6, 2, P.pine);
	c.line(8, 26, 6, 29, P.pine);
	c.line(24, 26, 26, 29, P.pine);
	c.outline(OUTLINE);
}

function runner(c: PixelCanvas): void {
	c.line(10, 13, 6, 10, P.darkSlate);
	c.line(22, 13, 26, 10, P.darkSlate);
	c.line(10, 19, 6, 22, P.darkSlate);
	c.line(22, 19, 26, 22, P.darkSlate);
	c.ellipse(16, 16, 6, 7, P.deepTeal);
	c.ellipse(16, 15, 4, 5, P.pine);
	c.px(14, 12, P.red);
	c.px(18, 12, P.red);
	c.outline(OUTLINE);
}

function shooter(c: PixelCanvas): void {
	c.circle(16, 16, 9, P.darkSlate);
	c.ring(16, 16, 9, 2, P.steel);
	c.circle(16, 16, 4, P.midnight);
	c.circle(16, 16, 2.5, P.red);
	c.px(15, 15, P.white);
	c.rect(4, 15, 4, 2, P.slate);
	c.rect(24, 15, 4, 2, P.slate);
	c.outline(OUTLINE);
}

function tank(c: PixelCanvas): void {
	c.ellipse(16, 18, 14, 12, P.plum);
	c.ellipse(16, 16, 11, 8, P.orchid);
	c.rect(6, 10, 20, 4, P.slate);
	c.rect(7, 10, 18, 1, P.steel);
	c.rect(11, 17, 3, 2, P.yellow);
	c.rect(18, 17, 3, 2, P.yellow);
	c.rect(12, 23, 8, 2, P.darkBrown);
	c.outline(OUTLINE);
}

function boss(c: PixelCanvas): void {
	c.ellipse(32, 36, 28, 25, P.plum);
	c.ellipse(32, 32, 23, 18, P.orchid);
	for (let i = 0; i < 5; i++) c.ellipse(12 + i * 10, 12, 3, 7, P.darkSlate);
	c.rect(14, 22, 36, 5, P.slate);
	c.rect(15, 22, 34, 1, P.steel);
	c.circle(22, 34, 4, P.yellow);
	c.circle(42, 34, 4, P.yellow);
	c.circle(32, 30, 3, P.yellow);
	c.px(22, 34, P.void);
	c.px(42, 34, P.void);
	c.px(32, 30, P.void);
	c.ellipse(32, 47, 10, 4, P.darkBrown);
	c.rect(25, 46, 14, 1, P.magenta);
	c.outline(OUTLINE);
}

function splitter(c: PixelCanvas): void {
	c.ellipse(11, 17, 8, 8, P.pine);
	c.ellipse(21, 17, 8, 8, P.forest);
	c.ellipse(16, 15, 7, 6, P.green);
	c.rect(12, 13, 2, 2, P.yellow);
	c.rect(18, 13, 2, 2, P.yellow);
	c.line(16, 9, 16, 24, P.deepTeal);
	c.outline(OUTLINE);
}

function splitling(c: PixelCanvas): void {
	c.ellipse(16, 17, 6, 5, P.green);
	c.px(14, 16, P.yellow);
	c.px(18, 16, P.yellow);
	c.outline(OUTLINE);
}

function bomber(c: PixelCanvas): void {
	c.circle(16, 17, 8, P.darkSlate);
	c.circle(16, 17, 6, P.plum);
	c.rect(14, 6, 4, 4, P.slate);
	c.line(17, 6, 20, 3, P.amber);
	c.px(20, 2, P.yellow);
	c.rect(13, 15, 6, 2, P.red);
	c.outline(OUTLINE);
}

function healer(c: PixelCanvas): void {
	c.ellipse(16, 17, 9, 8, P.deepTeal);
	c.ellipse(16, 16, 7, 6, P.pine);
	c.rect(15, 11, 2, 10, P.green);
	c.rect(11, 15, 10, 2, P.green);
	c.ring(16, 16, 12, 1, P.green, 160);
	c.outline(OUTLINE);
}

function burrower(c: PixelCanvas): void {
	c.ellipse(16, 19, 9, 7, P.brown);
	c.ellipse(16, 17, 7, 5, P.clay);
	c.line(9, 10, 13, 14, P.sand);
	c.line(23, 10, 19, 14, P.sand);
	c.px(14, 17, P.red);
	c.px(18, 17, P.red);
	c.outline(OUTLINE);
}

function boss2(c: PixelCanvas): void {
	c.rect(10, 14, 44, 36, P.darkSlate);
	c.rect(12, 16, 40, 32, P.slate);
	c.rect(14, 18, 36, 4, P.steel);
	c.circle(32, 34, 9, P.midnight);
	c.circle(32, 34, 6, P.red);
	c.circle(31, 33, 2, P.yellow);
	c.rect(4, 26, 8, 12, P.darkSlate);
	c.rect(52, 26, 8, 12, P.darkSlate);
	c.rect(26, 50, 12, 6, P.darkSlate);
	c.outline(OUTLINE);
}

function boss3(c: PixelCanvas): void {
	c.ellipse(32, 38, 28, 22, P.navy);
	c.ellipse(32, 34, 22, 16, P.darkSlate);
	c.rect(8, 16, 10, 16, P.slate);
	c.rect(46, 16, 10, 16, P.slate);
	c.circle(24, 34, 4, P.cyan);
	c.circle(40, 34, 4, P.cyan);
	c.rect(22, 44, 20, 3, P.magenta);
	c.ellipse(32, 14, 10, 6, P.plum);
	c.outline(OUTLINE);
}

function bladeArc(c: PixelCanvas): void {
	// Arc of 120 degrees facing +X, radius 45, centered on the texture.
	const cx = 48;
	const cy = 48;
	for (let y = 0; y < 96; y++) {
		for (let x = 0; x < 96; x++) {
			const dx = x + 0.5 - cx;
			const dy = y + 0.5 - cy;
			const d = Math.hypot(dx, dy);
			const a = Math.abs(Math.atan2(dy, dx));
			if (a > Math.PI / 3 || d > 46 || d < 30) continue;
			const edge = d > 43 ? P.white : d > 38 ? P.cyan : P.blue;
			c.px(x, y, edge, d < 34 ? 110 : 230);
		}
	}
}

function panel(fill: number, light: number, dark: number, border: number) {
	return (c: PixelCanvas): void => {
		const s = c.width;
		c.rect(1, 1, s - 2, s - 2, fill);
		c.rect(1, 0, s - 2, 1, border);
		c.rect(1, s - 1, s - 2, 1, border);
		c.rect(0, 1, 1, s - 2, border);
		c.rect(s - 1, 1, 1, s - 2, border);
		c.rect(1, 1, s - 2, 1, light);
		c.rect(1, 1, 1, s - 2, light);
		c.rect(1, s - 2, s - 2, 1, dark);
		c.rect(s - 2, 1, 1, s - 2, dark);
	};
}

function floor(variant: number) {
	return (c: PixelCanvas): void => {
		c.rect(0, 0, 32, 32, P.midnight);
		c.rect(0, 0, 32, 1, P.darkSlate);
		c.rect(0, 0, 1, 32, P.darkSlate);
		if (variant === 1) {
			c.px(9, 8, P.darkSlate);
			c.px(22, 20, P.darkSlate);
			c.px(14, 25, P.darkSlate);
		} else if (variant === 2) {
			c.line(6, 10, 12, 14, P.void);
			c.line(12, 14, 11, 20, P.void);
		} else if (variant === 3) {
			c.rect(12, 12, 8, 8, P.darkSlate);
			c.rect(13, 13, 6, 6, P.midnight);
			c.px(15, 15, P.slate);
		}
	};
}

function wall(c: PixelCanvas): void {
	c.rect(0, 0, 32, 32, P.darkSlate);
	c.rect(0, 0, 32, 2, P.slate);
	c.rect(0, 30, 32, 2, P.midnight);
	c.rect(15, 2, 2, 28, P.midnight);
	for (const [x, y] of [
		[4, 5],
		[27, 5],
		[4, 26],
		[27, 26],
	] as const) {
		c.px(x, y, P.steel);
	}
}

export const PLACEHOLDERS: Record<TextureKey, PlaceholderSpec> = {
	[TEX.playerWarrior]: { w: 32, h: 32, draw: warrior },
	[TEX.playerRanger]: { w: 32, h: 32, draw: ranger },
	[TEX.playerMage]: { w: 32, h: 32, draw: mage },

	[TEX.enemyChaser]: { w: 32, h: 32, draw: chaser },
	[TEX.enemyRunner]: { w: 32, h: 32, draw: runner },
	[TEX.enemyShooter]: { w: 32, h: 32, draw: shooter },
	[TEX.enemyTank]: { w: 32, h: 32, draw: tank },
	[TEX.enemyBoss]: { w: 64, h: 64, draw: boss },
	[TEX.enemyBoss2]: { w: 64, h: 64, draw: boss2 },
	[TEX.enemyBoss3]: { w: 64, h: 64, draw: boss3 },
	[TEX.enemySplitter]: { w: 32, h: 32, draw: splitter },
	[TEX.enemySplitling]: { w: 32, h: 32, draw: splitling },
	[TEX.enemyBomber]: { w: 32, h: 32, draw: bomber },
	[TEX.enemyHealer]: { w: 32, h: 32, draw: healer },
	[TEX.enemyBurrower]: { w: 32, h: 32, draw: burrower },

	[TEX.projBlaster]: {
		w: 8,
		h: 8,
		draw: (c) => {
			c.ellipse(4, 4, 4, 2, P.amber);
			c.ellipse(4.5, 4, 2, 1, P.white);
		},
	},
	[TEX.projPsiOrb]: {
		w: 12,
		h: 12,
		draw: (c) => {
			c.circle(6, 6, 6, P.plum);
			c.circle(6, 6, 4, P.orchid);
			c.circle(5.5, 5.5, 1.5, P.white);
		},
	},
	[TEX.projEnemy]: {
		w: 8,
		h: 8,
		draw: (c) => {
			c.circle(4, 4, 4, P.red);
			c.circle(4, 4, 2, P.orange);
			c.px(3, 3, P.yellow);
		},
	},
	[TEX.fxBladeArc]: { w: 96, h: 96, draw: bladeArc },

	[TEX.abilityDrone]: {
		w: 12,
		h: 12,
		draw: (c) => {
			c.circle(6, 6, 5, P.steel);
			c.circle(6, 6, 2, P.cyan);
			c.outline(OUTLINE);
		},
	},
	[TEX.abilityMissile]: {
		w: 12,
		h: 6,
		draw: (c) => {
			c.rect(3, 2, 7, 2, P.silver);
			c.px(10, 2, P.red);
			c.px(10, 3, P.red);
			c.rect(0, 2, 3, 2, P.orange);
			c.px(0, 2, P.yellow);
		},
	},
	[TEX.abilityTurret]: {
		w: 16,
		h: 16,
		draw: (c) => {
			c.rect(3, 10, 10, 5, P.slate);
			c.rect(4, 11, 8, 3, P.steel);
			c.rect(7, 4, 2, 7, P.darkSlate);
			c.circle(8, 4, 3, P.cyan);
			c.px(7, 3, P.white);
			c.outline(OUTLINE);
		},
	},
	[TEX.abilitySaw]: {
		w: 14,
		h: 14,
		draw: (c) => {
			c.circle(7, 7, 6, P.silver);
			c.circle(7, 7, 2, P.darkSlate);
			for (const [x, y] of [
				[7, 0],
				[13, 7],
				[7, 13],
				[0, 7],
			] as const) {
				c.px(x, y, P.white);
			}
		},
	},
	[TEX.fxLightning]: {
		w: 8,
		h: 8,
		draw: (c) => {
			c.circle(4, 4, 4, P.cyan, 160);
			c.circle(4, 4, 2, P.white);
		},
	},
	[TEX.fxNova]: {
		w: 64,
		h: 64,
		draw: (c) => {
			c.circle(32, 32, 32, P.cyan, 50);
			c.ring(32, 32, 32, 3, P.cyan);
			c.ring(32, 32, 30, 1, P.white);
		},
	},
	[TEX.fxCryo]: {
		w: 64,
		h: 64,
		draw: (c) => {
			c.circle(32, 32, 32, P.blue, 45);
			c.ring(32, 32, 32, 1, P.cyan, 180);
		},
	},
	[TEX.fxLaser]: {
		w: 8,
		h: 8,
		draw: (c) => {
			c.rect(0, 0, 8, 8, P.cyan);
			c.rect(0, 2, 8, 4, P.white);
		},
	},

	[TEX.fxTelegraph]: {
		w: 16,
		h: 16,
		draw: (c) => {
			c.ring(8, 8, 8, 2, P.red);
			c.line(4, 4, 11, 11, P.orange);
			c.line(11, 4, 4, 11, P.orange);
		},
	},
	[TEX.fxShockwave]: {
		w: 64,
		h: 64,
		draw: (c) => {
			c.ring(32, 32, 32, 4, P.white, 220);
			c.ring(32, 32, 28, 2, P.cyan, 160);
		},
	},
	[TEX.fxPixel]: { w: 2, h: 2, draw: (c) => c.rect(0, 0, 2, 2, P.white) },
	[TEX.fxShadow]: { w: 16, h: 6, draw: (c) => c.ellipse(8, 3, 8, 3, P.void, 110) },

	[TEX.pickupGold]: {
		w: 8,
		h: 8,
		draw: (c) => {
			c.pattern(
				0,
				0,
				[
					'...aa...',
					'..ayya..',
					'.ayyyya.',
					'ayywyyya',
					'ayyyyyya',
					'.ayyyya.',
					'..ayya..',
					'...aa...',
				],
				{ a: P.orange, y: P.amber, w: P.white },
			);
		},
	},
	[TEX.pickupMedkit]: {
		w: 12,
		h: 12,
		draw: (c) => {
			c.rect(1, 2, 10, 9, P.white);
			c.rect(4, 1, 4, 2, P.silver);
			c.rect(5, 4, 2, 6, P.red);
			c.rect(3, 6, 6, 2, P.red);
			c.outline(OUTLINE);
		},
	},

	[TEX.tileFloor0]: { w: 32, h: 32, draw: floor(0) },
	[TEX.tileFloor1]: { w: 32, h: 32, draw: floor(1) },
	[TEX.tileFloor2]: { w: 32, h: 32, draw: floor(2) },
	[TEX.tileFloor3]: { w: 32, h: 32, draw: floor(3) },
	[TEX.tileWall]: { w: 32, h: 32, draw: wall },

	[TEX.uiPanel]: { w: 12, h: 12, draw: panel(P.midnight, P.darkSlate, P.void, P.slate) },
	[TEX.uiButton]: { w: 12, h: 12, draw: panel(P.darkSlate, P.slate, P.midnight, P.steel) },
	[TEX.uiButtonHover]: { w: 12, h: 12, draw: panel(P.slate, P.steel, P.darkSlate, P.yellow) },
	[TEX.uiButtonPressed]: { w: 12, h: 12, draw: panel(P.midnight, P.void, P.darkSlate, P.amber) },
	[TEX.uiButtonDisabled]: {
		w: 12,
		h: 12,
		draw: panel(P.midnight, P.midnight, P.midnight, P.darkSlate),
	},
	[TEX.uiCardCommon]: { w: 12, h: 12, draw: panel(P.midnight, P.darkSlate, P.void, P.steel) },
	[TEX.uiCardRare]: { w: 12, h: 12, draw: panel(P.midnight, P.navy, P.void, P.blue) },
	[TEX.uiCardEpic]: { w: 12, h: 12, draw: panel(P.midnight, P.plum, P.void, P.orchid) },
	[TEX.uiCardLegendary]: { w: 12, h: 12, draw: panel(P.midnight, P.brown, P.void, P.amber) },
};

/** Draws one placeholder into a fresh buffer. */
export function renderPlaceholder(key: TextureKey): PixelCanvas {
	const spec = PLACEHOLDERS[key];
	const canvas = new PixelCanvas(spec.w, spec.h);
	spec.draw(canvas);
	return canvas;
}

/** Nine-slice inset (px) used by the ui.panel/button/card textures. */
export const UI_SLICE = 3;
