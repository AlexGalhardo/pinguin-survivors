import Phaser from 'phaser';
import { PALETTE } from '../config/palette';
import { getSave, persist } from '../core/context';
import { UPGRADES } from '../data/upgrades';
import { type I18nKey, t } from '../i18n';
import { buyUpgrade, upgradeCost, upgradeLevel } from '../logic/upgrades';
import { MenuList } from '../ui/MenuList';
import { setupScreen, text } from '../ui/screen';

const PERCENT_STATS = new Set<string>(['damage', 'attackSpeed', 'xpGain', 'luck']);

function bonus(stat: string, value: number): string {
	return PERCENT_STATS.has(stat)
		? `+${Math.round(value * 100)}%`
		: `+${Math.round(value * 10) / 10}`;
}

/** Workshop: permanent upgrades bought with Fish, shared by every hero (PLAN 2.2). */
export class WorkshopScene extends Phaser.Scene {
	constructor() {
		super('Workshop');
	}

	create(): void {
		const save = getSave(this);
		const wallet = this.add.text(0, 0, '', text(12, PALETTE.fish)).setOrigin(0.5, 0);
		const refreshWallet = () => wallet.setText(t('workshop.fish', { fish: save.fish }));
		const back = () => this.scene.start('MainMenu');
		const items = UPGRADES.map((def) => ({
			label: () => {
				const level = upgradeLevel(save.upgrades, def.id);
				const cost = upgradeCost(def, level);
				return t('workshop.row', {
					name: t(`upgrade.${def.id}` as I18nKey),
					level,
					max: def.maxLevel,
					bonus: bonus(def.stat, def.perLevel * level),
					price: cost === null ? t('workshop.maxed') : t('workshop.price', { n: cost }),
				});
			},
			disabled: () => {
				const cost = upgradeCost(def, upgradeLevel(save.upgrades, def.id));
				return cost === null || save.fish < cost;
			},
			onSelect: () => {
				const left = buyUpgrade(def, save.upgrades, save.fish);
				if (left === null) return;
				save.fish = left;
				persist(this);
				refreshWallet();
			},
		}));
		const menu = new MenuList(
			this,
			[...items, { label: () => t('menu.back'), onSelect: back }],
			{ x: 0, y: 0, fontSize: 11, spacing: 18, onBack: back },
		);
		const hint = this.add
			.text(0, 0, t('workshop.hint'), text(8, PALETTE.textDim))
			.setOrigin(0.5, 0);
		refreshWallet();
		setupScreen(this, t('workshop.title'), (view, cx) => {
			wallet.setPosition(cx, 60);
			menu.layout(cx, 92);
			hint.setPosition(cx, view.height - 30);
		});
	}
}
