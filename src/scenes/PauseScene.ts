import Phaser from 'phaser';
import { KEYS } from '../art/manifest';
import { PALETTE, toCss } from '../config/palette';
import { trackZoom } from '../core/viewport';
import { GEAR_BY_ID, GEAR_SLOTS, type GearDef } from '../data/equipment';
import { type I18nKey, t } from '../i18n';
import { emptyGear, equip, unequip } from '../logic/equipment';
import { getStat, type StatKey } from '../logic/stats';
import { menuPx, UI_FONT } from '../ui/font';
import type { GameScene } from './GameScene';
import { MenuList } from './ui-phaser/MenuList';
import { text } from './ui-phaser/screen';

/** Stats listed on the pause screen, in order (percent ones are shown ×100). */
const STAT_ROWS: StatKey[] = [
	'maxHp',
	'regen',
	'armor',
	'dodge',
	'parry',
	'crit',
	'critDamage',
	'damage',
	'attackSpeed',
	'moveSpeed',
	'area',
	'pickupRange',
	'luck',
	'xpGain',
];
const PERCENT = new Set<string>([
	'dodge',
	'parry',
	'crit',
	'critDamage',
	'damage',
	'attackSpeed',
	'area',
	'luck',
	'xpGain',
	'lifesteal',
	'bleedChance',
	'poisonChance',
	'burnChance',
	'chillChance',
	'shockChance',
]);

export function formatStat(key: string, value: number, signed = false): string {
	const isPct = PERCENT.has(key) || key.startsWith('resist.') || key.startsWith('tagMul.');
	const v = isPct ? Math.round(value * 1000) / 10 : Math.round(value * 10) / 10;
	const sign = signed && v > 0 ? '+' : '';
	return `${sign}${v}${isPct ? '%' : ''}`;
}

/** "+4 armor · +8 max HP" for an item. */
function gearSummary(def: GearDef): string {
	return Object.entries(def.stats)
		.map(([k, v]) => `${formatStat(k, v as number, true)} ${t(`gstat.${k}` as I18nKey)}`)
		.join(' · ');
}

/**
 * ESC during a run (Brotato-style): the run's stats, weapons and cards, and the equipment
 * (5 slots + bag) that can be worn or taken off right here. TAB switches between the menu and
 * the equipment column. Resume / settings / quit (keeps XP and fish, P-26).
 */
export class PauseScene extends Phaser.Scene {
	private confirming = false;
	private hint!: Phaser.GameObjects.Text;

	constructor() {
		super('Pause');
	}

