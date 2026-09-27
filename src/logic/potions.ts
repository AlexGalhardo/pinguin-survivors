import { CROWD_COUNT, type GambitCondition, type PotionType } from '../data/potions';

export interface GambitSlot {
	potion: PotionType | null;
	condition: GambitCondition | null;
	/** Each slot holds one potion per run (P-28). */
	used: boolean;
}

export interface GambitContext {
	hpRatio: number;
	poisoned: boolean;
	bleeding: boolean;
	bossVisible: boolean;
	enemiesNear: number;
	/** True during the first second of a round. */
	roundStart: boolean;
}

export function conditionMet(c: GambitCondition, ctx: GambitContext): boolean {
	switch (c) {
		case 'hpBelow25':
			return ctx.hpRatio < 0.25;
		case 'hpBelow50':
			return ctx.hpRatio < 0.5;
		case 'hpBelow75':
			return ctx.hpRatio < 0.75;
		case 'poisoned':
			return ctx.poisoned;
		case 'bleeding':
			return ctx.bleeding;
		case 'bossVisible':
			return ctx.bossVisible;
		case 'crowded':
			return ctx.enemiesNear >= CROWD_COUNT;
		case 'roundStart':
			return ctx.roundStart;
	}
}

/** First slot (in order, like FFXII gambits) whose potion is ready and condition holds. */
export function pickGambit(slots: readonly GambitSlot[], ctx: GambitContext): number {
	return slots.findIndex(
		(s) =>
			!s.used && s.potion !== null && s.condition !== null && conditionMet(s.condition, ctx),
	);
}

/**
 * Loads the gambits for a run: a slot only gets its potion if the stock has one (it is taken
 * from the stock now and returned at run end if unused).
 */
export function loadGambits(
	gambits: readonly { potion: PotionType | null; condition: GambitCondition | null }[],
	stock: Record<PotionType, number>,
): GambitSlot[] {
	return gambits.map((g) => {
		if (!g.potion || !g.condition || stock[g.potion] <= 0)
			return { potion: null, condition: null, used: true };
		stock[g.potion]--;
		return { potion: g.potion, condition: g.condition, used: false };
	});
}

/** Unused potions go back to the stock when the run ends. */
export function returnUnused(
	slots: readonly GambitSlot[],
	stock: Record<PotionType, number>,
): void {
	for (const s of slots) if (!s.used && s.potion) stock[s.potion]++;
}
