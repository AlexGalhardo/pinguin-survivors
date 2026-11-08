import type { ReactElement } from 'react';
import { t } from '../../i18n';
import { formatTime } from '../../logic/format';
import { FocusScope } from '../focus';
import { Btn } from './Btn';

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

/** End of the demo (SDD-006 RF-02): run summary, full-game teaser and wishlist call to action. */
export function DemoEnd({
	data,
	actions,
}: {
	data: DemoEndData;
	actions: DemoEndActions;
}): ReactElement {
	return (
		<FocusScope
			onBack={actions.menu}
			className="fixed inset-0 flex flex-col items-center justify-center gap-[2.5vh] bg-night/90 font-body text-[clamp(0.8rem,1.7vh,1.125rem)] text-text-light"
		>
			<h1
				className={`font-title text-[2.6em] font-bold ${data.won ? 'text-crit' : 'text-blood'}`}
			>
				{t(data.won ? 'demo.won' : 'demo.lost')}
			</h1>
			<div className="text-[1.4em] font-bold">{t('over.round', { n: data.round })}</div>
			<div className="text-text-dim">
				{t('over.stats', {
					kills: data.kills,
					time: formatTime(data.seconds),
					damage: data.damage.toLocaleString(),
				})}
			</div>
			{data.bobLocked && <div className="font-bold text-fish">{t('demo.bob')}</div>}
			<Btn
				onActivate={actions.wishlist}
				href={data.wishlistUrl}
				className="border-crit bg-crit/10 px-8 text-[1.2em] text-crit"
			>
				{t('demo.wishlist')}
			</Btn>
			<div className="flex gap-3">
				<Btn onActivate={actions.playAgain} className="border-xp text-xp">
					{t('over.playAgain')}
				</Btn>
				<Btn onActivate={actions.menu} className="border-snow">
					{t('over.mainMenu')}
				</Btn>
			</div>
		</FocusScope>
	);
}
