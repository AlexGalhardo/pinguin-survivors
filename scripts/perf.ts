/**
 * Performance budget check (PLAN 3.3): 300 enemies + 2,000 ground decals + lights at 2560×1080.
 * Opens a real (headed) Chrome so WebGL runs on the GPU — headless Chromium falls back to
 * software rendering and reports single-digit FPS. Needs `bun run dev` running.
 * Usage: bun scripts/perf.ts [baseUrl=http://localhost:5173] [seconds=10]
 */
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://localhost:5173';
const seconds = Number(process.argv[3] ?? 10);

const browser = await chromium.launch({ channel: 'chrome', headless: false });
const page = await browser.newPage({ viewport: { width: 2560, height: 1080 } });
const errors: string[] = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`${base}/?skipMenu=1&hero=lucia&round=40&seed=1&god=1`, { waitUntil: 'load' });
await page.waitForFunction(() => {
	const g = (window as unknown as { __GAME__?: import('phaser').Game }).__GAME__;
	return g?.scene.isActive('Game') ?? false;
});
await page.waitForTimeout(3000);

const result = await page.evaluate(async (secs) => {
	type AnyScene = import('phaser').Scene & Record<string, never>;
	const g = (window as unknown as { __GAME__: import('phaser').Game }).__GAME__;
	const s = g.scene.getScene('Game') as unknown as {
		hero: { x: number; y: number };
		enemies: { active: unknown[]; spawnAt: (d: unknown, x: number, y: number) => void };
		arena: { addDecal: (x: number, y: number, key: string, o?: object) => void };
	} & AnyScene;
	const defs = s.enemies.active.map((e) => (e as { def: unknown }).def);
	const def = defs[0];
	// Fill the horde up to the 300 cap around the hero.
	for (let i = 0; s.enemies.active.length < 300 && i < 1000; i++) {
		const a = Math.random() * Math.PI * 2;
		const r = 150 + Math.random() * 500;
		s.enemies.spawnAt(def, s.hero.x + Math.cos(a) * r, s.hero.y + Math.sin(a) * r);
	}
	for (let i = 0; i < 2000; i++) {
		const a = Math.random() * Math.PI * 2;
		const r = Math.random() * 700;
		s.arena.addDecal(
			s.hero.x + Math.cos(a) * r,
			s.hero.y + Math.sin(a) * r,
			`fx.splat.blood.${i % 4}`,
		);
	}
	const samples: number[] = [];
	const t0 = performance.now();
	let last = t0;
	await new Promise<void>((done) => {
		const tick = (now: number) => {
			samples.push(now - last);
			last = now;
			if (now - t0 < secs * 1000) requestAnimationFrame(tick);
			else done();
		};
		requestAnimationFrame(tick);
	});
	samples.sort((a, b) => a - b);
	const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
	const p95 = samples[Math.floor(samples.length * 0.95)] ?? 0;
	return {
		enemies: s.enemies.active.length,
		avgFps: Math.round(1000 / avg),
		p95FrameMs: Math.round(p95 * 10) / 10,
		frames: samples.length,
	};
}, seconds);

await browser.close();
console.log(JSON.stringify({ ...result, decals: 2000, viewport: '2560x1080', errors }));
