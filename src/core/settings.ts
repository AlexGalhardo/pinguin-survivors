/** Player settings (persisted by the SaveSystem). */
export interface Settings {
	sfxVolume: number;
	musicVolume: number;
	fullscreen: boolean;
	screenShake: boolean;
	damageNumbers: boolean;
	/** Accessibility: no white hit flashes and softer effects. */
	reduceFlashes: boolean;
	/** Damage number scale (1 = small, 2 = large). */
	damageTextSize: number;
	/** Pause the run when the window loses focus. */
	pauseOnBlur: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
	sfxVolume: 0.7,
	musicVolume: 0.5,
	fullscreen: false,
	screenShake: true,
	damageNumbers: true,
	reduceFlashes: false,
	damageTextSize: 1,
	pauseOnBlur: true,
};

/** In-memory current settings shared by every scene. */
export const settings: Settings = { ...DEFAULT_SETTINGS };

export function applySettings(next: Partial<Settings>): void {
	Object.assign(settings, next);
}
