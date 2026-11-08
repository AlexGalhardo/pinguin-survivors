import { type ReactElement, useState } from 'react';
import type { HeroId } from '../../config/constants';
import type { Danger } from '../../data/difficulty';
import { type I18nKey, t } from '../../i18n';
import { Btn } from './Btn';
import { weaponName } from './Hud';
import { AdjustRow, MenuScreen } from './MenuScreen';

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
		<MenuScreen title={t('select.title')} onBack={actions.back} wide>
			<div className="grid w-full grid-cols-3 gap-[1.5vw]">
				{data.heroes.map((h) => {
					const hint = UNLOCK_HINT[h.id];
					return (
						<Btn
							key={h.id}
							onActivate={() => pickHero(h.id)}
							className={`flex min-h-[26vh] flex-col items-center justify-center gap-1 bg-night/80 ${
								h.id === heroId ? 'border-crit' : 'border-rarity-common'
							}`}
						>
							<span className="font-title text-[1.4em]">
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

			<AdjustRow
				label={`${t('select.danger', { n: shownDanger })} · ${t('select.dangerBest', {
					n: hero.bestByDanger[shownDanger] ?? 0,
				})}`}
				onPrev={() => setDanger(step(shownDanger, -1, hero.maxDanger + 1))}
				onNext={() => setDanger(step(shownDanger, 1, hero.maxDanger + 1))}
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
			<div className="flex gap-3">
				<Btn
					onActivate={() =>
						weapon &&
						actions.start({ hero: hero.id, danger: shownDanger as Danger, weapon })
					}
					disabled={!hero.unlocked || !weapon}
					className="border-xp bg-xp/20 px-8 text-xp"
				>
					{t('select.play')}
				</Btn>
				<Btn onActivate={actions.back} className="border-snow">
					{t('menu.back')}
				</Btn>
			</div>
		</MenuScreen>
	);
}
