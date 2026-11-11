import { type ReactElement, type ReactNode, useState } from 'react';
import type { HeroId } from '../../config/constants';
import type { Difficulty } from '../../data/difficulty';
import { DIFFICULTY } from '../../data/difficulty';
import { HEROES } from '../../data/heroes';
import { SUPER, SUPERPOWERS } from '../../data/superpowers';
import type { WeaponId } from '../../data/weapons';
import { type I18nKey, t } from '../../i18n';
import { resolveWeapon } from '../../logic/weapons';
import { useCompact, useUiScale } from '../compact';
import { AtlasIcon, weaponFrames } from './AtlasIcon';
import { Btn } from './Btn';
import { HeroSprite } from './HeroSprite';
import { weaponName } from './Hud';
import { StatLine } from './ItemViews';
import { AdjustRow, BackBtn, MenuScreen } from './MenuScreen';
import { Ornament } from './Ornament';
import { Filet, Hint, StatRow } from './Panel';

export interface HeroSelectHero {
	id: HeroId;
	unlocked: boolean;
	/** Not playable in the demo build: shows "available in the full game". */
	demoLocked?: boolean;
	level: number;
	bestRound: number;
	/** Highest Difficulty the hero can pick (`maxSelectableDifficulty`). */
	maxDifficulty: Difficulty;
	/** Best round per Difficulty 0..5 (`save.bestRoundByDifficulty[hero]`). */
	bestByDifficulty: readonly number[];
	/** Starting weapons the player can pick (`HeroDef.startingWeapons` plus Pearl unlocks). */
	weapons: readonly string[];
}

export interface HeroSelectData {
	heroes: readonly HeroSelectHero[];
}

export interface StartRunRequest {
	hero: HeroId;
	difficulty: Difficulty;
	weapon: string;
}

export interface HeroSelectActions {
	start: (request: StartRunRequest) => void;
	back: () => void;
}

const UNLOCK_HINT: Record<HeroId, I18nKey | null> = {
	jack: null,
	bob: 'select.unlockBob',
	lucia: 'select.unlockLucia',
};

const pct = (v: number): string => `${Math.round(v * 100)}%`;
// Adverse changes use crit (orange): blood is reserved for bold text of 24 px or more.
const bonus = (mul: number): { text: string; tone: string } => {
	const n = Math.round((mul - 1) * 100);
	return {
		text: `${n > 0 ? '+' : ''}${n}%`,
		tone: n > 0 ? 'text-xp' : n < 0 ? 'text-crit' : 'text-text-light',
	};
};

/** One block of the screen: gold title with a diamond, filet, content. No box. */
function Section(props: { title: string; children: ReactNode; bare?: boolean }): ReactElement {
	return (
		<section className="flex min-w-0 flex-col gap-1">
			{!props.bare && (
				<>
					<h3 className="m-0 flex items-center gap-2 text-section font-black tracking-section text-gold-bright uppercase">
						<Ornament kind="diamond" size={10} />
						{props.title}
					</h3>
					<Filet />
				</>
			)}
			{props.children}
		</section>
	);
}

/** Base stats of a hero (data/heroes), in compact pairs. */
function StatsSection({ hero, bare }: { hero: HeroId; bare?: boolean }): ReactElement {
	const def = HEROES[hero];
	const row = (stat: string, value: string, accent?: string): ReactElement => (
		<StatLine key={stat} stat={stat} value={value} accent={accent} icon={!bare} />
	);
	const tags = (['melee', 'firearm', 'magic'] as const).map((tag) => {
		const b = bonus(def.tagMul[tag]);
		return row(`tagMul.${tag}`, b.text, b.tone);
	});
	return (
		<Section title={t('select.sheet.stats')} bare={bare}>
			{/* Desktop: one column, so no label wraps or truncates in any language; the phone keeps pairs. */}
			<div className={bare ? 'grid grid-cols-2 gap-x-6' : 'flex flex-col gap-0.5'}>
				{row('maxHp', String(def.hp))}
				{row('regen', `${def.regen}/s`)}
				{row('armor', String(def.armor))}
				{row('moveSpeed', String(def.moveSpeed))}
				{row('crit', pct(def.crit))}
				{row('critDamage', pct(def.critDamage))}
				{row('dodge', pct(def.dodge))}
				{row('parry', pct(def.parry))}
				{tags}
				{(['fire', 'earth', 'ice', 'energy'] as const).map((el) =>
					row(`resist.${el}`, pct(def.resist[el])),
				)}
			</div>
		</Section>
	);
}

