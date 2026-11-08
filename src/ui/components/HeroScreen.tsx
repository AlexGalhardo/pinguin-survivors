import { type ReactElement, useState } from 'react';
import type { HeroId } from '../../config/constants';
import { type I18nKey, t } from '../../i18n';
import { AtlasIcon } from './AtlasIcon';
import { Btn } from './Btn';
import { weaponName } from './Hud';
import { AdjustRow, MenuScreen } from './MenuScreen';

export interface HeroScreenData {
	/** Unlocked heroes the player can switch between. */
	heroes: readonly HeroId[];
	hero: HeroId;
	level: number;
	xp: number;
	xpNext: number;
	/** Free stat points. */
	points: number;
	/** Stat rows already formatted: `value` is the current total, `step` what one point adds. */
	stats: readonly { key: string; value: string; step: string }[];
	pearls: number;
	potions: readonly { type: string; owned: number; price: number }[];
	/** The 3 gambit slots; null = empty. */
	gambits: readonly { potion: string | null; condition: string | null }[];
	/** Starting weapons for sale to the selected hero; empty hides the section (demo, all owned). */
	weaponUnlocks: readonly { weapon: string; cost: number }[];
	/** Workshop upgrades; `cost` is null at max level, `bonus` already formatted. */
	upgrades: readonly {
		id: string;
		level: number;
		max: number;
		bonus: string;
		cost: number | null;
	}[];
}

export interface HeroScreenActions {
	selectHero: (hero: HeroId) => void;
	spendPoint: (statKey: string) => void;
	buyPotion: (type: string) => void;
	/** Cycles the potion of a gambit slot (-1 / +1). */
	cycleGambitPotion: (slot: number, dir: -1 | 1) => void;
	cycleGambitCondition: (slot: number) => void;
	buyUpgrade: (id: string) => void;
	buyWeapon: (weapon: string) => void;
	back: () => void;
}

const none = (): string => t('hero.none');
const label = (key: string): string => t(key as I18nKey);

/** Persistent progression hub: stat points, potions and gambits, and the Workshop (Pearls). */
export function HeroScreen({
	data,
	actions,
}: {
	data: HeroScreenData;
	actions: HeroScreenActions;
}): ReactElement {
	const [tab, setTab] = useState<'hero' | 'workshop'>('hero');
	const i = data.heroes.indexOf(data.hero);
	const other = (d: number): HeroId =>
		data.heroes[(i + d + data.heroes.length) % data.heroes.length] ?? data.hero;

	return (
		<MenuScreen
			title={t(tab === 'hero' ? 'hero.title' : 'workshop.title')}
			onBack={actions.back}
			wide
		>
			<div className="flex gap-2">
				<Btn
					onActivate={() => setTab('hero')}
					className={tab === 'hero' ? 'border-crit text-crit' : 'border-snow'}
				>
					{t('menu.hero')}
				</Btn>
				<Btn
					onActivate={() => setTab('workshop')}
					className={tab === 'workshop' ? 'border-crit text-crit' : 'border-snow'}
				>
					{t('menu.workshop')}
				</Btn>
			</div>

			{tab === 'hero' ? (
				<div className="grid w-full grid-cols-2 gap-[3vw]">
					<section className="flex flex-col gap-2">
						<AdjustRow
							label={`${label(`hero.${data.hero}`)} · ${t('select.level', { n: data.level })} · ${t('hero.xp', { xp: Math.floor(data.xp), next: data.xpNext })}`}
							onPrev={() => actions.selectHero(other(-1))}
							onNext={() => actions.selectHero(other(1))}
							disabled={data.heroes.length < 2}
						/>
						<div className="text-center font-bold text-crit">
							{t('hero.points', { n: data.points })}
						</div>
						{data.stats.map((s) => (
							<Btn
								key={s.key}
								onActivate={() => actions.spendPoint(s.key)}
								disabled={data.points <= 0}
								className="border-snow text-left font-normal"
							>
								{t('hero.stat', {
									name: label(`stat.${s.key}`),
									value: s.value,
									step: s.step,
								})}
							</Btn>
						))}
					</section>
					<section className="flex flex-col gap-2">
						<div className="text-center font-bold text-fish">
							{t('hero.potions', { pearls: data.pearls })}
						</div>
						{data.potions.map((p) => (
							<Btn
								key={p.type}
								onActivate={() => actions.buyPotion(p.type)}
								disabled={data.pearls < p.price}
								className="border-fish text-left font-normal"
							>
								{t('hero.buy', {
									name: label(`potion.${p.type}`),
									owned: p.owned,
									price: p.price,
								})}
							</Btn>
						))}
						{data.gambits.map((g, slot) => (
							// Slots are a fixed list of 3, so the position is the identity.
							// biome-ignore lint/suspicious/noArrayIndexKey: fixed-size slot list
							<div key={slot} className="flex items-center gap-2">
								<Btn
									onActivate={() => actions.cycleGambitPotion(slot, 1)}
									className="flex-1 border-snow text-left font-normal"
								>
									{t('hero.gambit', {
										n: slot + 1,
										potion: g.potion ? label(`potion.${g.potion}`) : none(),
										condition: g.condition
											? label(`cond.${g.condition}`)
											: none(),
									})}
								</Btn>
								<Btn
									onActivate={() => actions.cycleGambitCondition(slot)}
									className="border-ice text-ice"
									label={t('hero.condition')}
								>
									⟳
								</Btn>
							</div>
						))}
					</section>
				</div>
			) : (
				<div className="flex w-full max-w-[44rem] flex-col gap-2">
					<div className="flex items-center justify-center gap-2 font-bold text-fish">
						<AtlasIcon frames={['icon.currency.pearl']} size={32} />
						{t('workshop.fish', { pearls: data.pearls })}
					</div>
					{data.upgrades.map((u) => (
						<Btn
							key={u.id}
							onActivate={() => actions.buyUpgrade(u.id)}
							disabled={u.cost === null || data.pearls < u.cost}
							className="border-snow text-left font-normal"
						>
							{t('workshop.row', {
								name: label(`upgrade.${u.id}`),
								level: u.level,
								max: u.max,
								bonus: u.bonus,
								price:
									u.cost === null
										? t('workshop.maxed')
										: t('workshop.price', { n: u.cost }),
							})}
						</Btn>
					))}
				</div>
			)}
			{tab === 'workshop' && data.weaponUnlocks.length > 0 && (
				<div className="flex w-full max-w-[44rem] flex-col gap-2">
					<div className="text-center font-bold text-fish">
						{t('workshop.weapons', { hero: t(`hero.${data.hero}` as I18nKey) })}
					</div>
					{data.weaponUnlocks.map((u) => (
						<Btn
							key={u.weapon}
							onActivate={() => actions.buyWeapon(u.weapon)}
							disabled={data.pearls < u.cost}
							className="border-snow text-left font-normal"
						>
							{t('workshop.weaponRow', { name: weaponName(u.weapon), price: u.cost })}
						</Btn>
					))}
				</div>
			)}
			<Btn onActivate={actions.back} className="border-snow">
				{t('menu.back')}
			</Btn>
		</MenuScreen>
	);
}
