/// <reference types="vite/client" />

interface ImportMetaEnv {
	/** "true" mutes every sound (set in .env). */
	readonly SOUND_MUTED?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
