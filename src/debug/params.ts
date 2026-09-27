import { HERO_IDS, type HeroId } from '../config/constants';

/** Debug/test options from the URL, e.g. ?skipMenu=1&hero=bob&round=10&seed=1&debug=1&god=1&tier=2 */
export interface DebugParams {
	seed?: number;
	hero?: HeroId;
	round?: number;
	tier?: 1 | 2 | 3;
	god: boolean;
	debug: boolean;
	skipMenu: boolean;
}

function flag(value: string | null): boolean {
	return value === '1' || value === 'true';
}

function nonNegativeInt(value: string | null): number | undefined {
	if (value === null || value === '') return undefined;
	const n = Number(value);
	return Number.isInteger(n) && n >= 0 ? n : undefined;
}

export function parseDebugParams(search: string): DebugParams {
	const p = new URLSearchParams(search);
	const hero = p.get('hero');
	const round = nonNegativeInt(p.get('round'));
	const tier = nonNegativeInt(p.get('tier'));
	return {
		seed: nonNegativeInt(p.get('seed')),
		hero: HERO_IDS.find((h) => h === hero),
		round: round !== undefined && round >= 1 ? round : undefined,
		tier: tier === 1 || tier === 2 || tier === 3 ? tier : undefined,
		god: flag(p.get('god')),
		debug: flag(p.get('debug')),
		skipMenu: flag(p.get('skipMenu')),
	};
}
