import type { TierBudget } from '../data/performance';
import { tierBudget } from '../logic/performance';
import { platform } from './platform';
import type { PlatformTier } from './platform/types';

let forced: PlatformTier | undefined;

/** `?tier=low|mid|high` (QA): overrides the detected device tier. */
export function forceTier(tier: PlatformTier | undefined): void {
	forced = tier;
}

export function activeTier(): PlatformTier {
	return forced ?? platform().tier;
}

export function activeBudget(): TierBudget {
	return tierBudget(activeTier());
}
