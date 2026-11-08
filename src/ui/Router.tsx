import type { ReactElement } from 'react';
import { Controls, type ControlsActions, type ControlsData } from './components/Controls';
import { HeroScreen, type HeroScreenActions, type HeroScreenData } from './components/HeroScreen';
import { HeroSelect, type HeroSelectActions, type HeroSelectData } from './components/HeroSelect';
import {
	Achievements,
	type AchievementsActions,
	type AchievementsData,
	Extras,
	type ExtrasActions,
	type ExtrasData,
	History,
	type HistoryData,
} from './components/Lists';
import { MainMenu, type MainMenuActions, type MainMenuData } from './components/MainMenu';
import { Settings, type SettingsActions, type SettingsData } from './components/Settings';

/** One menu screen with the data and actions the game provides for it. */
export type MenuView =
	| { screen: 'main-menu'; data: MainMenuData; actions: MainMenuActions }
	| { screen: 'hero-select'; data: HeroSelectData; actions: HeroSelectActions }
	| { screen: 'hero'; data: HeroScreenData; actions: HeroScreenActions }
	| { screen: 'settings'; data: SettingsData; actions: SettingsActions }
	| { screen: 'controls'; data: ControlsData; actions: ControlsActions }
	| { screen: 'achievements'; data: AchievementsData; actions: AchievementsActions }
	| { screen: 'extras'; data: ExtrasData; actions: ExtrasActions }
	| { screen: 'history'; data: HistoryData; actions: { back: () => void } };

export function Router({ view }: { view: MenuView }): ReactElement {
	switch (view.screen) {
		case 'main-menu':
			return <MainMenu data={view.data} actions={view.actions} />;
		case 'hero-select':
			return <HeroSelect data={view.data} actions={view.actions} />;
		case 'hero':
			return <HeroScreen data={view.data} actions={view.actions} />;
		case 'settings':
			return <Settings data={view.data} actions={view.actions} />;
		case 'controls':
			return <Controls data={view.data} actions={view.actions} />;
		case 'achievements':
			return <Achievements data={view.data} actions={view.actions} />;
		case 'extras':
			return <Extras data={view.data} actions={view.actions} />;
		case 'history':
			return <History data={view.data} actions={view.actions} />;
	}
}
