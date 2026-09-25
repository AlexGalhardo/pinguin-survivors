import {
	ABILITY_TEXT,
	RARITY_NAMES,
	SPECIAL_CARD_TEXT,
	STAT_CARD_NAMES,
	STAT_LABELS,
	STRINGS,
} from '../config/strings';
import type { Card } from '../data/cards';
import { formatStatDelta } from '../logic/format';

export interface CardText {
	title: string;
	desc: string;
	/** "NEW" or "LV 2>3" for abilities, empty otherwise. */
	tag: string;
	rarity: string;
	/** Icon id (icon.<id>). */
	icon: string;
}

export function cardText(card: Card): CardText {
	const rarity = RARITY_NAMES[card.rarity];
	switch (card.kind) {
		case 'stat': {
			const key = card.id.replace('stat.', '');
			return {
				title: STAT_CARD_NAMES[key] ?? STAT_LABELS[card.stat],
				desc: `${formatStatDelta(card.stat, card.value)} ${STAT_LABELS[card.stat]}`,
				tag: '',
				rarity,
				icon: card.stat,
			};
		}
		case 'ability': {
			const t = ABILITY_TEXT[card.ability];
			return {
				title: t.name,
				desc: t.desc,
				tag:
					card.level <= 1
						? STRINGS.cardNew
						: `${STRINGS.level} ${card.level - 1}>${card.level}`,
				rarity,
				icon: card.ability,
			};
		}
		case 'special': {
			const t = SPECIAL_CARD_TEXT[card.special];
			const icon =
				card.special === 'projectile'
					? 'projectiles'
					: card.special === 'pierce'
						? 'pierce'
						: card.special;
			return { title: t.name, desc: t.desc, tag: '', rarity, icon };
		}
	}
}
