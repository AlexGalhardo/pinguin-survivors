import Phaser from 'phaser';
import { PALETTE } from '../config/palette';
import { getSave, persist } from '../core/context';
import { ACHIEVEMENT_SHOP } from '../data/achievements';
import { type I18nKey, t } from '../i18n';
import { availablePoints, buyExtra, extraLevel } from '../logic/achievements';
import { MenuList } from '../ui/MenuList';
import { setupScreen, text } from '../ui/screen';

const PERCENT = new Set<string>(['crit', 'critDamage', 'dodge', 'parry', 'attackSpeed', 'damage']);

function total(stat: string, value: number): string {
	return PERCENT.has(stat)
		? `+${Math.round(value * 1000) / 10}%`
		: `+${Math.round(value * 100) / 100}`;
}

/** Extras shop (P-61): permanent bonuses for every hero, paid with achievement points. */
export class ExtrasScene extends Phaser.Scene {
	constructor() {
		super('Extras');
	}

	create(): void {
		const save = getSave(this);
		const state = save.achievements;
		const points = this.add.text(0, 0, '', text(12, PALETTE.fish)).setOrigin(0.5, 0);
		const refresh = () => points.setText(t('extras.points', { n: availablePoints(state) }));
		const back = () => this.scene.start('Achievements');
		const items = ACHIEVEMENT_SHOP.map((e) => ({
			label: () => {
				const level = extraLevel(state, e.id);
				const max = e.maxLevel ?? 1;
				return t('extras.row', {
					name: t(`extra.${e.id}` as I18nKey),
					level,
					max,
					bonus: total(e.stat ?? '', (e.perLevel ?? 0) * level),
					price: level >= max ? t('workshop.maxed') : t('extras.price', { n: e.cost }),
				});
			},
			disabled: () =>
				extraLevel(state, e.id) >= (e.maxLevel ?? 1) || availablePoints(state) < e.cost,
			onSelect: () => {
				if (buyExtra(state, e) !== 'ok') return;
				persist(this);
				refresh();
			},
		}));
		const menu = new MenuList(
			this,
			[...items, { label: () => t('menu.back'), onSelect: back }],
			{ x: 0, y: 0, fontSize: 11, spacing: 18, onBack: back },
		);
		const hint = this.add
			.text(0, 0, t('extras.hint'), text(8, PALETTE.textDim))
			.setOrigin(0.5, 0);
		refresh();
		setupScreen(this, t('extras.title'), (view, cx) => {
			points.setPosition(cx, 60);
			menu.layout(cx, 92);
			hint.setPosition(cx, view.height - 30);
		});
	}
}
