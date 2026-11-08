import { type ReactElement, useSyncExternalStore } from 'react';
import { commands } from '../commands';
import { dismissUnlock, runUiStore } from '../run-bridge';
import { uiStore } from '../store';
import { GameOver } from './GameOver';
import { LevelUpCards } from './LevelUpCards';
import { Pause } from './Pause';
import { Unlock } from './Unlock';

/** In-run React screens: level-up cards, pause, unlock notices and the run summary. */
export function RunHost(): ReactElement | null {
	const s = useSyncExternalStore(runUiStore.subscribe, () => runUiStore.get());
	const screen = useSyncExternalStore(uiStore.subscribe, () => uiStore.get().screen);
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
				actions={{
					resume: commands.resume,
					settings: commands.pauseSettings,
					quit: commands.quitRun,
				}}
			/>
		);
	return null;
}
