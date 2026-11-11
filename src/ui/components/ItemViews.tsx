import type { ReactElement, ReactNode } from 'react';
import { rarityColor, toCss } from '../../config/palette';
import { GEAR_BY_ID } from '../../data/equipment';
import { RARITY_NUMERALS, type Rarity } from '../../data/rarity';
import type { WeaponId } from '../../data/weapons';
import { type I18nKey, t } from '../../i18n';
import { formatStat } from '../../logic/format';
import { resolveWeapon } from '../../logic/weapons';
import { AtlasIcon, weaponFrames } from './AtlasIcon';
import { weaponName } from './Hud';
import { Hint, ItemCard } from './Panel';

/** A rolled stat bonus of an item, as the bridges carry it. */
export interface AffixView {
	stat: string;
	value: number;
}

/** What the UI needs to draw a weapon the player owns or is offered. */
export interface WeaponItem {
	id: string;
	/** Rarity I..V. */
	tier: number;
	affixes?: readonly AffixView[];
}

/** An equipment item, owned or offered. */
export interface GearItem {
	id: string;
	rarity: number;
	affixes?: readonly AffixView[];
}

export const clampRarity = (n: number): Rarity => Math.min(5, Math.max(1, Math.round(n))) as Rarity;

/** CSS color of a rarity: the single palette source (`rarityColor`). */
export const rarityCss = (n: number): string => toCss(rarityColor(clampRarity(n)));

export const numeral = (n: number): string => RARITY_NUMERALS[clampRarity(n)];

const label = (key: string): string => (t(key as I18nKey) as string | undefined) ?? key;

export const statLabel = (stat: string): string => label(`gstat.${stat}`);

/** "+6 max HP" */
export const affixText = (a: AffixView): string =>
	`${formatStat(a.stat, a.value, true)} ${statLabel(a.stat)}`;

export const gearName = (id: string): string => label(`gear.${id}`);

/** Base stats of a catalog equipment item as text lines. */
export function gearBaseLines(id: string): string[] {
	const def = GEAR_BY_ID[id];
	if (!def) return [];
	return Object.entries(def.stats).map(
		([k, v]) => `${formatStat(k, v as number, true)} ${statLabel(k)}`,
	);
}

/** Affix list, or a dim "no affixes" line. */
export function AffixLines(props: { affixes?: readonly AffixView[] }): ReactElement {
	const list = props.affixes ?? [];
	if (list.length === 0) return <Hint>{t('shop.noAffixes')}</Hint>;
	return (
		<ul className="m-0 list-none space-y-0.5 p-0 text-secondary">
			{list.map((a) => (
				<li key={a.stat} className="flex items-baseline gap-2 text-xp">
					<span className="text-key">✦</span>
					{affixText(a)}
				</li>
			))}
		</ul>
	);
}

/** Tooltip card of a weapon (Style D tooltip, rarity-colored header): what it does, its numbers on one line and affixes. */
export function WeaponCardView(props: { item: WeaponItem; footer?: ReactElement }): ReactElement {
	const w = resolveWeapon({ id: props.item.id as WeaponId, tier: clampRarity(props.item.tier) });
	return (
		<ItemCard
			name={weaponName(props.item.id)}
			color={rarityCss(props.item.tier)}
			kind={`${t('shop.kind.weapon')} · ${numeral(props.item.tier)}`}
			lines={[
				<span key="b" className="text-secondary text-text-light">
					{t(`weapon.behavior.${w.behavior}` as I18nKey)}
				</span>,
				<span key="n" className="text-secondary font-bold tabular-nums">
					{`${t('weapon.stat.damage')} ${w.damage} · ${(1 / w.cooldown).toFixed(1)}/s · ${t('weapon.stat.range')} ${w.range}`}
				</span>,
				<AffixLines key="a" affixes={props.item.affixes} />,
			]}
			footer={props.footer}
		/>
	);
}

/** Tooltip card of an equipment item: slot and rarity, base stats, affixes. */
export function GearCardView(props: {
	item: GearItem;
	footer?: ReactElement;
	/** Short role of the card in a comparison ("for sale", "equipped"), appended to the type line. */
	tag?: string;
}): ReactElement {
	const def = GEAR_BY_ID[props.item.id];
	return (
		<ItemCard
			name={gearName(props.item.id)}
			color={rarityCss(props.item.rarity)}
			kind={`${def ? label(`gslot.${def.slot}`) : t('shop.kind.gear')} · ${numeral(props.item.rarity)}${props.tag ? ` · ${props.tag}` : ''}`}
			lines={[
				...gearBaseLines(props.item.id).map((l) => (
					<span key={l} className="flex items-baseline gap-2 text-secondary">
						<span className="text-key text-gold-aged">◆</span>
						{l}
					</span>
				)),
				<AffixLines key="a" affixes={props.item.affixes} />,
			]}
			footer={props.footer}
		/>
	);
}

/** Atlas frame of a stat (`icon.maxHp`, `icon.resistFire`, `icon.meleeDamage`); stats without art draw none. */
export function statIconFrames(stat: string): string[] {
	const [group, sub] = stat.split('.');
	if (!sub) return [`icon.${stat}`];
	const cap = sub.charAt(0).toUpperCase() + sub.slice(1);
	return [group === 'resist' ? `icon.resist${cap}` : `icon.${sub}Damage`];
}

/**
 * One hero stat everywhere it is listed (shop strip, pause, hero select): pixel icon, capitalized
 * label and the value on the right. `strong` marks the headline numbers.
 */
export function StatLine(props: {
	stat: string;
	value: ReactNode;
	strong?: boolean;
	/** False drops the icon where the row must stay one text line tall. */
	icon?: boolean;
	/** Value color class when it is not the neutral one (a bonus, a penalty). */
	accent?: string;
}): ReactElement {
	return (
		<div
			data-stat={props.stat}
			className={`flex min-w-0 items-center gap-2 text-secondary ${props.strong ? 'font-black text-gold-bright' : 'text-text-light'}`}
		>
			{props.icon !== false && <AtlasIcon frames={statIconFrames(props.stat)} size={32} />}
			<span className="min-w-0 flex-1 truncate capitalize">{statLabel(props.stat)}</span>
			<span className={`font-bold tabular-nums ${props.accent ?? ''}`}>{props.value}</span>
		</div>
	);
}

/** Small square icon of a weapon or gear item with a rarity-colored border. */
export function SlotIcon(props: {
	frames: string[];
	rarity: number;
	size?: number;
	title?: string;
}): ReactElement {
	return (
		<span
			className="flex shrink-0 items-center justify-center border-2"
			style={{
				borderColor: rarityCss(props.rarity),
				backgroundColor: `color-mix(in srgb, ${rarityCss(props.rarity)} 20%, var(--color-night))`,
				width: (props.size ?? 48) + 8,
				height: (props.size ?? 48) + 8,
			}}
		>
			<AtlasIcon frames={props.frames} size={props.size ?? 48} title={props.title} />
		</span>
	);
}

export { weaponFrames };
