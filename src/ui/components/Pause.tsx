import { type ReactElement, useState } from 'react';
import { GEAR_BY_ID } from '../../data/equipment';
import { LEGACY_GEAR_RARITY } from '../../data/rarity';
import { MAX_WEAPON_SLOTS, type WeaponTier } from '../../data/weapons';
import { t } from '../../i18n';
import type { PlayerPanelView } from '../../logic/item-view';
import { FocusScope } from '../focus';
import { Btn } from './Btn';
import { Heading, Panel } from './Panel';
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

/** Pause menu: the whole build as a big player sheet (stats, weapons, equipment; view only) and three actions. */
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
	return (
		<FocusScope
			key={confirming ? 'confirm' : 'menu'}
			onBack={confirming ? () => setConfirming(false) : actions.resume}
			className="fixed inset-0 flex flex-col items-center gap-[1.4vh] overflow-hidden bg-night px-[3vw] py-[2vh] font-body text-[clamp(0.55rem,1.55vh,2.4rem)] text-text-light"
		>
			<header className="flex w-full max-w-[90rem] flex-col items-center gap-1">
				<Heading>{t('pause.title')}</Heading>
			</header>
			<Panel fit className="w-full max-w-[90rem] flex-1">
				<PlayerPanel
					wide
					data={
						panel
							? panelFromView(panel, {
									maxWeapons: MAX_WEAPON_SLOTS,
									cards: data.cards,
								})
							: fallbackPanel(data)
					}
				/>
			</Panel>
			<footer className="flex w-full max-w-[90rem] flex-wrap items-center justify-center gap-2">
				{confirming ? (
					<>
						<p className="m-0 w-full text-center font-bold text-blood">
							{t('pause.confirm')}
						</p>
						<Btn onActivate={actions.quit} variant="danger" className="min-w-48">
							{t('pause.yes')}
						</Btn>
						<Btn
							onActivate={() => setConfirming(false)}
							variant="secondary"
							className="min-w-48"
						>
							{t('pause.no')}
						</Btn>
					</>
				) : (
					<>
						<Btn onActivate={actions.resume} variant="primary" className="min-w-48">
							{t('pause.resume')}
						</Btn>
						<Btn onActivate={actions.tree} variant="secondary" className="min-w-48">
							{t('menu.workshop')}
						</Btn>
						<Btn onActivate={actions.settings} variant="secondary" className="min-w-48">
							{t('menu.settings')}
						</Btn>
						<Btn
							onActivate={() => setConfirming(true)}
							variant="danger"
							className="min-w-48"
						>
							{t('pause.quit')}
						</Btn>
					</>
				)}
			</footer>
		</FocusScope>
	);
}
