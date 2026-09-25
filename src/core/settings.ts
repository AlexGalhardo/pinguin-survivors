/** Player settings (persisted by the SaveSystem). */
export interface Settings {
	sfxVolume: number;
	musicVolume: number;
	fullscreen: boolean;
	screenShake: boolean;
	damageNumbers: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
	sfxVolume: 0.7,
	musicVolume: 0.5,
	fullscreen: false,
	screenShake: true,
	damageNumbers: true,
};

/** In-memory current settings shared by every scene. */
export const settings: Settings = { ...DEFAULT_SETTINGS };

export function applySettings(next: Partial<Settings>): void {
	Object.assign(settings, next);
}
