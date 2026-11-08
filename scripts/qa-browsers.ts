/**
 * Cross-browser QA of the React UI flow (Chrome, Edge, Firefox via Playwright): main menu → play →
 * hero select → run (~20 s) → forced shop → next round → pause → quit → game over → menu, with a
 * fresh save per browser. Collects console errors, page errors and 4xx/5xx responses.
 *
 * Needs `bun run dev` on http://localhost:5173 (dev build: the flow forces the round end through
 * the dev-only `window.__GAME__` handle, as scripts/e2e.ts does), Chrome and Edge installed, and
 * Playwright's Firefox (`bunx playwright install firefox`, once). Audio is muted everywhere
 * (--mute-audio; Firefox media.volume_scale 0).
 *
 * Usage: bun scripts/qa-browsers.ts [baseUrl=http://localhost:5173] [--out <dir>] [--report <file.md>]
 * Prints one JSON line per browser; exits 1 when any browser has an error or a 4xx/5xx.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { type Browser, chromium, firefox, type Page } from 'playwright';

const args = process.argv.slice(2);
const option = (name: string): string | undefined => {
	const i = args.indexOf(name);
	return i >= 0 ? args[i + 1] : undefined;
};
const base =
	args.find(
		(a, i) => !a.startsWith('--') && args[i - 1] !== '--out' && args[i - 1] !== '--report',
	) ?? 'http://localhost:5173';
const outDir = option('--out') ?? tmpdir();
const reportPath = option('--report');
mkdirSync(outDir, { recursive: true });

const targets: [string, () => Promise<Browser>][] = [
	['chrome', () => chromium.launch({ channel: 'chrome', args: ['--mute-audio'] })],
	['edge', () => chromium.launch({ channel: 'msedge', args: ['--mute-audio'] })],
	['firefox', () => firefox.launch({ firefoxUserPrefs: { 'media.volume_scale': '0.0' } })],
];

interface Result {
	browser: string;
	version: string;
	steps: string[];
	fps: number;
	noScroll: boolean;
	webgl: boolean;
	errors: string[];
	failed: string[];
	flowError?: string;
}

/** Runs `script` against the live Game scene (dev-only handle). */
const game = <T>(page: Page, script: string): Promise<T> =>
	page.evaluate(
		`(function(g){ ${script} })(window.__GAME__.scene.getScene('Game'))`,
	) as Promise<T>;

async function see(page: Page, text: string | RegExp, timeout = 20000): Promise<void> {
	await page.locator('#ui').getByText(text).first().waitFor({ state: 'visible', timeout });
}

async function click(page: Page, name: string | RegExp): Promise<void> {
	// Screens mount in two renders (focus scope): let them settle before clicking.
	await page.waitForTimeout(500);
	await page.locator('#ui').getByRole('button', { name }).first().click();
}

async function waitRound(page: Page, round: number): Promise<void> {
	await page.waitForFunction(
		(n) => {
			const g = (window as unknown as { __GAME__: import('phaser').Game }).__GAME__;
			if (!g.scene.isActive('Game')) return false;
			const s = g.scene.getScene('Game') as unknown as { run?: { round: number } };
			return s.run?.round === n;
		},
		round,
		{ timeout: 20000 },
	);
}

async function dismissUnlocks(page: Page): Promise<void> {
	await page.waitForTimeout(800);
	for (let i = 0; i < 6; i++) {
		const next = page.locator('#ui').getByRole('button', { name: 'CONTINUE' }).first();
		if (!(await next.isVisible())) return;
		await next.click();
		await page.waitForTimeout(400);
	}
}

