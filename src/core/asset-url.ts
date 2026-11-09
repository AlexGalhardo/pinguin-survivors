/**
 * Asset URL with the build id. Files in public/assets keep their names between builds and GitHub
 * Pages caches them for 10 minutes, so without it a deploy could pair new code with a stale atlas
 * (frames missing, drawn as placeholders). Tests and tools without the Vite define get the bare URL.
 */
export function assetUrl(url: string): string {
	return typeof __BUILD_ID__ === 'undefined' ? url : `${url}?v=${__BUILD_ID__}`;
}
