import { type ReactElement, useState } from 'react';
import { GEAR_BY_ID } from '../../data/equipment';
import { LEGACY_GEAR_RARITY } from '../../data/rarity';
import { MAX_WEAPON_SLOTS, type WeaponTier } from '../../data/weapons';
import { t } from '../../i18n';
import type { PlayerPanelView } from '../../logic/item-view';
import { useCompact } from '../compact';
import { FocusScope } from '../focus';
import { Btn } from './Btn';
import { MenuList } from './MenuList';
import { Heading } from './Panel';
import { PlayerPanel, type PlayerPanelData, panelFromView } from './PlayerPanel';

export interface PauseData {
	weapons: readonly { slot: number; id: string; tier: WeaponTier }[];
	/** Main stats already formatted for display (`gstat.<key>` is the label). */
	stats: readonly { key: string; value: string }[];
	/** Passive cards and hero actives owned (`card.perk.<id>` / `card.active.<id>` are the names). */
	cards: readonly { name: string; level: number }[];
	/** Worn equipment per slot (`detail` is the old text summary, unused by this screen). */
	gear: {
		slots: readonly { slot: string; id: string | null; detail?: string }[];
	};
}

export interface PauseActions {
	resume: () => void;
	settings: () => void;
	/** Opens the skill tree of the run's hero. */
	tree: () => void;
	/** Called only after the player confirms. */
	quit: () => void;
}

const catalogRarity = (id: string): number => {
	const def = GEAR_BY_ID[id];
	return def ? LEGACY_GEAR_RARITY[def.rarity] : 1;
};

/** Without the contract view (tests, old saves) the panel falls back to the catalog rarity and no affixes. */
function fallbackPanel(data: PauseData): PlayerPanelData {
	return {
		stats: data.stats,
		weapons: data.weapons.map((w) => ({ id: w.id, tier: w.tier, affixes: [] })),
		maxWeapons: MAX_WEAPON_SLOTS,
		gear: data.gear.slots.map((s) => ({
			slot: s.slot,
			item: s.id ? { id: s.id, rarity: catalogRarity(s.id), affixes: [] } : null,
		})),
		cards: data.cards,
	};
}

/** Pause menu: the whole build as a three-zone player sheet (stats, slots, focused card; view only) and the actions as a text list. */
export function Pause({
	data,
	actions,
	panel,
}: {
	data: PauseData;
	actions: PauseActions;
	/** The contract view with rarity and affixes; absent in tests. */
	panel?: PlayerPanelView | null;
}): ReactElement {
	const [confirming, setConfirming] = useState(false);
	const compact = useCompact();
	const onSelect = (id: string): void => {
		if (id === 'resume') actions.resume();
		else if (id === 'tree') actions.tree();
		else if (id === 'settings') actions.settings();
		else setConfirming(true);
	};
	const menu = confirming ? (
		<div className="flex flex-col gap-1">
			<p className="m-0 text-body font-bold text-blood">{t('pause.confirm')}</p>
			<div className="flex flex-wrap gap-2">
				<Btn onActivate={actions.quit} variant="danger">
					{t('pause.yes')}
				</Btn>
				<Btn onActivate={() => setConfirming(false)} variant="primary">
					{t('pause.no')}
				</Btn>
			</div>
		</div>
	) : compact ? (
		<>
			<Btn onActivate={actions.resume} variant="primary">
				{t('pause.resume')}
			</Btn>
			<Btn onActivate={actions.tree} variant="secondary">
				{t('menu.workshop')}
			</Btn>
			<Btn onActivate={actions.settings} variant="secondary">
				{t('menu.settings')}
			</Btn>
			<Btn onActivate={() => setConfirming(true)} variant="danger">
				{t('pause.quit')}
			</Btn>
		</>
	) : (
		<MenuList
			onSelect={onSelect}
			items={[
				{ id: 'resume', label: t('pause.resume') },
				{ id: 'tree', label: t('menu.workshop') },
				{ id: 'settings', label: t('menu.settings') },
				{
					id: 'quit',
					label: <span className="font-black text-blood">{t('pause.quit')}</span>,
				},
			]}
		/>
	);
	return (
		<FocusScope
			key={confirming ? 'confirm' : 'menu'}
			onBack={confirming ? () => setConfirming(false) : actions.resume}
			className="fixed inset-0 flex flex-col gap-[1.5vh] overflow-hidden bg-night px-[3vw] py-[2vh] font-body text-body text-text-light [@media(max-height:500px)]:gap-0 [@media(max-height:500px)]:py-0.5"
		>
			<Heading>{t('pause.title')}</Heading>
			<main className="flex min-h-0 flex-1 flex-col gap-1">
				<PlayerPanel
					wide
					footer={compact ? undefined : menu}
					data={
						panel
							? panelFromView(panel, {
									maxWeapons: MAX_WEAPON_SLOTS,
									cards: data.cards,
								})
							: fallbackPanel(data)
					}
				/>
			</main>
			{compact && <footer className="flex flex-wrap items-center gap-2">{menu}</footer>}
		</FocusScope>
	);
}
