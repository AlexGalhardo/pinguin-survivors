import type { ReactElement } from 'react';
import type { HeroId } from '../../config/constants';
import { type I18nKey, t } from '../../i18n';
import { AtlasIcon } from './AtlasIcon';
import { Btn } from './Btn';
import { weaponName } from './Hud';
import { AdjustRow, BackBtn, MenuScreen } from './MenuScreen';
import { Bar, Filet, Hint } from './Panel';

export interface HeroScreenData {
	/** Unlocked heroes the player can switch between. */
	heroes: readonly HeroId[];
	hero: HeroId;
	level: number;
	xp: number;
	xpNext: number;
	/** Unspent passive tree points (ADR-019). */
	treePoints: number;
	pearls: number;
	potions: readonly { type: string; owned: number; price: number }[];
	/** The 3 gambit slots; null = empty. */
	gambits: readonly { potion: string | null; condition: string | null }[];
	/** Starting weapons for sale to the selected hero; empty hides the section (demo, all owned). */
	weaponUnlocks: readonly { weapon: string; cost: number }[];
}

export interface HeroScreenActions {
	selectHero: (hero: HeroId) => void;
	openTree: () => void;
	buyPotion: (type: string) => void;
	/** Cycles the potion of a gambit slot (-1 / +1). */
	cycleGambitPotion: (slot: number, dir: -1 | 1) => void;
	cycleGambitCondition: (slot: number) => void;
	buyWeapon: (weapon: string) => void;
	back: () => void;
}

const none = (): string => t('hero.none');
const label = (key: string): string => t(key as I18nKey);

/** Persistent progression hub: level, the passive tree entry, potions and gambits, weapon unlocks. */
export function HeroScreen({
	data,
	actions,
}: {
	data: HeroScreenData;
	actions: HeroScreenActions;
}): ReactElement {
	const i = data.heroes.indexOf(data.hero);
	const other = (d: number): HeroId =>
		data.heroes[(i + d + data.heroes.length) % data.heroes.length] ?? data.hero;

	return (
		<MenuScreen
			title={t('hero.title')}
			onBack={actions.back}
			wide
			subtitle={t('hero.desc')}
			footer={<BackBtn onBack={actions.back} label={t('menu.back')} />}
		>
			<div className="grid w-full grid-cols-1 gap-[2vw] min-[1000px]:grid-cols-2">
				<section className="flex flex-col gap-2">
					<AdjustRow
						label={`${label(`hero.${data.hero}`)} · ${t('select.level', { n: data.level })} · ${t('hero.xp', { xp: Math.floor(data.xp), next: data.xpNext })}`}
						onPrev={() => actions.selectHero(other(-1))}
						onNext={() => actions.selectHero(other(1))}
						disabled={data.heroes.length < 2}
					/>
					<Bar percent={data.xpNext > 0 ? (data.xp / data.xpNext) * 100 : 0} />
					<Btn onActivate={actions.openTree} variant="primary">
						{t('tree.open', { n: data.treePoints })}
					</Btn>
					<Hint>{t('tree.openHint')}</Hint>
					{data.weaponUnlocks.length > 0 && (
						<>
							<Filet className="mt-2" />
							<div className="flex items-center justify-center gap-2 font-bold text-fish">
								<AtlasIcon frames={['icon.currency.pearl']} size={32} />
								{t('workshop.weapons', { hero: t(`hero.${data.hero}` as I18nKey) })}
							</div>
							{data.weaponUnlocks.map((u) => (
								<Btn
									key={u.weapon}
									onActivate={() => actions.buyWeapon(u.weapon)}
									disabled={data.pearls < u.cost}
									className="border-snow text-left font-normal"
								>
									{t('workshop.weaponRow', {
										name: weaponName(u.weapon),
										price: u.cost,
									})}
								</Btn>
							))}
						</>
					)}
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
					<Hint>{t('hero.gambitHint')}</Hint>
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
									condition: g.condition ? label(`cond.${g.condition}`) : none(),
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
		</MenuScreen>
	);
}
