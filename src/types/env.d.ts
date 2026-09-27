/// <reference types="vite/client" />

interface ImportMetaEnv {
	/** "true" mutes every sound (set in .env). */
	readonly SOUND_MUTED?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

/** package.json version injected by Vite (SemVer build shown in the footer). */
declare const __APP_VERSION__: string;
/** True when public/assets/atlas.json exists at build time (final art available). */
declare const __HAS_ATLAS__: boolean;
