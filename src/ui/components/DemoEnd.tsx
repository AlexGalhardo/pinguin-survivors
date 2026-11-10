import type { ReactElement } from 'react';
import { t } from '../../i18n';
import { formatTime } from '../../logic/format';
import { FocusScope } from '../focus';
import { useInputGrace } from '../input-grace';
import { Btn } from './Btn';
import { Ornament } from './Ornament';
import { Vignette } from './Vignette';

export interface DemoEndData {
	/** The last demo boss was beaten (otherwise the hero died before it). */
	won: boolean;
	round: number;
	kills: number;
	seconds: number;
	damage: number;
	/** Bob is still locked: show the "unlocked in the full game" teaser. */
	bobLocked: boolean;
	/** Steam page opened by the wishlist button (`STEAM_URL`). */
	wishlistUrl: string;
}

export interface DemoEndActions {
	/** Opens `wishlistUrl` through the platform (`platform().openUrl`). */
	wishlist: () => void;
	playAgain: () => void;
	menu: () => void;
}

/** End of the demo (SDD-006 RF-02): run summary, full-game teaser and the wishlist CTA, text over the vignette. Inputs wait for the grace window. */
export function DemoEnd({
	data,
	actions,
}: {
	data: DemoEndData;
	actions: DemoEndActions;
}): ReactElement {
	const guard = useInputGrace();
	return (
		<FocusScope
			onBack={guard(actions.menu)}
			className="fixed inset-0 flex items-center justify-center bg-night/90 font-body text-body text-text-light"
		>
			<div className="flex max-w-[70vw] flex-col items-start gap-[1.5vh] [@media(max-height:500px)]:gap-1">
				<h1
					className={`m-0 font-title text-display leading-[1.4] font-black tracking-title uppercase [@media(max-height:500px)]:text-title ${data.won ? 'text-gold-bright' : 'text-blood'}`}
				>
					{t(data.won ? 'demo.won' : 'demo.lost')}
				</h1>
				<Ornament kind="filet" size="short" className="[@media(max-height:500px)]:hidden" />
				<div className="font-title text-title font-bold [@media(max-height:500px)]:text-item">
					{t('over.round', { n: data.round })}
				</div>
				<div className="text-item text-text-light [@media(max-height:500px)]:text-body">
					{t('over.stats', {
						kills: data.kills,
						time: formatTime(data.seconds),
						damage: data.damage.toLocaleString(),
					})}
				</div>
				{data.bobLocked && (
					<div className="text-item font-bold text-gold-bright [@media(max-height:500px)]:text-body">
						{t('demo.bob')}
					</div>
				)}
				<Btn
					onActivate={guard(actions.wishlist)}
					href={data.wishlistUrl}
					variant="primary"
					className="min-h-[max(56px,7vh)] px-8 font-title text-cta"
				>
					{t('demo.wishlist')}
				</Btn>
				<div className="flex flex-wrap gap-4">
					<Btn onActivate={guard(actions.playAgain)} variant="secondary">
						{t('over.playAgain')}
					</Btn>
					<Btn onActivate={guard(actions.menu)} variant="secondary">
						{t('over.mainMenu')}
					</Btn>
				</div>
			</div>
			<Vignette />
		</FocusScope>
	);
}
