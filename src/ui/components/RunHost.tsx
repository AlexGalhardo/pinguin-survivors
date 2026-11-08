import { type ReactElement, useSyncExternalStore } from 'react';
import { platform } from '../../core/platform';
import { STEAM_URL } from '../../data/demo';
import { commands } from '../commands';
import { playerStore } from '../player-bridge';
import { dismissUnlock, publishUnlock, runUiStore } from '../run-bridge';
import { uiStore } from '../store';
import { DemoEnd } from './DemoEnd';
import { GameOver } from './GameOver';
import { LevelUpCards } from './LevelUpCards';
import { Pause } from './Pause';
import { Unlock } from './Unlock';

/** In-run React screens: level-up cards, pause, unlock notices and the run summary. */
export function RunHost(): ReactElement | null {
	const s = useSyncExternalStore(runUiStore.subscribe, () => runUiStore.get());
	const screen = useSyncExternalStore(uiStore.subscribe, () => uiStore.get().screen);
	const panel = useSyncExternalStore(playerStore.subscribe, () => playerStore.get().panel);
	if (s.unlock)
		return <Unlock data={s.unlock} actions={{ dismiss: () => publishUnlock(null) }} />;
	if (s.demoEnd)
		return (
			<DemoEnd
				data={s.demoEnd}
				actions={{
					wishlist: () => platform().openUrl(STEAM_URL),
					playAgain: commands.playAgain,
					menu: commands.backToMenu,
				}}
			/>
		);
	if (s.over) {
		const unlock = s.over.unlocks[0];
		if (unlock)
			return (
				<Unlock
					key={s.over.unlocks.length}
					data={unlock}
					actions={{ dismiss: dismissUnlock }}
				/>
			);
		return (
			<GameOver
				data={s.over.over}
				actions={{ playAgain: commands.playAgain, menu: commands.backToMenu }}
			/>
		);
	}
	if (s.levelUp)
		return (
			<LevelUpCards
				data={s.levelUp}
				actions={{ pick: commands.pickCard, reroll: commands.rerollCards }}
			/>
		);
	// Settings opened from the pause menu replace it until Back.
	if (s.pause && screen === 'none')
		return (
			<Pause
				data={s.pause}
				panel={panel}
				actions={{
					resume: commands.resume,
					settings: commands.pauseSettings,
					equip: commands.equip,
					unequip: commands.unequip,
					quit: commands.quitRun,
				}}
			/>
		);
	return null;
}
