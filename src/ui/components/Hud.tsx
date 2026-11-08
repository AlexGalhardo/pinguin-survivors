import { type ReactElement, type ReactNode, useSyncExternalStore } from 'react';
import { rarityColor, toCss } from '../../config/palette';
import { platform } from '../../core/platform';
import { touchControlsEnabled } from '../../core/touch-bridge';
import { type I18nKey, t } from '../../i18n';
import { toRoman } from '../../logic/achievements';
import { formatTime } from '../../logic/format';
import { type HudSnapshot, hudStore } from '../hud-bridge';
import { AtlasIcon, weaponFrames } from './AtlasIcon';

const name = (key: string): string => (t(key as I18nKey) as string | undefined) ?? key;

export const weaponName = (id: string): string => {
	const own = t(`weapon.${id}.name` as I18nKey) as string | undefined;
	return own ?? name(`card.weapon.${id}.name`);
};

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

function WeaponSlot({ w }: { w?: HudSnapshot['weapons'][number] }): ReactElement {
	if (!w) {
		return (
			<div className="size-[clamp(2.5rem,5.5vh,3.5rem)] rounded border border-snow-dark bg-night/60" />
		);
	}
	const label = weaponName(w.id);
	return (
		<div
			title={label}
			className="relative flex size-[clamp(2.5rem,5.5vh,3.5rem)] items-center justify-center rounded border-2 bg-night/80"
			style={{
				borderColor: toCss(rarityColor(w.rarity ?? w.tier)),
				color: toCss(rarityColor(w.rarity ?? w.tier)),
			}}
		>
			<AtlasIcon
				frames={weaponFrames(w.id, w.tier)}
				size={56}
				title={label}
				fallback={
					<span className="font-title text-[clamp(0.75rem,1.6vh,1rem)] font-bold">
						{label.slice(0, 2).toUpperCase()}
					</span>
				}
			/>
			<span className="absolute right-0.5 bottom-0 text-[clamp(0.625rem,1.2vh,0.8125rem)] leading-none">
				{toRoman(w.tier)}
			</span>
		</div>
	);
}

/** Full-screen gameplay HUD (React). Reads the snapshot published by the game at ~10 Hz. */
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

			<div className="absolute bottom-[1.2vh] left-1/2 flex -translate-x-1/2 flex-col items-center gap-2">
				{hud.superpower &&
					(() => {
						const { charge, cost } = hud.superpower;
						const ready = charge >= cost;
						return (
							<div className="w-[clamp(12rem,16vw,20rem)]">
								<div
									className={`text-center font-bold ${ready ? 'text-crit' : ''}`}
								>
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
				<div className="flex gap-1">
					{hud.weapons.slice(0, 6).map((w, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: slots are positional and the same weapon can fill two of them
						<WeaponSlot key={`${w.id}-${i}`} w={w} />
					))}
				</div>
				{version && <div className="text-[0.7em] text-text-dim">{version}</div>}
			</div>

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
	return hud ? <HudView hud={hud} version={version} /> : null;
}
