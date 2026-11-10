import type { ReactElement } from 'react';
import type { HeroId } from '../../config/constants';
import type { AchievementDef } from '../../data/achievements';
import { type I18nKey, t } from '../../i18n';
import { achievementDescription, achievementName } from '../achievement-text';
import { useCompact, useUiScale } from '../compact';
import { FocusScope } from '../focus';
import { AtlasIcon, weaponFrames } from './AtlasIcon';
import { Btn } from './Btn';
import { HeroSprite } from './HeroSprite';
import { weaponName } from './Hud';
import { Ornament } from './Ornament';
import { Vignette } from './Vignette';

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

/** The object on the left: the hero sprite (whole-number scale of its 80 px frame), the weapon icon or nothing for an achievement. */
function Showpiece({ data }: { data: UnlockData }): ReactElement | null {
	const scale = useUiScale();
	const compact = useCompact();
	if (data.kind === 'hero')
		return (
			<div className="d-glow flex shrink-0 items-center justify-center">
				<HeroSprite
					hero={data.hero}
					scale={compact ? 2 : Math.max(2, Math.floor(6 * scale))}
					title={t(`unlock.${data.hero}` as I18nKey)}
				/>
			</div>
		);
	if (data.kind === 'weapon')
		return (
			<AtlasIcon
				frames={weaponFrames(data.id, 1)}
				size={compact ? 64 : Math.max(64, Math.round(192 * scale))}
			/>
		);
	return null;
}

/** Full-screen unlock notice (hero, starting weapon or achievement): big object on the left, text and CONTINUE on the right. */
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
			className="fixed inset-0 flex items-center justify-center gap-[6vw] bg-night/90 font-body text-body text-text-light"
		>
			<Showpiece data={data} />
			<div className="flex max-w-[48vw] flex-col items-start gap-[1.5vh] [@media(max-height:500px)]:gap-1">
				<div className="font-body text-section font-black tracking-section text-gold-bright uppercase">
					{c.heading}
				</div>
				<h1 className="m-0 font-title text-display leading-[1.4] font-black text-crit [@media(max-height:500px)]:text-title">
					{c.title}
				</h1>
				<Ornament kind="filet" size="short" className="[@media(max-height:500px)]:hidden" />
				{c.blurb && (
					<p className="m-0 text-item text-text-light [@media(max-height:500px)]:text-body">
						{c.blurb}
					</p>
				)}
				<Btn onActivate={actions.dismiss} variant="primary">
					{t('unlock.ok')}
				</Btn>
			</div>
			<Vignette />
		</FocusScope>
	);
}