async function runFlow(name: string, launch: () => Promise<Browser>): Promise<Result> {
	const browser = await launch();
	const page = await browser.newPage({ viewport: { width: 1366, height: 768 }, locale: 'en-US' });
	const result: Result = {
		browser: name,
		version: browser.version(),
		steps: [],
		fps: 0,
		noScroll: false,
		webgl: false,
		errors: [],
		failed: [],
	};
	page.on('pageerror', (e) => result.errors.push(e.message.slice(0, 200)));
	page.on('console', (m) => {
		if (m.type() === 'error') result.errors.push(m.text().slice(0, 200));
	});
	page.on('response', (r) => {
		if (r.status() >= 400) result.failed.push(`${r.status()} ${r.url()}`);
	});
	const step = (label: string): void => {
		result.steps.push(label);
	};
	try {
		await page.goto(base, { waitUntil: 'load' });
		await page.waitForFunction(() => '__GAME__' in window, undefined, { timeout: 30000 });
		await see(page, 'PLAY');
		step('menu');
		const menu = await page.evaluate(() => {
			const canvas = document.querySelector('canvas') as HTMLCanvasElement;
			const root = document.documentElement;
			return {
				noScroll: root.scrollWidth <= innerWidth && root.scrollHeight <= innerHeight,
				webgl: Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl')),
			};
		});
		result.noScroll = menu.noScroll;
		result.webgl = menu.webgl;
		await page.screenshot({ path: join(outDir, `qa-${name}-menu.png`) });

		// The menu can still be booting under the first click.
		for (
			let i = 0;
			i < 4 && !(await page.locator('#ui').getByText('START RUN').first().isVisible());
			i++
		)
			await click(page, 'PLAY');
		await see(page, 'START RUN');
		step('hero select');
		await click(page, 'START RUN');
		await waitRound(page, 1);
		step('run started');
		await game(page, 'g.combat.god = true;');

		// ~20 s of play: walk, measure FPS over 300 frames.
		await page.keyboard.down('KeyD');
		result.fps = await page.evaluate(async () => {
			const t: number[] = [];
			await new Promise<void>((done) => {
				const frame = (now: number) => {
					t.push(now);
					if (t.length < 300) requestAnimationFrame(frame);
					else done();
				};
				requestAnimationFrame(frame);
			});
			const span = (t[t.length - 1] ?? 0) - (t[0] ?? 0);
			return Number((1000 / (span / (t.length - 1))).toFixed(1));
		});
		await page.waitForTimeout(15000);
		await page.keyboard.up('KeyD');
		await page.screenshot({ path: join(outDir, `qa-${name}-game.png`) });
		step('played ~20 s');

		// Round end: the cards (if a level-up is pending) come first, then the shop.
		await game(page, 'g.run.timeLeft = 0;');
		const ui = page.locator('#ui');
		for (let i = 0; i < 80 && !(await ui.getByText('NEXT ROUND').first().isVisible()); i++) {
			if (
				await ui
					.getByText(/LEVEL UP/)
					.first()
					.isVisible()
			) {
				step('level-up cards');
				await page.waitForTimeout(500);
				await ui.locator('div.grid button').first().click();
			}
			await page.waitForTimeout(250);
		}
		await see(page, 'NEXT ROUND', 2000);
		await page.screenshot({ path: join(outDir, `qa-${name}-shop.png`) });
		step('shop');
		await click(page, 'NEXT ROUND');
		await waitRound(page, 2);
		step('round 2');

		await page.waitForTimeout(400);
		await page.keyboard.press('Escape');
		await see(page, 'PAUSED');
		await page.screenshot({ path: join(outDir, `qa-${name}-pause.png`) });
		step('pause');
		await click(page, 'QUIT RUN');
		await click(page, 'YES, QUIT');
		await dismissUnlocks(page);
		await see(page, 'YOU DIED');
		step('game over');
		await click(page, 'MAIN MENU');
		await see(page, 'PLAY');
		step('back to the menu');
	} catch (error) {
		result.flowError = `${result.steps.at(-1) ?? 'start'} -> ${(error as Error).message.split('\n')[0]}`;
		await page
			.screenshot({ path: join(outDir, `qa-${name}-failure.png`) })
			.catch(() => undefined);
	}
	await browser.close();
	return result;
}

