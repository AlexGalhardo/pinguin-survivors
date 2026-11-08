import { type ReactElement, type ReactNode, useSyncExternalStore } from 'react';
import { rarityColor, toCss } from '../../config/palette';
import { platform } from '../../core/platform';
import { touchControlsEnabled } from '../../core/touch-bridge';
import { type I18nKey, t } from '../../i18n';
import { formatTime } from '../../logic/format';
import { type HudSnapshot, hudStore } from '../hud-bridge';
import { useOverlayOpen } from '../overlay';
import { AtlasIcon } from './AtlasIcon';

const name = (key: string): string => (t(key as I18nKey) as string | undefined) ?? key;

export const weaponName = (id: string): string => {
	const own = t(`weapon.${id}.name` as I18nKey) as string | undefined;
	return own ?? name(`card.weapon.${id}.name`);
};

/** Flask drawn as SVG (no atlas art needed): filled with the rarity color when a potion is ready, hollow when empty. */
function Flask({ color, full }: { color: string; full: boolean }): ReactElement {
	return (
		<svg viewBox="0 0 16 20" width="26" height="32" aria-hidden="true">
			<path
				d="M6 1h4v1.5H9V6l4.5 8.5A3 3 0 0 1 10.9 19H5.1a3 3 0 0 1-2.6-4.5L7 6V2.5H6z"
				fill={full ? color : 'none'}
				fillOpacity={0.85}
				stroke={color}
				strokeWidth="1.2"
				strokeLinejoin="round"
				opacity={full ? 1 : 0.45}
			/>
		</svg>
	);
}

/** Healing potion state under the HP bar: ready or empty flask and `cargas/máx.` (refilled each round). */
function PotionStatus({
	potion,
}: {
	potion: NonNullable<HudSnapshot['healPotion']>;
}): ReactElement {
	const color = toCss(rarityColor(potion.rarity));
	const ready = potion.charges > 0;
	return (
		<div
			className="flex items-center gap-1.5 font-bold tabular-nums"
			style={{ color: ready ? color : undefined }}
			title={t('hud.healPotion')}
		>
			<Flask color={ready ? color : 'var(--color-text-dim)'} full={ready} />
			<span className={ready ? '' : 'text-text-dim'}>
				{potion.charges}/{potion.level}
			</span>
		</div>
	);
}

const pct = (value: number, max: number): string =>
	`${Math.round(Math.max(0, Math.min(1, max > 0 ? value / max : 0)) * 100)}%`;

function Bar(props: {
	value: number;
	max: number;
	fill: string;
	height: string;
	label: ReactNode;
	labelClass?: string;
}): ReactElement {
	return (
		<div
			className={`relative w-full overflow-hidden rounded-sm bg-night/90 p-0.5 ${props.height}`}
		>
			<div className="relative h-full w-full bg-snow-dark">
				<div
					className={`absolute inset-y-0 left-0 ${props.fill}`}
					style={{ width: pct(props.value, props.max) }}
				/>
				<div
					className={`absolute inset-0 flex items-center justify-center font-bold text-text-light ${props.labelClass ?? ''}`}
				>
					{props.label}
				</div>
			</div>
		</div>
	);
}

