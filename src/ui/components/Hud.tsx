import { type ReactElement, type ReactNode, useSyncExternalStore } from 'react';
import { rarityColor, toCss } from '../../config/palette';
import { inputKind, subscribeInputKind } from '../../core/input-kind';
import { platform } from '../../core/platform';
import { touchControlsEnabled } from '../../core/touch-bridge';
import { type I18nKey, t } from '../../i18n';
import { formatTime } from '../../logic/format';
import { type HudSnapshot, hudStore } from '../hud-bridge';
import { useOverlayOpen } from '../overlay';
import { AtlasIcon } from './AtlasIcon';
import { Ornament } from './Ornament';

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

/** Healing potion state under the HP bar: ready or empty flask, `cargas/máx.` and kills to the next refill. */
function PotionStatus({
	potion,
}: {
	potion: NonNullable<HudSnapshot['healPotion']>;
}): ReactElement {
	const color = toCss(rarityColor(potion.rarity));
	const ready = potion.charges > 0;
	const full = potion.charges >= potion.level;
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
			{!full && (
				<span className="font-medium text-text-light">
					{t('hud.potionKills', { n: potion.kills, max: potion.killsPerPotion })}
				</span>
			)}
		</div>
	);
}

const pct = (value: number, max: number): string =>
	`${Math.round(Math.max(0, Math.min(1, max > 0 ? value / max : 0)) * 100)}%`;

/** HUD bar: no frame and no blur, a dark track and a flat fill; the label sits inside when given. */
function Bar(props: {
	value: number;
	max: number;
	fill: string;
	height: string;
	label?: ReactNode;
}): ReactElement {
	return (
		<div
			className={`relative w-full overflow-hidden border border-snow-dark bg-panel-bottom/80 ${props.height}`}
		>
			<div
				className={`absolute inset-y-0 left-0 ${props.fill}`}
				style={{ width: pct(props.value, props.max) }}
			/>
			{props.label != null && (
				<div className="text-secondary absolute inset-0 flex items-center justify-center font-bold tabular-nums">
					{props.label}
				</div>
			)}
		</div>
	);
}

/** Phones show at most two gambits (wireframe 2.10); desktop shows them all. */
const PHONE_GAMBITS = 2;

