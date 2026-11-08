import type { PlatformTier } from '../core/platform/types';
import { TIER_BUDGET, type TierBudget } from '../data/performance';

export function tierBudget(tier: PlatformTier): TierBudget {
	return TIER_BUDGET[tier];
}

/** Scales an integer particle count, keeping at least one while the effect is on. */
export function scaleParticles(count: number, scale: number): number {
	return count <= 0 ? 0 : Math.max(1, Math.round(count * scale));
}
