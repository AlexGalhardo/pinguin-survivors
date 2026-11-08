import type { ReactElement } from 'react';
import { rarityColor, toCss } from '../../config/palette';
import { GEAR_BY_ID } from '../../data/equipment';
import { RARITY_NUMERALS, type Rarity } from '../../data/rarity';
import type { WeaponId } from '../../data/weapons';
import { type I18nKey, t } from '../../i18n';
import { formatStat } from '../../logic/format';
import { resolveWeapon } from '../../logic/weapons';
import { AtlasIcon, weaponFrames } from './AtlasIcon';
import { weaponName } from './Hud';
import { Hint, ItemCard, StatRow } from './Panel';

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
		<ul className="m-0 list-none space-y-0.5 p-0 text-[0.9em]">
			{list.map((a) => (
				<li key={a.stat} className="text-xp">
					{affixText(a)}
				</li>
			))}
		</ul>
	);
}

/** Tooltip card of a weapon: name in the rarity color, what it does, numbers and affixes. */
export function WeaponCardView(props: { item: WeaponItem; footer?: ReactElement }): ReactElement {
	const w = resolveWeapon({ id: props.item.id as WeaponId, tier: clampRarity(props.item.tier) });
	return (
		<ItemCard
			name={weaponName(props.item.id)}
			color={rarityCss(props.item.tier)}
			kind={`${t('shop.kind.weapon')} · ${numeral(props.item.tier)}`}
			lines={[
				<span key="b" className="text-text-dim">
					{t(`weapon.behavior.${w.behavior}` as I18nKey)}
				</span>,
				<StatRow key="d" label={t('weapon.stat.damage')} value={w.damage} />,
				<StatRow
					key="r"
					label={t('weapon.stat.rate')}
					value={(1 / w.cooldown).toFixed(1)}
				/>,
				<StatRow key="g" label={t('weapon.stat.range')} value={w.range} />,
				<AffixLines key="a" affixes={props.item.affixes} />,
			]}
			footer={props.footer}
		/>
	);
}

/** Tooltip card of an equipment item: slot and rarity, base stats, affixes. */
export function GearCardView(props: { item: GearItem; footer?: ReactElement }): ReactElement {
	const def = GEAR_BY_ID[props.item.id];
	return (
		<ItemCard
			name={gearName(props.item.id)}
			color={rarityCss(props.item.rarity)}
			kind={`${def ? label(`gslot.${def.slot}`) : t('shop.kind.gear')} · ${numeral(props.item.rarity)}`}
			lines={[
				...gearBaseLines(props.item.id).map((l) => <span key={l}>{l}</span>),
				<AffixLines key="a" affixes={props.item.affixes} />,
			]}
			footer={props.footer}
		/>
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
			className="flex shrink-0 items-center justify-center border-2 bg-night/80"
			style={{
				borderColor: rarityCss(props.rarity),
				width: (props.size ?? 48) + 8,
				height: (props.size ?? 48) + 8,
			}}
		>
			<AtlasIcon frames={props.frames} size={props.size ?? 48} title={props.title} />
		</span>
	);
}

export { weaponFrames };
