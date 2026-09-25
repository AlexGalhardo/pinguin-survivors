export type CharacterId = 'warrior' | 'ranger' | 'mage';

const CHARACTERS: readonly CharacterId[] = ['warrior', 'ranger', 'mage'];

/** Debug/test options read from the URL, e.g. ?seed=1&char=mage&wave=10&god=1&debug=1&skipMenu=1 */
export interface DebugParams {
	seed?: number;
	char?: CharacterId;
	wave?: number;
	god: boolean;
	debug: boolean;
	skipMenu: boolean;
}

function flag(value: string | null): boolean {
	return value === '1' || value === 'true';
}

function positiveInt(value: string | null): number | undefined {
	if (value === null) return undefined;
	const n = Number(value);
	return Number.isInteger(n) && n >= 0 ? n : undefined;
}

export function parseDebugParams(search: string): DebugParams {
	const p = new URLSearchParams(search);
	const char = p.get('char');
	const wave = positiveInt(p.get('wave'));
	return {
		seed: positiveInt(p.get('seed')),
		char: CHARACTERS.find((c) => c === char),
		wave: wave !== undefined && wave >= 1 ? wave : undefined,
		god: flag(p.get('god')),
		debug: flag(p.get('debug')),
		skipMenu: flag(p.get('skipMenu')),
	};
}
