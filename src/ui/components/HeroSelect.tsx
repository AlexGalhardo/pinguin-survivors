import { type ReactElement, type ReactNode, useState } from 'react';
import type { HeroId } from '../../config/constants';
import type { Danger } from '../../data/difficulty';
import { DANGER } from '../../data/difficulty';
import { HEROES } from '../../data/heroes';
import { SUPER, SUPERPOWERS } from '../../data/superpowers';
import type { WeaponId } from '../../data/weapons';
import { type I18nKey, t } from '../../i18n';
import { resolveWeapon } from '../../logic/weapons';
import { useMedia } from '../compact';
import { AtlasIcon, weaponFrames } from './AtlasIcon';
import { Btn } from './Btn';
import { HeroSprite } from './HeroSprite';
import { weaponName } from './Hud';
import { AdjustRow, BackBtn, MenuScreen } from './MenuScreen';
import { Filet, Hint, StatRow } from './Panel';

export interface HeroSelectHero {
	id: HeroId;
	unlocked: boolean;
	/** Not playable in the demo build: shows "available in the full game". */
	demoLocked?: boolean;
	level: number;
	bestRound: number;
	/** Highest Danger the hero can pick (`maxSelectableDanger`). */
	maxDanger: Danger;
	/** Best round per Danger 0..5 (`save.bestRoundByDanger[hero]`). */
	bestByDanger: readonly number[];
	/** Starting weapons the player can pick (`HeroDef.startingWeapons` plus Pearl unlocks). */
	weapons: readonly string[];
}

export interface HeroSelectData {
	heroes: readonly HeroSelectHero[];
}

