export function buildLabel(version: string, dev: boolean, name = ''): string {
	const label = name ? `v${version} · ${name}` : `v${version}`;
	return dev ? `${label} (dev)` : label;
}