const results: Result[] = [];
for (const [name, launch] of targets) {
	const result = await runFlow(name, launch);
	results.push(result);
	console.log(JSON.stringify(result));
}

// Resolutions: full-window canvas, no scroll, from 1366×768 to 4K, ultrawide and Retina (Chrome).
const RESOLUTIONS: [string, number, number, number][] = [
	['1366x768', 1366, 768, 1],
	['1920x1080', 1920, 1080, 1],
	['2560x1080-ultrawide', 2560, 1080, 1],
	['2560x1440', 2560, 1440, 1],
	['3840x2160', 3840, 2160, 1],
	['1440x900-retina', 1440, 900, 2],
];
const shell = await chromium.launch({ args: ['--mute-audio'] });
const layouts: string[] = [];
for (const [label, width, height, dpr] of RESOLUTIONS) {
	const page = await shell.newPage({
		viewport: { width, height },
		deviceScaleFactor: dpr,
		locale: 'en-US',
	});
	const errors: string[] = [];
	page.on('pageerror', (e) => errors.push(e.message));
	await page.goto(base, { waitUntil: 'load' });
	await page.waitForFunction(() => document.querySelector('canvas') !== null);
	await page.waitForTimeout(1500);
	const layout = await page.evaluate(() => {
		const canvas = document.querySelector('canvas') as HTMLCanvasElement;
		const rect = canvas.getBoundingClientRect();
		const root = document.documentElement;
		return {
			noScroll: root.scrollWidth <= innerWidth && root.scrollHeight <= innerHeight,
			fillsWindow:
				Math.abs(rect.width - innerWidth) <= 1 && Math.abs(rect.height - innerHeight) <= 1,
			backing: `${canvas.width}x${canvas.height}`,
		};
	});
	await page.screenshot({ path: join(outDir, `qa-res-${label}.png`) });
	console.log(JSON.stringify({ resolution: label, dpr, ...layout, errors }));
	layouts.push(
		`| ${label} | ${dpr} | ${layout.noScroll ? 'yes' : 'NO'} | ${layout.fillsWindow ? 'yes' : 'NO'} | ${errors.length} |`,
	);
	await page.close();
}
await shell.close();

const bad = results.some((r) => r.flowError || r.errors.length > 0 || r.failed.length > 0);

if (reportPath) {
	const rows = results.map(
		(r) =>
			`| ${r.browser} ${r.version} | ${r.flowError ? `FAIL: ${r.flowError}` : 'ok'} | ${r.errors.length} | ${r.failed.length} | ${r.fps} | ${r.noScroll ? 'yes' : 'NO'} | ${r.webgl ? 'yes' : 'NO'} |`,
	);
	const details = results
		.filter((r) => r.errors.length > 0 || r.failed.length > 0)
		.map(
			(r) =>
				`### ${r.browser}\n\n${[...r.errors, ...r.failed].map((e) => `- ${e}`).join('\n')}\n`,
		)
		.join('\n');
	writeFileSync(
		reportPath,
		`# QA cross-browser (${new Date().toISOString().slice(0, 10)})

Fluxo React (menu, jogar, seleção, run de ~20 s, loja forçada, próximo round, pausa, desistir, game over, menu) por \`bun scripts/qa-browsers.ts\` contra o dev server mudo (\`${base}\`), 1366×768, save novo por navegador. Chrome e Edge com \`--mute-audio\`; Firefox com \`media.volume_scale 0\`.

| Navegador | Fluxo | Erros de console/página | Respostas 4xx/5xx | FPS | Sem scroll | WebGL |
|---|---|---|---|---|---|---|
${rows.join('\n')}

Resultado: ${bad ? 'FALHOU' : 'zero erros e zero 4xx/5xx nos 3 navegadores'}.

${details}## Resoluções (Chrome)

| Resolução | DPR | Sem scroll | Canvas preenche a janela | Erros |
|---|---|---|---|---|
${layouts.join('\n')}
`,
	);
	console.log(`report: ${reportPath}`);
}
process.exit(bad ? 1 : 0);