	create(data: { gearFocus?: number } = {}): void {
		this.confirming = false;
		const game = this.scene.get('Game') as unknown as GameScene;
		const run = game.run;
		const stats = game.stats;
		const gear = run.gear ?? emptyGear();
		run.gear = gear;
		const small = (size: number, color: number = PALETTE.textLight) => ({
			...text(size, color),
			align: 'left',
		});

		const dim = this.add.rectangle(0, 0, 10, 10, PALETTE.night, 0.82).setOrigin(0, 0);
		const title = this.add
			.text(0, 0, t('pause.title'), text(24, PALETTE.crit))
			.setOrigin(0.5, 0);

		// --- Left: stats ---
		const statsTitle = this.add
			.text(0, 0, t('pause.stats'), text(13, PALETTE.crit))
			.setOrigin(0, 0);
		const statLines = this.add
			.text(
				0,
				0,
				STAT_ROWS.map(
					(k) => `${t(`gstat.${k}` as I18nKey)}: ${formatStat(k, getStat(stats, k))}`,
				).join('\n'),
				small(10),
			)
			.setOrigin(0, 0)
			.setLineSpacing(4);

		// --- Center: menu, weapons and cards ---
		const resume = () => {
			this.scene.stop();
			this.scene.resume('Game');
		};
		const menu = new MenuList(
			this,
			[
				{ label: () => t('pause.resume'), onSelect: resume },
				{
					label: () => t('menu.settings'),
					onSelect: () => {
						this.scene.sleep();
						this.scene.launch('Settings', { from: 'Pause' });
					},
				},
				{
					label: () => (this.confirming ? t('pause.yes') : t('pause.quit')),
					onSelect: () => {
						if (!this.confirming) {
							this.confirming = true;
							return;
						}
						this.scene.stop();
						this.scene.resume('Game');
						game.quitRun();
					},
				},
			],
			{ x: 0, y: 0, fontSize: 15, onBack: resume },
		);
		const weaponLines = [
			...game.build.weapons.map((w) => `${t(`weapon.${w.id}.name` as I18nKey)} (T${w.tier})`),
			...Object.entries(game.build.secondaries).map(
				([id, lv]) =>
					`${t(`card.active.${id}.name` as I18nKey)} ${t('hud.level', { n: lv as number })}`,
			),
		];
		const perkLines = Object.entries(game.build.perks).map(
			([id, lv]) =>
				`${t(`card.perk.${id}.name` as I18nKey)} ${t('hud.level', { n: lv as number })}`,
		);
		const loadout = this.add
			.text(
				0,
				0,
				[
					t('pause.weapons'),
					...weaponLines,
					'',
					perkLines.length ? t('pause.cards') : '',
					...perkLines,
				].join('\n'),
				{ ...text(10, PALETTE.textLight), align: 'center' },
			)
			.setOrigin(0.5, 0)
			.setLineSpacing(3);

		// --- Right: equipment slots + bag ---
		const gearTitle = this.add
			.text(0, 0, t('pause.gear'), text(13, PALETTE.crit))
			.setOrigin(0, 0);
		const bagTitle = this.add
			.text(0, 0, t('pause.bag'), text(11, PALETTE.textDim))
			.setOrigin(0, 0);
		// A blank spacer row separates the 5 slots from the bag (the bag title sits there).
		const rows: {
			kind: 'slot' | 'bag' | 'gap';
			id: string | null;
			slot?: (typeof GEAR_SLOTS)[number];
		}[] = [
			...GEAR_SLOTS.map((slot) => ({ kind: 'slot' as const, id: gear.equipped[slot], slot })),
			{ kind: 'gap' as const, id: null },
			...gear.bag.map((id) => ({ kind: 'bag' as const, id })),
		];
		const refreshGame = () => {
			game.syncMaxHp();
			const focus = gearList.focused;
			this.scene.restart({ gearFocus: focus });
		};
		const gearList = new MenuList(
			this,
			rows.map((r) => ({
				label: () => {
					if (r.kind === 'gap') return '';
					const name = r.id ? t(`gear.${r.id}` as I18nKey) : '—';
					return r.kind === 'slot' ? `${t(`gslot.${r.slot}` as I18nKey)}: ${name}` : name;
				},
				disabled: () => r.kind === 'gap' || (r.kind === 'slot' && !r.id),
				onSelect: () => {
					if (r.kind === 'slot' && r.slot) unequip(gear, stats, r.slot);
					else if (r.id) equip(gear, stats, r.id);
					refreshGame();
				},
			})),
			{ x: 0, y: 0, fontSize: 10, spacing: 22, align: 'left', startFocus: data.gearFocus },
		);
		const icons = rows.map((r) =>
			this.add
				.image(0, 0, r.id ? KEYS.gear(r.id) : KEYS.gearGlow)
				.setVisible(Boolean(r.id))
				.setOrigin(0, 0.5),
		);
		const detail = this.add
			.text(0, 0, '', {
				...text(10, PALETTE.textDim),
				align: 'left',
				wordWrap: { width: 250 },
			})
			.setOrigin(0, 0);
		const showDetail = (i: number) => {
			const r = rows[i];
			const def = r?.id ? GEAR_BY_ID[r.id] : undefined;
			detail
				.setText(
					def
						? `${t(`grarity.${def.rarity}` as I18nKey)} · ${gearSummary(def)}\n${t(r?.kind === 'slot' ? 'pause.unequipHint' : 'pause.equipHint')}`
						: '',
				)
				.setColor(toCss(PALETTE.textDim));
		};
		// Two columns: the menu starts active; TAB (or hovering) moves to the equipment.
		const inGear = data.gearFocus !== undefined && rows.length > 0;
		menu.setActive(!inGear);
		gearList.setActive(inGear);
		menu.onFocus = () => {
			menu.setActive(true);
			gearList.setActive(false);
		};
		gearList.onFocus = (i) => {
			gearList.setActive(true);
			menu.setActive(false);
			showDetail(i);
		};
		if (inGear) showDetail(gearList.focused);
		this.input.keyboard?.on('keydown-TAB', (e: KeyboardEvent) => {
			e.preventDefault();
			const toGear = menu.active && rows.length > 0;
			menu.setActive(!toGear);
			gearList.setActive(toGear);
			if (toGear) showDetail(gearList.focused);
		});
		const empty = this.add
			.text(0, 0, gear.bag.length === 0 ? t('pause.bagEmpty') : '', text(9, PALETTE.textDim))
			.setOrigin(0, 0);
		const hint = this.add
			.text(0, 0, '', { ...text(9, PALETTE.textDim), fontFamily: UI_FONT })
			.setOrigin(0.5, 1);
		this.hint = hint;
		const help = this.add
			.text(0, 0, t('pause.help'), text(9, PALETTE.textDim))
			.setOrigin(0.5, 1);

		const cam = this.cameras.main;
		trackZoom(this, cam, (view) => {
			cam.centerOn(view.width / 2, view.height / 2);
			dim.setSize(view.width, view.height);
			const cx = Math.round(view.width / 2);
			const top = 70;
			title.setPosition(cx, 22);
			const leftX = Math.round(view.width * 0.06);
			statsTitle.setPosition(leftX, top);
			statLines.setPosition(leftX, top + 24);
			menu.layout(cx, top);
			loadout.setPosition(cx, top + menu.height + 20);
			const rightX = Math.round(view.width * 0.62);
			gearTitle.setPosition(rightX, top);
			const listY = top + 26;
			const iconX = rightX;
			const textX = rightX + 26;
			gearList.layout(textX, listY);
			const spacing = 22;
			icons.forEach((img, i) => {
				// Bag rows start after a small gap under the 5 slots (the bag title sits there).
				img.setPosition(iconX, listY + i * spacing + menuPx(10) / 2 + 2);
			});
			const gapY = listY + GEAR_SLOTS.length * spacing;
			bagTitle.setPosition(rightX, gapY);
			empty.setPosition(rightX, gapY + spacing);
			detail.setPosition(
				rightX,
				listY + rows.length * spacing + (gear.bag.length ? 8 : spacing + 8),
			);
			hint.setPosition(cx, view.height - 34);
			help.setPosition(cx, view.height - 14);
		});
	}

	override update(): void {
		// Scene event listeners survive stop/launch, so the hint is refreshed here instead.
		this.hint.setText(this.confirming ? t('pause.confirm') : '');
	}
}
