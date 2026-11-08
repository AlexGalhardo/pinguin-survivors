import type { ReactElement } from 'react';
import type { HeroId } from '../../config/constants';
import type { AchievementDef } from '../../data/achievements';
import { type I18nKey, t } from '../../i18n';
import { achievementDescription, achievementName } from '../achievement-text';
import { FocusScope } from '../focus';
import { Btn } from './Btn';
import { weaponName } from './Hud';

export type UnlockData =
	| { kind: 'hero'; hero: Exclude<HeroId, 'jack'> }
	| { kind: 'weapon'; id: string }
	| { kind: 'achievement'; def: AchievementDef };

export interface UnlockActions {
	dismiss: () => void;
}

function content(data: UnlockData): { heading: string; title: string; blurb: string } {
	switch (data.kind) {
		case 'hero':
			return {
				heading: t('unlock.title'),
				title: t(`unlock.${data.hero}` as I18nKey),
				blurb: t(`unlock.${data.hero}.blurb` as I18nKey),
			};
		case 'weapon':
			return { heading: t('unlock.weapon'), title: weaponName(data.id), blurb: '' };
		case 'achievement':
			return {
				heading: t('unlock.achievement'),
				title: achievementName(data.def),
				blurb: achievementDescription(data.def),
			};
	}
}

/** Full-screen unlock notice (hero, starting weapon or achievement). */
export function Unlock({
	data,
	actions,
}: {
	data: UnlockData;
	actions: UnlockActions;
}): ReactElement {
	const c = content(data);
	return (
		<FocusScope
			onBack={actions.dismiss}
			className="fixed inset-0 flex flex-col items-center justify-center gap-[2.5vh] bg-night/90 font-body text-[clamp(0.8rem,1.7vh,1.125rem)] text-text-light"
		>
			<div className="font-title text-[1.4em] text-text-dim">{c.heading}</div>
			<h1 className="font-title text-[2.6em] font-bold text-crit">{c.title}</h1>
			{c.blurb && <p className="max-w-[50ch] text-center text-text-dim">{c.blurb}</p>}
			<Btn onActivate={actions.dismiss} className="border-xp text-xp">
				{t('unlock.ok')}
			</Btn>
		</FocusScope>
	);
}
