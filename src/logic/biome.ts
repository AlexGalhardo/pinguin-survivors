import { BIOME_IDS, type BiomeId, ENDLESS_BIOMES } from '../config/constants';
import { BOSS_ROUNDS, ENEMIES, ENEMY_LIST, type EnemyDef } from '../data/enemies';
import { ROUNDS } from '../data/rounds';
import { Rng } from './rng';
import { cycle } from './round';

/** Last round of the campaign (5 biomes, ADR-023); round 51+ is the endless mode. */
export const CAMPAIGN_ROUNDS = BIOME_IDS.length * ROUNDS.biomeRounds;

export const isEndless = (round: number): boolean => round > CAMPAIGN_ROUNDS;

/**
 * Biome of a round: Antarctica, forest, city, station, ruins in blocks of 10; from round 51 each
 * block of 10 draws one of the 5 biomes, deterministic per seed. The biome drives ground, border and props.
 */
export function biomeForRound(round: number, seed = 0): BiomeId {
	const block = cycle(round);
	if (!isEndless(round)) return BIOME_IDS[block] as BiomeId;
	const rng = new Rng((seed ^ Math.imul(block, 0x9e3779b1)) >>> 0);
	return rng.pick(ENDLESS_BIOMES);
}

/**
 * Regular enemies that can spawn in `round`: the biome's own in the campaign; in the endless
 * mode every enemy of every biome (weights as defined), unlocked by `fromRound`.
 */
export function enemyPoolForRound(
	round: number,
	pool: readonly EnemyDef[] = ENEMY_LIST,
): EnemyDef[] {
	const biome = biomeForRound(round);
	return pool.filter(
		(e) =>
			e.behavior !== 'boss' &&
			e.fromRound > 0 &&
			e.fromRound <= round &&
			(isEndless(round) || e.biome === biome),
	);
}

/**
 * Boss of a boss round: the campaign table (a different boss every 5 rounds up to 50, ADR-023),
 * then a random one of the 10, deterministic per seed and round.
 */
export function bossForRound(round: number, seed = 0): EnemyDef {
	const slot = Math.max(0, Math.ceil(round / ROUNDS.bossEvery) - 1);
	const id = BOSS_ROUNDS[Math.min(slot, BOSS_ROUNDS.length - 1)];
	if (!isEndless(round) && id) return ENEMIES[id];
	const rng = new Rng((seed ^ Math.imul(round, 0x85ebca6b)) >>> 0);
	return ENEMIES[rng.pick(BOSS_ROUNDS)];
}

/** First round of a biome visit (a new biome banner and ground swap happen here). */
export function isBiomeStart(round: number): boolean {
	return round > 1 && (round - 1) % ROUNDS.biomeRounds === 0;
}
