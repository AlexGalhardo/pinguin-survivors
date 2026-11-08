import { type I18nKey, t } from '../i18n';

export const MERCHANT_EVENTS = ['open', 'buy', 'noFish', 'reroll', 'fuse', 'leave'] as const;
export type MerchantEvent = (typeof MERCHANT_EVENTS)[number];

/** Lines written per event (`merchant.<event>.1..N` in i18n). */
export const MERCHANT_LINES = 3;

/** Cosmetic pick (does not touch the run RNG, so it never changes a seeded run). */
export function merchantLine(event: MerchantEvent, rand: () => number = Math.random): string {
	const n = Math.min(MERCHANT_LINES, Math.floor(rand() * MERCHANT_LINES) + 1);
	return t(`merchant.${event}.${n}` as I18nKey);
}
