import { type CardDef, RARITY_MUL, type Rarity } from '../data/cards';
import { getLang, type I18nKey, t } from '../i18n';

/** Stats shown as percentages (multipliers and chances); the rest are flat numbers. */
const FLAT = new Set(['maxHp', 'regen', 'armor', 'moveSpeed', 'pickupRange']);

export function cardValue(card: CardDef, rarity: Rarity): string {
	if (card.effect.type !== 'stat') return '';
	const v = card.effect.value * RARITY_MUL[rarity];
	if (FLAT.has(card.effect.stat)) return (Math.round(v * 10) / 10).toLocaleString(getLang());
	return `${Math.round(v * 100)}%`;
}

export function cardName(card: CardDef): string {
	return t(`card.${card.id}.name` as I18nKey);
}

export function cardDescription(card: CardDef, rarity: Rarity): string {
	return t(`card.${card.id}.desc` as I18nKey, { v: cardValue(card, rarity) });
}
