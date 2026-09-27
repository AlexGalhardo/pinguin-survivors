import { BIOME_IDS, type BiomeId } from '../config/constants';
import { BOSS_BY_BIOME, ENEMIES, type EnemyDef } from '../data/enemies';
import { ROUNDS } from '../data/rounds';
import { cycle } from './round';

/** Rounds 1–10 Antarctica, 11–20 research station, 21–30 ruined city, then it loops. */
export function biomeForRound(round: number): BiomeId {
	return BIOME_IDS[cycle(round) % BIOME_IDS.length] as BiomeId;
}

/** Boss of a boss round: the biome's boss (rotating pool; HP scales by cycle elsewhere). */
export function bossForRound(round: number): EnemyDef {
	return ENEMIES[BOSS_BY_BIOME[biomeForRound(round)]];
}

/** First round of a biome visit (a new biome banner and ground swap happen here). */
export function isBiomeStart(round: number): boolean {
	return round > 1 && (round - 1) % ROUNDS.bossEvery === 0;
}
