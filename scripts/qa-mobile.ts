// Mobile layout QA (SDD-007 RF-04): screenshots of menu, HUD, shop and pause on phone-landscape
// and tablet viewports with touch emulation and `?touch=1`. Audio is muted. Needs `bun run dev`.
// Usage: bun scripts/qa-mobile.ts <outDir> [baseUrl=http://localhost:5173]
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import { seedSaveScript } from './lib/seed-save';

const out = process.argv[2];
if (!out) throw new Error('usage: bun scripts/qa-mobile.ts <outDir> [baseUrl]');
const base = process.argv[3] ?? 'http://localhost:5173';
mkdirSync(out, { recursive: true });

const VIEWPORTS = [
	{ name: '844x390', width: 844, height: 390 },
	{ name: '915x412', width: 915, height: 412 },
	{ name: '1280x720', width: 1280, height: 720 },
];
const G = "window.__GAME__.scene.getScene('Game')";

const browser = await chromium.launch({ args: ['--mute-audio'] });
for (const v of VIEWPORTS) {
	const ctx = await browser.newContext({
		viewport: { width: v.width, height: v.height },
		isMobile: true,
		hasTouch: true,
		deviceScaleFactor: 1,
	});
	const page = await ctx.newPage();
	await page.addInitScript(seedSaveScript);
	const errors: string[] = [];
	page.on('pageerror', (e) => errors.push(e.message));
	await page.goto(`${base}/?touch=1`, { waitUntil: 'load' });
	await page
		.locator('#ui')
		.getByText('PLAY')
		.first()
		.waitFor({ state: 'visible', timeout: 20000 });
	await page.waitForTimeout(800);
	await page.screenshot({ path: `${out}/${v.name}-menu.png` });

	await page.goto(
		`${base}/?touch=1&skipMenu=1&hero=jack&round=5&seed=1&god=1&weapons=machete:3,knives:2,auxPistol,iceShards:4,flameRing,molotov`,
		{ waitUntil: 'load' },
	);
	await page.waitForFunction(`window.__GAME__ && ${G}.run`, null, { timeout: 20000 });
	await page.waitForTimeout(3000);
	await page.screenshot({ path: `${out}/${v.name}-hud.png` });
	await page.evaluate(`${G}.pause()`);
	await page.waitForTimeout(800);
	await page.screenshot({ path: `${out}/${v.name}-pause.png` });
	await page.evaluate(`${G}.closeReactPause()`);
	await page.evaluate(`${G}.run.fish = 300; ${G}.run.timeLeft = 0`);
	await page.waitForFunction(`${G}.run.phase === 'shop'`, null, { timeout: 20000 });
	await page.waitForTimeout(1200);
	await page.screenshot({ path: `${out}/${v.name}-shop.png` });
	console.log(v.name, 'errors', errors.length, errors.slice(0, 2));
	await ctx.close();
}
await browser.close();
