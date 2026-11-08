/**
 * Performance budget check (SDD-001 RF-10, A5): 300 enemies + 2,000 ground decals + lights,
 * 1920×1080 by default, in the arena of `--round` (40 = the 40×40 cap).
 * Opens a real (headed) Chrome so WebGL runs on the GPU — headless Chromium falls back to
 * software rendering and reports single-digit FPS. Needs `bun run dev` running.
 * Usage: bun scripts/perf.ts [--round 40] [--seconds 10] [--width 1920] [--height 1080]
 *        [--tier low|mid|high] [--enemies mix|one] [--base http://localhost:5173]
 */
import { chromium } from 'playwright';

function flag(name: string, fallback: string): string {
	const i = process.argv.indexOf(`--${name}`);
	return i >= 0 && process.argv[i + 1] ? (process.argv[i + 1] as string) : fallback;
}
const base = flag('base', 'http://localhost:5173');
const round = Number(flag('round', '40'));
const seconds = Number(flag('seconds', '10'));
const width = Number(flag('width', '1920'));
const height = Number(flag('height', '1080'));
/** Effects tier for QA (`low|mid|high`); empty = auto-detected. */
const tier = flag('tier', '');
/** `mix` spawns every enemy of the round's pool round-robin (all atlases in use); default clones one. */
const mix = flag('enemies', 'mix') === 'mix';

const browser = await chromium.launch({
	channel: 'chrome',
	headless: false,
	args: ['--mute-audio'],
});
const page = await browser.newPage({ viewport: { width, height } });
const errors: string[] = [];
page.on('pageerror', (e) => errors.push(e.message));
async function open(): Promise<void> {
	await page.goto(
		`${base}/?skipMenu=1&hero=lucia&round=${round}&seed=1&god=1${tier ? `&tier=${tier}` : ''}`,
		{
			waitUntil: 'load',
		},
	);
	await page.waitForFunction(() => {
		const g = (window as unknown as { __GAME__?: import('phaser').Game }).__GAME__;
		return g?.scene.isActive('Game') ?? false;
	});
	await page.waitForTimeout(3000);
}

// A cold dev server reloads the page once after optimizing dependencies, which destroys the
// evaluate context mid-measure: retry once on that error.
async function measure(): Promise<Awaited<ReturnType<typeof sample>>> {
	await open();
	try {
		return await sample();
	} catch (e) {
		if (!String(e).includes('Execution context was destroyed')) throw e;
		await open();
		return await sample();
	}
}

const sample = () =>
	page.evaluate(
		async ({ secs, mix }) => {
			type AnyScene = import('phaser').Scene & Record<string, never>;
			const g = (window as unknown as { __GAME__: import('phaser').Game }).__GAME__;
			const s = g.scene.getScene('Game') as unknown as {
				run: { round: number };
				hero: { x: number; y: number };
				enemies: { active: unknown[]; spawnAt: (d: unknown, x: number, y: number) => void };
				arena: { addDecal: (x: number, y: number, key: string, o?: object) => void };
			} & AnyScene;
			const defs = s.enemies.active.map((e) => (e as { def: unknown }).def);
			const { enemyPoolForRound } = (await import(
				/* @vite-ignore */ '/src/logic/' + 'biome.ts'
			)) as typeof import('../src/logic/biome');
			const pool = mix ? enemyPoolForRound(s.run.round) : [];
			const cycle = pool.length > 0 ? pool : [defs[0]];
			// Fill the horde up to the 300 cap around the hero.
			for (let i = 0; s.enemies.active.length < 300 && i < 1000; i++) {
				const a = Math.random() * Math.PI * 2;
				const r = 150 + Math.random() * 500;
				s.enemies.spawnAt(
					cycle[i % cycle.length],
					s.hero.x + Math.cos(a) * r,
					s.hero.y + Math.sin(a) * r,
				);
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
		},
		{ secs: seconds, mix },
	);

const result = await measure();
await browser.close();
console.log(
	JSON.stringify({
		...result,
		decals: 2000,
		round,
		tier: tier || 'auto',
		mix,
		viewport: `${width}x${height}`,
		errors,
	}),
);
