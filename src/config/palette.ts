/**
 * Endesga 32 palette (https://lospec.com/palette-list/endesga-32).
 * Every color used in the game must come from here.
 */
export const PALETTE = {
	rust: 0xbe4a2f,
	copper: 0xd77643,
	sand: 0xead4aa,
	tan: 0xe4a672,
	clay: 0xb86f50,
	brown: 0x733e39,
	darkBrown: 0x3e2731,
	crimson: 0xa22633,
	red: 0xe43b44,
	orange: 0xf77622,
	amber: 0xfeae34,
	yellow: 0xfee761,
	green: 0x63c74d,
	forest: 0x3e8948,
	pine: 0x265c42,
	deepTeal: 0x193c3e,
	navy: 0x124e89,
	blue: 0x0099db,
	cyan: 0x2ce8f5,
	white: 0xffffff,
	silver: 0xc0cbdc,
	steel: 0x8b9bb4,
	slate: 0x5a6988,
	darkSlate: 0x3a4466,
	midnight: 0x262b44,
	void: 0x181425,
	magenta: 0xff0044,
	plum: 0x68386c,
	orchid: 0xb55088,
	salmon: 0xf6757a,
	peach: 0xe8b796,
	mocha: 0xc28569,
} as const;

export type PaletteColor = keyof typeof PALETTE;

/** Converts a palette color to a CSS hex string (e.g. for canvas fillStyle). */
export function toCss(color: number): string {
	return `#${color.toString(16).padStart(6, '0')}`;
}
