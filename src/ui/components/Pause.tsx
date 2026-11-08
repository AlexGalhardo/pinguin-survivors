import { type ReactElement, useState } from 'react';
import { toCss } from '../../config/palette';
import { WEAPON_TIER_TINT, type WeaponTier } from '../../data/weapons';
import { type I18nKey, t } from '../../i18n';
import { toRoman } from '../../logic/achievements';
import { FocusScope } from '../focus';
import { Btn } from './Btn';
import { weaponName } from './Hud';

export interface PauseData {
	weapons: readonly { slot: number; id: string; tier: WeaponTier }[];
	/** Main stats already formatted for display (`gstat.<key>` is the label). */
	stats: readonly { key: string; value: string }[];
}

export interface PauseActions {
	resume: () => void;
	settings: () => void;
	/** Called only after the player confirms. */
	quit: () => void;
}

/** Pause menu: resume, settings, quit (with confirmation) and the current build. */
export function Pause({ data, actions }: { data: PauseData; actions: PauseActions }): ReactElement {
	const [confirming, setConfirming] = useState(false);
	return (
		<FocusScope
			key={confirming ? 'confirm' : 'menu'}
			onBack={confirming ? () => setConfirming(false) : actions.resume}
			className="fixed inset-0 flex items-center justify-center bg-night/85 font-body text-[clamp(0.8rem,1.7vh,1.125rem)] text-text-light"
		>
			<div className="flex w-[min(90vw,70rem)] gap-[3vw] rounded border border-snow-dark bg-night/90 p-[3vh]">
				<section className="flex flex-1 flex-col gap-3">
					<h1 className="font-title text-[2em] font-bold">{t('pause.title')}</h1>
					{confirming ? (
						<>
							<p className="font-bold text-blood">{t('pause.confirm')}</p>
							<Btn onActivate={actions.quit} className="border-blood text-blood">
								{t('pause.yes')}
							</Btn>
							<Btn onActivate={() => setConfirming(false)} className="border-snow">
								{t('pause.no')}
							</Btn>
						</>
					) : (
						<>
							<Btn onActivate={actions.resume} className="border-xp text-xp">
								{t('pause.resume')}
							</Btn>
							<Btn onActivate={actions.settings} className="border-ice text-ice">
								{t('menu.settings')}
							</Btn>
							<Btn
								onActivate={() => setConfirming(true)}
								className="border-blood text-blood"
							>
								{t('pause.quit')}
							</Btn>
						</>
					)}
				</section>
				<section className="flex flex-1 flex-col gap-2">
					<h2 className="font-title text-[1.2em] text-text-dim">{t('pause.weapons')}</h2>
					<ul className="space-y-1">
						{data.weapons.map((w) => (
							<li
								key={w.slot}
								className="font-bold"
								style={{ color: toCss(WEAPON_TIER_TINT[w.tier]) }}
							>
								{weaponName(w.id)} · {toRoman(w.tier)}
							</li>
						))}
					</ul>
				</section>
				<section className="flex flex-1 flex-col gap-2">
					<h2 className="font-title text-[1.2em] text-text-dim">{t('pause.stats')}</h2>
					<dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1">
						{data.stats.map((s) => (
							<div key={s.key} className="contents">
								<dt className="text-text-dim">{t(`gstat.${s.key}` as I18nKey)}</dt>
								<dd className="text-right font-bold">{s.value}</dd>
							</div>
						))}
					</dl>
				</section>
			</div>
		</FocusScope>
	);
}