export interface StartRunRequest {
	hero: HeroId;
	danger: Danger;
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
const bonus = (mul: number): { text: string; tone: string } => {
	const n = Math.round((mul - 1) * 100);
	return {
		text: `${n > 0 ? '+' : ''}${n}%`,
		tone: n > 0 ? 'text-xp' : n < 0 ? 'text-blood' : 'text-text-light',
	};
};

/** One block of the hero sheet: gold title, filet, content. */
function Section(props: { title: string; children: ReactNode }): ReactElement {
	return (
		<section className="flex min-w-0 flex-col gap-1.5 border border-snow-dark bg-night/60 p-3">
			<h3 className="m-0 font-title text-[0.95em] font-bold tracking-wider text-crit uppercase">
				{props.title}
			</h3>
			<Filet />
			{props.children}
		</section>
	);
}

/** Base stats and the superpower of a hero (data/heroes, data/superpowers). */
function HeroSheet({ hero }: { hero: HeroId }): ReactElement {
	const def = HEROES[hero];
	const sup = SUPERPOWERS[hero];
	const row = (key: I18nKey, value: string, accent?: string): ReactElement => (
		<StatRow
			key={key}
			label={<span className="capitalize">{t(key)}</span>}
			value={value}
			accent={accent}
		/>
	);
	const tags = (['melee', 'firearm', 'magic'] as const).map((tag) => {
		const b = bonus(def.tagMul[tag]);
		return row(`gstat.tagMul.${tag}` as I18nKey, b.text, b.tone);
	});
	return (
		<>
			<Section title={t('select.sheet.stats')}>
				<div className="grid grid-cols-1 gap-x-6 gap-y-1 min-[1500px]:grid-cols-2">
					{row('gstat.maxHp', String(def.hp))}
					{row('gstat.regen', `${def.regen}/s`)}
					{row('gstat.armor', String(def.armor))}
					{row('gstat.moveSpeed', String(def.moveSpeed))}
					{row('gstat.crit', pct(def.crit))}
					{row('gstat.critDamage', pct(def.critDamage))}
					{row('gstat.dodge', pct(def.dodge))}
					{row('gstat.parry', pct(def.parry))}
					{tags}
					{(['fire', 'earth', 'ice', 'energy'] as const).map((el) =>
						row(`gstat.resist.${el}` as I18nKey, pct(def.resist[el])),
					)}
				</div>
			</Section>
			<Section title={`${t('select.sheet.super')}: ${t(`super.${sup.id}.name` as I18nKey)}`}>
				<p className="m-0">
					{t(`super.${sup.id}.desc` as I18nKey, {
						duration: sup.duration,
						mul: sup.damageMul,
						n: sup.explosions ?? 0,
					})}
				</p>
				<Hint>{t('select.superUnlock', { n: SUPER.unlockLevel })}</Hint>
			</Section>
		</>
	);
}

/** The picked starting weapon: icon, what it does and its tier I numbers. */
function WeaponSheet({ weapon }: { weapon: string }): ReactElement {
	const w = resolveWeapon({ id: weapon as WeaponId, tier: 1 });
	return (
		<Section title={t('select.sheet.weapon')}>
			<div className="flex items-center gap-3">
				<AtlasIcon frames={weaponFrames(weapon, 1)} size={64} />
				<div className="min-w-0">
					<div className="font-title text-[1.1em] font-bold">{weaponName(weapon)}</div>
					<Hint>{t(`weapon.behavior.${w.behavior}` as I18nKey)}</Hint>
				</div>
			</div>
			<StatRow label={t('weapon.stat.damage')} value={w.damage} />
			<StatRow label={t('weapon.stat.rate')} value={(1 / w.cooldown).toFixed(1)} />
			<StatRow label={t('weapon.stat.range')} value={w.range} />
		</Section>
	);
}

/** What a Danger level changes, as rows. */
function DangerSheet({ danger }: { danger: Danger }): ReactElement {
	const m = DANGER[danger];
	const mul = (v: number): string => `×${v}`;
	const worse = (v: number): string =>
		v > 1 ? 'text-blood' : v < 1 ? 'text-xp' : 'text-text-light';
	return (
		<Section title={t('select.sheet.danger', { n: danger })}>
			<StatRow label={t('select.dm.hp')} value={mul(m.hp)} accent={worse(m.hp)} />
			<StatRow label={t('select.dm.dmg')} value={mul(m.dmg)} accent={worse(m.dmg)} />
			<StatRow label={t('select.dm.speed')} value={mul(m.speed)} accent={worse(m.speed)} />
			<StatRow
				label={t('select.dm.drops')}
				value={mul(m.drops)}
				accent={m.drops > 1 ? 'text-xp' : m.drops < 1 ? 'text-blood' : 'text-text-light'}
			/>
			<StatRow label={t('select.dm.waves')} value={m.extraWaves} />
		</Section>
	);
}

/** Hero, Danger (0..5, capped by what the hero unlocked) and starting weapon, then start. */
export function HeroSelect({
	data,
	actions,
}: {
	data: HeroSelectData;
	actions: HeroSelectActions;
}): ReactElement {
	const [heroId, setHeroId] = useState<HeroId>(data.heroes[0]?.id ?? 'jack');
	const [danger, setDanger] = useState(0);
	const [weaponIndex, setWeaponIndex] = useState(0);
	// Whole-number sprite scale (pixel art): 160 px on tall screens, 80 px otherwise.
	const tall = useMedia('(min-height: 860px)');
	const hero = data.heroes.find((h) => h.id === heroId);
	if (!hero)
		return (
			<MenuScreen title={t('select.title')} onBack={actions.back}>
				{null}
			</MenuScreen>
		);

	const pickHero = (id: HeroId): void => {
		setHeroId(id);
		setDanger(0);
		setWeaponIndex(0);
	};
	const shownDanger = Math.min(danger, hero.maxDanger);
	const weapon = hero.weapons[Math.min(weaponIndex, hero.weapons.length - 1)];
	const step = (value: number, d: -1 | 1, len: number): number => (value + d + len) % len;

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
							actions.start({ hero: hero.id, danger: shownDanger as Danger, weapon })
						}
						disabled={!hero.unlocked || !weapon}
						variant="primary"
						className="min-w-52 text-[1.1em]"
					>
						{t('select.play')}
					</Btn>
					<BackBtn onBack={actions.back} label={t('menu.back')} />
				</>
			}
		>
			<div className="grid w-full grid-cols-3 gap-[1.5vw]">
				{data.heroes.map((h) => {
					const hint = UNLOCK_HINT[h.id];
					const picked = h.id === heroId;
					return (
						<Btn
							key={h.id}
							onActivate={() => pickHero(h.id)}
							className={`flex flex-col items-center justify-center gap-1 border-2 py-2 ${
								picked ? 'border-crit bg-crit/10' : 'border-snow-dark'
							}`}
						>
							<HeroSprite
								hero={h.id}
								scale={tall ? 2 : 1}
								locked={!h.unlocked}
								title={t(`hero.${h.id}` as I18nKey)}
							/>
							<span className="font-title text-[1.4em] tracking-wide">
								{t(`hero.${h.id}` as I18nKey).toUpperCase()}
							</span>
							<span className="text-[0.8em] font-normal text-text-dim">
								{t(`role.${h.id}` as I18nKey)}
							</span>
							<span
								className={`text-[0.85em] ${h.unlocked ? 'text-crit' : 'text-blood'}`}
							>
								{h.unlocked
									? `${t('select.level', { n: h.level })} · ${t('select.best', { n: h.bestRound })}`
									: h.demoLocked
										? t('demo.fullGame')
										: `${t('select.locked')}${hint ? ` · ${t(hint)}` : ''}`}
							</span>
						</Btn>
					);
				})}
			</div>

			<div className="grid min-h-0 w-full flex-1 grid-cols-1 gap-3 min-[1100px]:grid-cols-2">
				<div className="flex min-w-0 flex-col gap-3">
					<HeroSheet hero={hero.id} />
				</div>
				<div className="flex min-w-0 flex-col gap-3">
					<AdjustRow
						label={
							<span className="inline-flex items-center gap-2">
								<AtlasIcon frames={[`icon.danger.${shownDanger}`]} size={32} />
								{`${t('select.danger', { n: shownDanger })} · ${t(
									'select.dangerBest',
									{
										n: hero.bestByDanger[shownDanger] ?? 0,
									},
								)}`}
							</span>
						}
						hint={t('select.hintDanger')}
						onPrev={() => setDanger(step(shownDanger, -1, hero.maxDanger + 1))}
						onNext={() => setDanger(step(shownDanger, 1, hero.maxDanger + 1))}
						disabled={!hero.unlocked}
					/>
					<DangerSheet danger={shownDanger as Danger} />
					{weapon && (
						<>
							<AdjustRow
								label={t('select.weapon', { name: weaponName(weapon) })}
								hint={t('select.hintWeapon')}
								onPrev={() =>
									setWeaponIndex(step(weaponIndex, -1, hero.weapons.length))
								}
								onNext={() =>
									setWeaponIndex(step(weaponIndex, 1, hero.weapons.length))
								}
								disabled={!hero.unlocked}
							/>
							<WeaponSheet weapon={weapon} />
						</>
					)}
				</div>
			</div>
		</MenuScreen>
	);
}