export function HudView({
	hud,
	version,
	showFps,
}: {
	hud: HudSnapshot;
	version?: string;
	/** Development builds and `?debug=1` only: players do not need the counter. */
	showFps?: boolean;
}): ReactElement {
	// Touch screens have the 1x/2x button instead of the TAB hint, and the pause button sits there.
	const touch = touchControlsEnabled(platform().kind, window.location.search);
	// Pad in use: the hints name the pad button instead of the key (`<key>.pad`).
	const pad = useSyncExternalStore(subscribeInputKind, inputKind) === 'gamepad';
	const hint = (key: string): I18nKey => (pad ? `${key}.pad` : key) as I18nKey;
	const boss = hud.boss;
	const urgent = hud.timeLeft <= 5 || hud.bossRound;
	const gambits = touch ? hud.gambits.slice(0, PHONE_GAMBITS) : hud.gambits;
	return (
		<div className="text-secondary pointer-events-none fixed inset-0 overflow-hidden font-body tabular-nums text-text-light [text-shadow:0_2px_4px_var(--color-shadow),0_0_1px_var(--color-night)]">
			<div
				aria-hidden="true"
				className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_62%,color-mix(in_srgb,var(--color-shadow)_35%,transparent)_100%)]"
			/>
			<div
				data-hud="status"
				className="absolute top-[3vh] left-[3vw] w-[clamp(14rem,19vw,24rem)] space-y-1"
				style={
					touch
						? { left: 'max(1.5vw, env(safe-area-inset-left))', top: '1.5vh' }
						: undefined
				}
			>
				<Bar
					value={hud.hp}
					max={hud.maxHp}
					fill="bg-blood"
					height="h-[max(26px,calc(var(--spacing)*7))]"
					label={t('hud.hpBar', { hp: Math.ceil(hud.hp), max: Math.round(hud.maxHp) })}
				/>
				<div className="flex items-center gap-2">
					<Bar value={hud.xp} max={hud.xpToNext} fill="bg-xp" height="h-2" />
					<span className="font-bold whitespace-nowrap">
						{t('hud.level', { n: hud.level })}
					</span>
				</div>
				<div className="flex items-center gap-3 font-bold whitespace-nowrap">
					<span className="flex items-center gap-1 text-fish">
						<AtlasIcon frames={['icon.currency.fish']} size={24} />
						{t('hud.fish', { n: hud.fish })}
					</span>
					<span>{t('hud.kills', { n: hud.kills })}</span>
				</div>
				{hud.healPotion && <PotionStatus potion={hud.healPotion} />}
				{gambits.length > 0 && (
					<div data-hud="gambits" className="text-dot-poison">
						{gambits.map((g) => (
							<div
								key={g.slot}
								className={g.used ? 'text-text-dim line-through' : ''}
							>
								{name(`potion.${g.potion}`)} · {name(`cond.${g.condition}`)}
							</div>
						))}
					</div>
				)}
			</div>

			<div
				data-hud="round"
				className="absolute top-[1vh] left-1/2 flex -translate-x-1/2 flex-col items-center"
			>
				<div className="text-section font-bold tracking-section uppercase">
					{t('hud.round', { n: hud.round })}
				</div>
				<div className="flex items-center gap-3">
					<Ornament kind="diamond" size={12} />
					<div
						className={`font-title text-[max(28px,5.2vh)] leading-none font-bold ${urgent ? 'text-blood' : ''}`}
					>
						{formatTime(hud.timeLeft)}
					</div>
					<Ornament kind="diamond" size={12} />
				</div>
				{hud.elite !== 'none' && (
					<div
						className={`font-bold tracking-section uppercase ${hud.elite === 'orange' ? 'text-aura-orange' : 'text-aura-purple'}`}
					>
						{t('hud.eliteRound')}
					</div>
				)}
				{boss && (
					<div className="mt-1 w-[clamp(16rem,31vw,38rem)]">
						{/* Name over the bar, one line: under it, it ran into the damage numbers of the fight. */}
						<div
							className={`text-center font-title leading-tight font-bold whitespace-nowrap text-aura-orange ${touch ? 'text-section' : 'text-item'}`}
						>
							{name(`boss.${boss.id}`)}
						</div>
						<Bar
							value={boss.hp}
							max={boss.maxHp}
							fill="bg-aura-orange"
							height={
								touch
									? 'h-[max(12px,calc(var(--spacing)*4))]'
									: 'h-[max(24px,calc(var(--spacing)*7))]'
							}
							label={touch ? undefined : pct(boss.hp, boss.maxHp)}
						/>
					</div>
				)}
			</div>

			{showFps && !touch && (
				<div
					data-hud="fps"
					className="absolute top-[3vh] right-[3vw] font-bold text-text-dim"
				>
					{t('hud.fps', { n: hud.fps })}
				</div>
			)}

			{/* Super Magic bottom left (developer, 2026-11-08); the weapons are seen on the hero, not here. */}
			<div
				data-hud="super"
				className={`absolute bottom-[3vh] ${touch ? 'left-1/2 -translate-x-1/2' : 'left-[3vw]'}`}
			>
				{hud.superpower &&
					(() => {
						const { charge, cost } = hud.superpower;
						const ready = charge >= cost;
						return (
							<div className="w-[clamp(12rem,18vw,22rem)]">
								<div
									className={`text-section font-bold tracking-section whitespace-nowrap uppercase ${ready ? 'text-crit' : 'text-blood'}`}
								>
									{ready
										? t(hint('hud.superReady'))
										: t('hud.super', { n: charge, max: cost })}
								</div>
								<Bar
									value={charge}
									max={cost}
									fill={ready ? 'bg-gold-bright' : 'bg-blood'}
									height="h-3"
								/>
							</div>
						);
					})()}
			</div>

			{hud.bossArrow && (
				<svg
					data-hud="boss-arrow"
					aria-hidden="true"
					viewBox="-12 -12 24 24"
					className="absolute h-[max(28px,4vh)] w-[max(28px,4vh)] -translate-x-1/2 -translate-y-1/2 text-aura-orange"
					style={{
						left: `${hud.bossArrow.x * 100}%`,
						top: `${hud.bossArrow.y * 100}%`,
						transform: `translate(-50%, -50%) rotate(${hud.bossArrow.angle}rad)`,
					}}
				>
					<path
						d="M10 0 -7 -9 -3 0 -7 9Z"
						fill="currentColor"
						stroke="var(--color-night)"
						strokeWidth="1.5"
					/>
				</svg>
			)}

			{hud.tip && (
				<div
					data-hud="tip"
					role="status"
					className="absolute bottom-[14vh] left-1/2 max-w-[80vw] -translate-x-1/2 border border-line bg-night/85 px-4 py-2 text-center text-body font-bold text-crit"
				>
					{t(
						(hud.tip !== 'auto' && touch
							? `onboard.tip.${hud.tip}.touch`
							: hud.tip === 'super' && pad
								? 'onboard.tip.super.pad'
								: `onboard.tip.${hud.tip}`) as I18nKey,
					)}
				</div>
			)}

			{version && !touch && (
				<div className="absolute bottom-[0.6vh] left-1/2 -translate-x-1/2 text-[0.7rem] text-text-dim">
					{version}
				</div>
			)}

			{!touch && (
				<div
					className={`absolute right-[3vw] bottom-[3vh] text-key font-bold tracking-section uppercase ${hud.speed > 1 ? 'text-crit' : 'text-text-light'}`}
				>
					{t(hint(hud.speed > 1 ? 'hud.speedOn' : 'hud.speedHint'), { n: hud.speed })}
				</div>
			)}
		</div>
	);
}

export function Hud({
	version,
	showFps,
}: {
	version?: string;
	showFps?: boolean;
}): ReactElement | null {
	const hud = useSyncExternalStore(hudStore.subscribe, () => hudStore.get().hud);
	// Any full-screen menu or overlay (pause, settings, controls, shop, cards, summary) hides the HUD.
	const covered = useOverlayOpen();
	return hud && !covered ? <HudView hud={hud} version={version} showFps={showFps} /> : null;
}