/** Superpower of a hero (data/superpowers). */
function SuperSection({ hero }: { hero: HeroId }): ReactElement {
	const sup = SUPERPOWERS[hero];
	return (
		<Section title={`${t('select.sheet.super')}: ${t(`super.${sup.id}.name` as I18nKey)}`}>
			<p className="m-0 text-body">
				{t(`super.${sup.id}.desc` as I18nKey, {
					duration: sup.duration,
					mul: sup.damageMul,
					n: sup.explosions ?? 0,
				})}
			</p>
			<Hint>{t('select.superUnlock', { n: SUPER.unlockLevel })}</Hint>
		</Section>
	);
}

/** The picked starting weapon: icon, what it does and its tier I numbers. */
function WeaponSection({ weapon, bare }: { weapon: string; bare?: boolean }): ReactElement {
	const w = resolveWeapon({ id: weapon as WeaponId, tier: 1 });
	return (
		<Section title={t('select.sheet.weapon')} bare={bare}>
			<div className="flex items-center gap-3">
				<AtlasIcon frames={weaponFrames(weapon, 1)} size={64} />
				<div className="min-w-0">
					{/* Desktop: the name is already the row above. */}
					{!bare && (
						<div className="font-title text-item font-bold">{weaponName(weapon)}</div>
					)}
					<Hint>{t(`weapon.behavior.${w.behavior}` as I18nKey)}</Hint>
				</div>
			</div>
			<div className="flex flex-wrap gap-x-6">
				<StatRow label={t('weapon.stat.damage')} value={w.damage} />
				<StatRow label={t('weapon.stat.rate')} value={(1 / w.cooldown).toFixed(1)} />
				<StatRow label={t('weapon.stat.range')} value={w.range} />
			</div>
		</Section>
	);
}

/** Atlas frames reused from the old Danger icons (Easy, Normal, Hard). */
const DIFFICULTY_ICON = { 0: 0, 1: 2, 2: 5 } as const;

/** What a Difficulty level changes. */
function DifficultySection({
	difficulty,
	bare,
}: {
	difficulty: Difficulty;
	bare?: boolean;
}): ReactElement {
	const m = DIFFICULTY[difficulty];
	const mul = (v: number): string => `×${v}`;
	const worse = (v: number): string =>
		v > 1 ? 'text-crit' : v < 1 ? 'text-xp' : 'text-text-light';
	return (
		<Section title={t('select.sheet.difficulty')} bare={bare}>
			<div className="grid grid-cols-2 gap-x-6">
				<StatRow label={t('select.dm.hp')} value={mul(m.hp)} accent={worse(m.hp)} />
				<StatRow label={t('select.dm.dmg')} value={mul(m.dmg)} accent={worse(m.dmg)} />
			</div>
		</Section>
	);
}

type SheetTab = 'stats' | 'super' | 'weapon';
const SHEET_TABS: readonly { id: SheetTab; label: I18nKey }[] = [
	{ id: 'stats', label: 'select.sheet.stats' },
	{ id: 'super', label: 'select.sheet.super' },
	{ id: 'weapon', label: 'select.sheet.weapon' },
];

