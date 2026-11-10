import { type ReactElement, type ReactNode, useState } from 'react';
import type { HeroId } from '../../config/constants';
import { type I18nKey, t } from '../../i18n';
import { useCompact, useUiScale } from '../compact';
import { AtlasIcon } from './AtlasIcon';
import { Btn } from './Btn';
import { HeroSprite } from './HeroSprite';
import { weaponName } from './Hud';
import { AdjustRow, BackBtn, MenuScreen } from './MenuScreen';
import { Ornament } from './Ornament';
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

/** Gold section title with a diamond and the filet, no box. */
function Block(props: { title: ReactNode; children: ReactNode }): ReactElement {
	return (
		<section className="flex min-w-0 flex-col gap-1">
			<h3 className="m-0 flex items-center gap-2 text-section font-black tracking-section text-gold-bright uppercase">
				<Ornament kind="diamond" size={10} />
				{props.title}
			</h3>
			<Filet />
			{props.children}
		</section>
	);
}

type Tab = 'hero' | 'potions' | 'weapons';

/** Persistent progression hub: level, the passive tree entry, potions and gambits, weapon unlocks. */
export function HeroScreen({
	data,
	actions,
}: {
	data: HeroScreenData;
	actions: HeroScreenActions;
}): ReactElement {
	const [tab, setTab] = useState<Tab>('hero');
	const compact = useCompact();
	const uiScale = useUiScale();
	const i = data.heroes.indexOf(data.hero);
	const other = (d: number): HeroId =>
		data.heroes[(i + d + data.heroes.length) % data.heroes.length] ?? data.hero;
	const heroName = label(`hero.${data.hero}`);
	const slotPx = Math.max(56, Math.round(88 * uiScale));
	const hasWeapons = data.weaponUnlocks.length > 0;

	const progress = (
		<>
			<AdjustRow
				label={`${heroName} · ${t('select.level', { n: data.level })}`}
				onPrev={() => actions.selectHero(other(-1))}
				onNext={() => actions.selectHero(other(1))}
				disabled={data.heroes.length < 2}
			/>
			<div className="text-center text-secondary font-bold">
				{t('hero.xp', { xp: Math.floor(data.xp), next: data.xpNext })}
			</div>
			<Bar percent={data.xpNext > 0 ? (data.xp / data.xpNext) * 100 : 0} />
		</>
	);

	const treeEntry = (
		<>
			<Btn onActivate={actions.openTree} variant="primary">
				{t('tree.open', { n: data.treePoints })}
			</Btn>
			{!compact && <Hint>{t('tree.openHint')}</Hint>}
		</>
	);

	const gambits = (
		<div className="flex justify-center gap-4">
			{data.gambits.map((g, slot) => {
				const text = t('hero.gambit', {
					n: slot + 1,
					potion: g.potion ? label(`potion.${g.potion}`) : none(),
					condition: g.condition ? label(`cond.${g.condition}`) : none(),
				});
				return (
					// Slots are a fixed list of 3, so the position is the identity.
					// biome-ignore lint/suspicious/noArrayIndexKey: fixed-size slot list
					<div key={slot} className="flex flex-col items-center gap-0.5">
						<Btn
							onActivate={() => actions.cycleGambitPotion(slot, 1)}
							label={text}
							className="rounded-full bg-panel-top pr-0! pl-0! shadow-inset"
						>
							<span
								className="flex items-center justify-center"
								style={{ width: slotPx, height: slotPx }}
							>
								{g.potion ? (
									<AtlasIcon
										frames={[`icon.potion.${g.potion}`]}
										size={slotPx * 0.6}
										fallback={
											<span className="text-secondary">
												{label(`potion.${g.potion}`)}
											</span>
										}
									/>
								) : (
									<span className="font-title text-title text-text-dim">+</span>
								)}
							</span>
						</Btn>
						<span className="text-secondary font-bold">
							{g.potion ? label(`potion.${g.potion}`) : none()}
						</span>
						<Btn
							onActivate={() => actions.cycleGambitCondition(slot)}
							label={t('hero.condition')}
							className="pr-2! pl-2!"
						>
							<span className="text-secondary text-ice">
								{g.condition ? label(`cond.${g.condition}`) : none()} ⟳
							</span>
						</Btn>
					</div>
				);
			})}
		</div>
	);

	const potions = (
		<>
			{data.potions.map((p) => (
				<Btn
					key={p.type}
					onActivate={() => actions.buyPotion(p.type)}
					disabled={data.pearls < p.price}
					className="w-full justify-start text-left"
				>
					<AtlasIcon frames={[`icon.potion.${p.type}`]} size={40} />
					<span className="text-left">
						{t('hero.buy', {
							name: label(`potion.${p.type}`),
							owned: p.owned,
							price: p.price,
						})}
					</span>
				</Btn>
			))}
			{!compact && <Hint>{t('hero.gambitHint')}</Hint>}
		</>
	);

	const weapons = (
		<>
			{data.weaponUnlocks.map((u) => (
				<Btn
					key={u.weapon}
					onActivate={() => actions.buyWeapon(u.weapon)}
					disabled={data.pearls < u.cost}
					className="w-full justify-start text-left"
				>
					{t('workshop.weaponRow', { name: weaponName(u.weapon), price: u.cost })}
				</Btn>
			))}
		</>
	);

	const potionsTitle = t('hero.potions', { pearls: data.pearls });
	const tabs: { id: Tab; label: string }[] = [
		{ id: 'hero', label: heroName },
		{ id: 'potions', label: potionsTitle },
		...(hasWeapons
			? [{ id: 'weapons' as const, label: t('workshop.weapons', { hero: heroName }) }]
			: []),
	];

	return (
		<MenuScreen
			title={t('hero.title')}
			onBack={actions.back}
			wide
			footer={<BackBtn onBack={actions.back} label={t('menu.back')} />}
		>
			{compact ? (
				<>
					<div className="flex flex-wrap gap-x-4">
						{tabs.map((x) => (
							<Btn key={x.id} onActivate={() => setTab(x.id)} className="pr-6! pl-0!">
								<span
									className={`text-body ${tab === x.id ? 'text-gold-bright' : ''}`}
								>
									{x.label}
								</span>
							</Btn>
						))}
					</div>
					{tab === 'hero' && (
						<div className="grid grid-cols-2 gap-3">
							<div className="flex flex-col gap-1">
								{progress}
								{treeEntry}
							</div>
							{gambits}
						</div>
					)}
					{tab === 'potions' && <div className="flex flex-col">{potions}</div>}
					{tab === 'weapons' && <div className="flex flex-col">{weapons}</div>}
				</>
			) : (
				<div className="grid w-full flex-1 grid-cols-[1.1fr_1fr_1.3fr] gap-[2vw]">
					<div className="flex min-w-0 flex-col gap-2">
						{treeEntry}
						{hasWeapons && (
							<Block title={t('workshop.weapons', { hero: heroName })}>
								{weapons}
							</Block>
						)}
					</div>
					<div className="flex min-w-0 flex-col items-center gap-2">
						{progress}
						<HeroSprite
							hero={data.hero}
							scale={Math.max(1, Math.round(3 * uiScale))}
							title={heroName}
						/>
						{gambits}
					</div>
					<Block title={potionsTitle}>{potions}</Block>
				</div>
			)}
		</MenuScreen>
	);
}
