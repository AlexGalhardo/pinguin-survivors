/// <reference types="vite/client" />

interface ImportMetaEnv {
	/** "true" mutes every sound (set in .env). */
	readonly SOUND_MUTED?: string;
	/** "1" or "true" builds the demo (SDD-006). */
	readonly VITE_DEMO?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

/** package.json version injected by Vite (SemVer build shown in the footer). */
declare const __APP_VERSION__: string;
/** Unique per build; busts the HTTP cache of the unhashed files in public/assets. */
declare const __BUILD_ID__: string;
declare const __BUILD_NAME__: string;
/** True when public/assets/atlas/ (group atlases) exists at build time (final art available). */
declare const __HAS_ATLAS__: boolean;

/** Files present in public/assets at build/dev-server start (paths relative to public/). */
declare const __ASSET_FILES__: readonly string[];
