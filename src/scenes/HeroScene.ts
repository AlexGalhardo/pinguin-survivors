import Phaser from 'phaser';
import { KEYS } from '../art/manifest';
import { HERO_IDS, type HeroId } from '../config/constants';
import { PALETTE } from '../config/palette';
import { getSave, persist } from '../core/context';
import { HEROES } from '../data/heroes';
import {
	GAMBIT_CONDITIONS,
	type GambitCondition,
	POTION_PRICES,
	POTION_TYPES,
	type PotionType,
} from '../data/potions';
import { getLang, type I18nKey, t } from '../i18n';
import { freePoints, xpToNext } from '../logic/progression';
import { getStat, heroStats, POINT_VALUES, type PointStat } from '../logic/stats';
import { type MenuItem, MenuList } from '../ui/MenuList';
import { setupScreen, text } from '../ui/screen';

const PERCENT = new Set<string>(['attackSpeed', 'dodge', 'parry', 'crit']);

function fmt(stat: string, value: number): string {
	if (PERCENT.has(stat) || stat.startsWith('resist.')) return `${Math.round(value * 1000) / 10}%`;
	return (Math.round(value * 10) / 10).toLocaleString(getLang());
}

/**
 * Menu hub for persistent progression: hero level and stat points (P-25), potion shop with
 * Fish and the 3 gambit slots (P-28). Every change is saved immediately.
 */
export class HeroScene extends Phaser.Scene {
	private hero: HeroId = 'jack';

	constructor() {
		super('Hero');
	}

	create(): void {
		const save = getSave(this);
		const unlocked = HERO_IDS.filter((h) => save.heroes[h].unlocked);
		if (!unlocked.includes(this.hero)) this.hero = unlocked[0] ?? 'jack';
		const portrait = this.add.image(0, 0, KEYS.portrait(this.hero));
		if (!this.textures.exists(KEYS.portrait(this.hero)))
			portrait.setTexture(KEYS.heroFacing(this.hero, 1, 's'));
		const info = this.add.text(0, 0, '', text(10, PALETTE.crit)).setOrigin(0.5, 0);
		const refreshInfo = () => {
			const h = save.heroes[this.hero];
			info.setText(
				`${t(`hero.${this.hero}` as I18nKey).toUpperCase()}  ·  ${t('select.level', { n: h.level })}  ·  XP ${Math.floor(h.xp)}/${xpToNext(h.level)}\n${t('hero.points', { n: freePoints(h.level, h.points) })}`,
			);
		};
		const heroItem: MenuItem = {
			label: () => `< ${t(`hero.${this.hero}` as I18nKey)} >`,
			onAdjust: (d) => {
				const i = unlocked.indexOf(this.hero);
				this.hero = unlocked[(i + d + unlocked.length) % unlocked.length] as HeroId;
				this.scene.restart();
			},
		};
		const statItems: MenuItem[] = (Object.keys(POINT_VALUES) as PointStat[]).map((stat) => ({
			label: () => {
				const s = heroStats(
					HEROES[this.hero],
					save.heroes[this.hero].level,
					save.heroes[this.hero].points,
				);
				return t('hero.stat', {
					name: t(`stat.${stat}` as I18nKey),
					value: fmt(stat, getStat(s, stat)),
					step: fmt(stat, POINT_VALUES[stat]),
				});
			},
			disabled: () =>
				freePoints(save.heroes[this.hero].level, save.heroes[this.hero].points) <= 0,
			onSelect: () => {
				const h = save.heroes[this.hero];
				if (freePoints(h.level, h.points) <= 0) return;
				h.points[stat] = (h.points[stat] ?? 0) + 1;
				persist(this);
				refreshInfo();
			},
		}));
		const potionItems: MenuItem[] = POTION_TYPES.map((p) => ({
			label: () =>
				t('hero.buy', {
					name: t(`potion.${p}` as I18nKey),
					owned: save.potions[p],
					price: POTION_PRICES[p],
				}),
			disabled: () => save.fish < POTION_PRICES[p],
			onSelect: () => {
				if (save.fish < POTION_PRICES[p]) return;
				save.fish -= POTION_PRICES[p];
				save.potions[p]++;
				persist(this);
				potionTitle.setText(t('hero.potions', { fish: save.fish }));
			},
		}));
		const potionChoices: (PotionType | null)[] = [null, ...POTION_TYPES];
		const conditionChoices: (GambitCondition | null)[] = [null, ...GAMBIT_CONDITIONS];
		const cycle = <T>(list: readonly T[], value: T, d: number): T =>
			list[(list.indexOf(value) + d + list.length) % list.length] as T;
		const gambitItems: MenuItem[] = save.gambits.map((g, i) => ({
			label: () =>
				t('hero.gambit', {
					n: i + 1,
					potion: g.potion ? t(`potion.${g.potion}` as I18nKey) : t('hero.none'),
					condition: g.condition ? t(`cond.${g.condition}` as I18nKey) : t('hero.none'),
				}),
			// Left/right: potion; Enter: condition.
			onAdjust: (d) => {
				g.potion = cycle(potionChoices, g.potion, d);
				if (g.potion && !g.condition) g.condition = 'hpBelow50';
				persist(this);
			},
			onSelect: () => {
				g.condition = cycle(conditionChoices, g.condition, 1);
				persist(this);
			},
		}));
		const back = () => this.scene.start('MainMenu');
		const left = new MenuList(this, [heroItem, ...statItems], {
			x: 0,
			y: 0,
			fontSize: 10,
			spacing: 14,
			onBack: back,
		});
		const potionTitle = this.add
			.text(0, 0, t('hero.potions', { fish: save.fish }), text(12, 0xff9a3c))
			.setOrigin(0.5, 0);
		const right = new MenuList(
			this,
			[...potionItems, ...gambitItems, { label: () => t('menu.back'), onSelect: back }],
			{
				x: 0,
				y: 0,
				fontSize: 10,
				spacing: 14,
			},
		);
		right.setActive(false);
		const activate = (which: MenuList) => {
			left.setActive(which === left);
			right.setActive(which === right);
		};
		left.onFocus = () => activate(left);
		right.onFocus = () => activate(right);
		this.input.keyboard?.on('keydown-TAB', (e: KeyboardEvent) => {
			e.preventDefault();
			activate(left.active ? right : left);
		});
		const hint = this.add
			.text(0, 0, t('hero.hint'), text(8, PALETTE.textDim))
			.setOrigin(0.5, 0);
		refreshInfo();
		setupScreen(this, t('hero.title'), (view, cx) => {
			const colL = Math.round(cx - view.width * 0.22);
			const colR = Math.round(cx + view.width * 0.22);
			portrait.setPosition(colL, 110);
			info.setPosition(colL, 162);
			left.layout(colL, 196);
			potionTitle.setPosition(colR, 70);
			right.layout(colR, 94);
			hint.setPosition(cx, view.height - 30);
		});
	}
}