export function HudView({ hud, version }: { hud: HudSnapshot; version?: string }): ReactElement {
	// Touch screens have the 1x/2x button instead of the TAB hint, and the pause button sits there.
	const touch = touchControlsEnabled(platform().kind, window.location.search);
	const boss = hud.boss;
	return (
		<div className="pointer-events-none fixed inset-0 overflow-hidden font-body text-[clamp(0.75rem,1.5vh,1rem)] text-text-light">
			<div className="absolute top-[1.2vh] left-[1vw] w-[clamp(11rem,16vw,20rem)] space-y-1">
				<Bar
					value={hud.hp}
					max={hud.maxHp}
					fill="bg-blood"
					height="h-[clamp(1.5rem,3vh,2rem)]"
					label={t('hud.hpBar', { hp: Math.ceil(hud.hp), max: Math.round(hud.maxHp) })}
				/>
				<Bar
					value={hud.xp}
					max={hud.xpToNext}
					fill="bg-xp"
					height="h-[clamp(1rem,2vh,1.25rem)]"
					labelClass="text-[0.75em]"
					label={t('hud.level', { n: hud.level })}
				/>
				<div className="flex items-center gap-1 font-bold text-fish">
					<AtlasIcon frames={['icon.currency.fish']} size={24} />
					{t('hud.fish', { n: hud.fish })}
				</div>
				<div className="text-text-dim">{t('hud.kills', { n: hud.kills })}</div>
				{hud.healPotion && <PotionStatus potion={hud.healPotion} />}
			</div>

			<div className="absolute top-[1vh] left-1/2 flex -translate-x-1/2 flex-col items-center">
				<div className="font-bold">{t('hud.round', { n: hud.round })}</div>
				<div
					className={`font-title text-[clamp(1.5rem,4vh,2.5rem)] font-bold ${
						hud.timeLeft <= 5 || hud.bossRound ? 'text-blood' : ''
					}`}
				>
					{formatTime(hud.timeLeft)}
				</div>
				{boss && (
					<div className="mt-1 w-[clamp(16rem,24vw,30rem)]">
						<Bar
							value={boss.hp}
							max={boss.maxHp}
							fill="bg-aura-orange"
							height="h-[clamp(1rem,2vh,1.25rem)]"
							label={null}
						/>
						<div className="text-center font-bold text-aura-orange">
							{name(`boss.${boss.id}`)}
						</div>
					</div>
				)}
			</div>

			<div className="absolute top-[1.2vh] right-[1vw] flex flex-col items-end gap-1">
				<div className="font-bold text-text-dim">{t('hud.fps', { n: hud.fps })}</div>
				{hud.elite !== 'none' && (
					<div
						className={`font-bold ${hud.elite === 'orange' ? 'text-aura-orange' : 'text-aura-purple'}`}
					>
						{t('hud.eliteRound')}
					</div>
				)}
			</div>

			{/* Super Magic bottom left (developer, 2026-11-08); the weapons are seen on the hero, not here. */}
			<div className="absolute bottom-[1.2vh] left-[1vw]">
				{hud.superpower &&
					(() => {
						const { charge, cost } = hud.superpower;
						const ready = charge >= cost;
						return (
							<div className="w-[clamp(12rem,16vw,20rem)]">
								<div className={`font-bold ${ready ? 'text-crit' : ''}`}>
									{ready
										? t('hud.superReady')
										: t('hud.super', { n: charge, max: cost })}
								</div>
								<Bar
									value={charge}
									max={cost}
									fill={ready ? 'bg-crit' : 'bg-blood'}
									height="h-[clamp(0.75rem,1.4vh,1rem)]"
									label={null}
								/>
							</div>
						);
					})()}
			</div>

			{version && (
				<div className="absolute bottom-[0.6vh] left-1/2 -translate-x-1/2 text-[0.7em] text-text-dim">
					{version}
				</div>
			)}

			<div className="absolute right-[1vw] bottom-[1.2vh] flex flex-col items-end gap-0.5 text-dot-poison">
				{!touch && (
					<div className={`font-bold ${hud.speed > 1 ? 'text-crit' : 'text-text-dim'}`}>
						{t(hud.speed > 1 ? 'hud.speedOn' : 'hud.speedHint', { n: hud.speed })}
					</div>
				)}
				{hud.gambits.map((g) => (
					<div key={g.slot} className={g.used ? 'opacity-50' : ''}>
						{g.used ? '✕ ' : ''}
						{name(`potion.${g.potion}`)} · {name(`cond.${g.condition}`)}
					</div>
				))}
			</div>
		</div>
	);
}

export function Hud({ version }: { version?: string }): ReactElement | null {
	const hud = useSyncExternalStore(hudStore.subscribe, () => hudStore.get().hud);
	// Any full-screen menu or overlay (pause, settings, controls, shop, cards, summary) hides the HUD.
	const covered = useOverlayOpen();
	return hud && !covered ? <HudView hud={hud} version={version} /> : null;
}