/** Hero, Difficulty (0..5, capped by what the hero unlocked) and starting weapon, then start. */
export function HeroSelect({
	data,
	actions,
}: {
	data: HeroSelectData;
	actions: HeroSelectActions;
}): ReactElement {
	const [heroId, setHeroId] = useState<HeroId>(data.heroes[0]?.id ?? 'jack');
	const [difficulty, setDifficulty] = useState(1);
	const [weaponIndex, setWeaponIndex] = useState(0);
	const [tab, setTab] = useState<SheetTab>('stats');
	const compact = useCompact();
	const uiScale = useUiScale();
	const hero = data.heroes.find((h) => h.id === heroId);
	if (!hero)
		return (
			<MenuScreen title={t('select.title')} onBack={actions.back}>
				{null}
			</MenuScreen>
		);

	const pickHero = (id: HeroId): void => {
		setHeroId(id);
		setDifficulty(1);
		setWeaponIndex(0);
	};
	const shownDifficulty = Math.min(difficulty, hero.maxDifficulty);
	const weapon = hero.weapons[Math.min(weaponIndex, hero.weapons.length - 1)];
	const step = (value: number, d: -1 | 1, len: number): number => (value + d + len) % len;
	// Whole-number sprite scale (pixel art): 320 px at 1080p, 80 px on the phone.
	const sprite = compact ? 1 : Math.max(1, Math.round(4 * uiScale));

	const tabs = (
		<div className="flex w-full justify-center gap-[3vw]">
			{data.heroes.map((h) => {
				const hint = UNLOCK_HINT[h.id];
				const picked = h.id === heroId;
				return (
					<div key={h.id} className="flex flex-col items-center">
						<Btn onActivate={() => pickHero(h.id)}>
							<span
								className={`font-title text-list font-bold tracking-wide ${
									picked ? 'text-gold-bright' : h.unlocked ? '' : 'text-text-dim'
								}`}
							>
								{t(`hero.${h.id}` as I18nKey).toUpperCase()}
							</span>
						</Btn>
						{!h.unlocked && !compact && (
							<span className="text-secondary text-text-light">
								{h.demoLocked
									? t('demo.fullGame')
									: `${t('select.locked')}${hint ? ` · ${t(hint)}` : ''}`}
							</span>
						)}
					</div>
				);
			})}
		</div>
	);

	// Phone: both choices as one-line rows beside the portrait.
	const picker = (
		<>
			<AdjustRow
				label={
					<span className="inline-flex items-center gap-2">
						<AtlasIcon
							frames={[
								`icon.danger.${DIFFICULTY_ICON[shownDifficulty as Difficulty]}`,
							]}
							size={32}
						/>
						{`${t('select.difficulty', { name: t(`difficulty.${shownDifficulty}` as I18nKey) })} · ${t(
							'select.difficultyBest',
							{
								n: hero.bestByDifficulty[shownDifficulty] ?? 0,
							},
						)}`}
					</span>
				}
				onPrev={() => setDifficulty(step(shownDifficulty, -1, hero.maxDifficulty + 1))}
				onNext={() => setDifficulty(step(shownDifficulty, 1, hero.maxDifficulty + 1))}
				disabled={!hero.unlocked}
			/>
			{weapon && (
				<AdjustRow
					label={t('select.weapon', { name: weaponName(weapon) })}
					onPrev={() => setWeaponIndex(step(weaponIndex, -1, hero.weapons.length))}
					onNext={() => setWeaponIndex(step(weaponIndex, 1, hero.weapons.length))}
					disabled={!hero.unlocked}
				/>
			)}
		</>
	);

	const portrait = (
		<HeroSprite
			hero={hero.id}
			scale={sprite}
			locked={!hero.unlocked}
			title={t(`hero.${hero.id}` as I18nKey)}
		/>
	);

	return (
		<MenuScreen
			title={t('select.title')}
			onBack={actions.back}
			wide
			subtitle={t('select.hint')}
			footer={
				<>
					<Btn
						onActivate={() =>
							weapon &&
							actions.start({
								hero: hero.id,
								difficulty: shownDifficulty as Difficulty,
								weapon,
							})
						}
						disabled={!hero.unlocked || !weapon}
						variant="primary"
						className="min-w-52 text-cta"
					>
						{t('select.play')}
					</Btn>
					<BackBtn onBack={actions.back} label={t('menu.back')} />
				</>
			}
		>
			{tabs}
			{compact ? (
				<div className="flex min-h-0 w-full flex-1 gap-3">
					<div className="flex min-w-0 flex-1 flex-col gap-1">
						<div className="flex gap-4">
							{SHEET_TABS.map((x) => (
								<Btn
									key={x.id}
									onActivate={() => setTab(x.id)}
									className="pr-0! pl-0!"
								>
									<span
										className={`whitespace-nowrap ${tab === x.id ? 'text-gold-bright' : ''}`}
									>
										{t(x.label)}
									</span>
								</Btn>
							))}
						</div>
						{tab === 'stats' && <StatsSection hero={hero.id} bare />}
						{tab === 'super' && <SuperSection hero={hero.id} />}
						{tab === 'weapon' && weapon && <WeaponSection weapon={weapon} />}
					</div>
					<div className="flex w-[19rem] shrink-0 flex-col items-center gap-1 [&_.text-list]:text-body [&_.text-list]:tracking-normal">
						{portrait}
						{picker}
					</div>
				</div>
			) : (
				<div className="grid min-h-0 w-full flex-1 grid-cols-[1fr_minmax(0,1.15fr)_1.15fr] gap-[2vw]">
					<div className="flex min-w-0 flex-col gap-3">
						<StatsSection hero={hero.id} />
					</div>
					<div className="flex min-w-0 flex-col items-center gap-1">
						{portrait}
						{hero.unlocked && (
							<>
								<span className="text-body font-bold">
									{t(`role.${hero.id}` as I18nKey)}
								</span>
								<span className="text-body font-bold text-crit">
									{`${t('select.level', { n: hero.level })} · ${t('select.best', { n: hero.bestRound })}`}
								</span>
							</>
						)}
						<div className="mt-3 w-full">
							<SuperSection hero={hero.id} />
						</div>
					</div>
					{/* Each choice sits under its own title with what it changes, so no label needs two lines. */}
					<div className="flex min-w-0 flex-col gap-3">
						<Section title={t('select.sheet.difficulty')}>
							<div data-pick="difficulty">
								<AdjustRow
									label={
										<span className="inline-flex items-center gap-2">
											<AtlasIcon
												frames={[
													`icon.danger.${DIFFICULTY_ICON[shownDifficulty as Difficulty]}`,
												]}
												size={32}
											/>
											{t(`difficulty.${shownDifficulty}` as I18nKey)}
										</span>
									}
									hint={t('select.difficultyBest', {
										n: hero.bestByDifficulty[shownDifficulty] ?? 0,
									})}
									onPrev={() =>
										setDifficulty(
											step(shownDifficulty, -1, hero.maxDifficulty + 1),
										)
									}
									onNext={() =>
										setDifficulty(
											step(shownDifficulty, 1, hero.maxDifficulty + 1),
										)
									}
									disabled={!hero.unlocked}
								/>
							</div>
							<DifficultySection difficulty={shownDifficulty as Difficulty} bare />
						</Section>
						{weapon && (
							<Section title={t('select.sheet.weapon')}>
								<div data-pick="weapon">
									<AdjustRow
										label={weaponName(weapon)}
										onPrev={() =>
											setWeaponIndex(
												step(weaponIndex, -1, hero.weapons.length),
											)
										}
										onNext={() =>
											setWeaponIndex(
												step(weaponIndex, 1, hero.weapons.length),
											)
										}
										disabled={!hero.unlocked}
									/>
								</div>
								<WeaponSection weapon={weapon} bare />
							</Section>
						)}
					</div>
				</div>
			)}
		</MenuScreen>
	);
}
