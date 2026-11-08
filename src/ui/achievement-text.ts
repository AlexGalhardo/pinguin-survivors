import type { AchievementDef } from '../data/achievements';
import { getLang, type I18nKey, t } from '../i18n';
import { toRoman } from '../logic/achievements';

export function achievementName(def: AchievementDef): string {
	const base = t(`ach.${def.family}.name` as I18nKey);
	return def.tier > 0 ? `${base} ${toRoman(def.tier)}` : base;
}

export function achievementDescription(def: AchievementDef): string {
	const c = def.condition;
	let n = def.display ?? ('value' in c ? c.value : 0);
	// Time is stored in seconds but described in hours.
	if (c.kind === 'lifetime' && c.stat === 'secondsPlayed') n = n / 3600;
	return t(`ach.${def.family}.desc` as I18nKey, {
		n: n.toLocaleString(getLang()),
		hero: def.hero ? t(`hero.${def.hero}` as I18nKey) : '',
	});
}
