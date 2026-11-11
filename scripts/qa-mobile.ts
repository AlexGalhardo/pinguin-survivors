// Mobile layout QA (SDD-007 RF-04, ROADMAP T8.2): screenshots and checks of the main menu, save slots,
// hero select, skill tree, HUD, pause and shop on phone-landscape and tablet viewports with touch
// emulation and `?touch=1`. Audio is muted. Needs `bun run dev`.
//
// Checks per screen: the page never scrolls, no panel shows a scrollbar, the shop and pause never
// clip their content, and the HUD (potion, Super Magic) does not overlap the touch controls.
// Usage: bun scripts/qa-mobile.ts <outDir> [baseUrl=http://localhost:5173]
import { mkdirSync } from 'node:fs';
import { chromium, type Page } from 'playwright';
import { seedSaveScript } from './lib/seed-save';

const out = process.argv[2];
if (!out) throw new Error('usage: bun scripts/qa-mobile.ts <outDir> [baseUrl]');
const base = process.argv[3] ?? 'http://localhost:5173';
mkdirSync(out, { recursive: true });

const VIEWPORTS = [
	{ name: '844x390', width: 844, height: 390, dpr: 1 },
	{ name: '915x412', width: 915, height: 412, dpr: 1 },
	{ name: '1280x720', width: 1280, height: 720, dpr: 1 },
	// 2400x1080 device pixels at DPR 3 (a 6.7" phone in landscape).
	{ name: '2400x1080-dpr3', width: 800, height: 360, dpr: 3 },
];
const G = "window.__GAME__.scene.getScene('Game')";
const issues: string[] = [];

/** Page scroll, visible scrollbars and (for `fit` screens) clipped content. */
async function check(page: Page, tag: string, fit: boolean): Promise<void> {
	const r = await page.evaluate((fitScreen) => {
		const ui = [...document.querySelectorAll('#ui *')];
		return {
			pageScroll:
				document.documentElement.scrollHeight > innerHeight + 1 ||
				document.documentElement.scrollWidth > innerWidth + 1,
			bars: ui
				.filter((el) => {
					const cs = getComputedStyle(el);
					if (!/(auto|scroll)/.test(cs.overflowY + cs.overflowX)) return false;
					const borders =
						Number.parseFloat(cs.borderLeftWidth) +
						Number.parseFloat(cs.borderRightWidth);
					return (
						el.clientWidth > 0 &&
						(el as HTMLElement).offsetWidth - el.clientWidth - borders > 2 &&
						cs.scrollbarWidth !== 'none'
					);
				})
				.map((el) => String(el.className).slice(0, 50))
				.slice(0, 3),
			clipped: fitScreen
				? ui
						.filter(
							(el) => el.clientHeight > 0 && el.scrollHeight > el.clientHeight + 1,
						)
						.map(
							(el) =>
								`${el.tagName}.${String(el.className).slice(0, 40)} ${el.scrollHeight}>${el.clientHeight}`,
						)
						.slice(0, 4)
				: [],
		};
	}, fit);
	if (r.pageScroll) issues.push(`${tag}: the page scrolls`);
	if (r.bars.length) issues.push(`${tag}: visible scrollbar ${r.bars.join(' | ')}`);
	if (r.clipped.length) issues.push(`${tag}: clipped ${r.clipped.join(' | ')}`);
}

/** HUD blocks versus touch controls: no overlap, every touch target at least 44 px. */
async function checkHud(page: Page, tag: string): Promise<void> {
	const r = await page.evaluate(() => {
		const rect = (el: Element) => el.getBoundingClientRect();
		const touch = [...document.querySelectorAll('[data-touch]')].map((el) => ({
			name: (el as HTMLElement).dataset.touch ?? '',
			r: rect(el),
		}));
		const hud = [...document.querySelectorAll('#ui [data-hud]')].map((el) => ({
			name: (el as HTMLElement).dataset.hud ?? '',
			r: rect(el),
		}));
		const hit = (a: DOMRect, b: DOMRect) =>
			a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
		const clash: string[] = [];
		for (const h of hud)
			for (const t of touch) if (hit(h.r, t.r)) clash.push(`${h.name} x ${t.name}`);
		const small = touch.filter((t) => t.r.width < 44 || t.r.height < 44).map((t) => t.name);
		return { clash, small, hud: hud.map((h) => h.name) };
	});
	if (r.clash.length) issues.push(`${tag}: HUD overlaps touch controls ${r.clash.join(', ')}`);
	if (r.small.length) issues.push(`${tag}: touch target under 44 px ${r.small.join(', ')}`);
}

const browser = await chromium.launch({ args: ['--mute-audio'] });
for (const v of VIEWPORTS) {
	const ctx = await browser.newContext({
		viewport: { width: v.width, height: v.height },
		isMobile: true,
		hasTouch: true,
		deviceScaleFactor: v.dpr,
	});
	const page = await ctx.newPage();
	await page.addInitScript(seedSaveScript);
	page.on('pageerror', (e) => issues.push(`${v.name}: page error ${e.message}`));
	const ui = page.locator('#ui');
	const shot = async (name: string, fit = false): Promise<void> => {
		await page.waitForTimeout(700);
		await page.screenshot({ path: `${out}/${v.name}-${name}.png`, timeout: 90000 });
		await check(page, `${v.name} ${name}`, fit);
	};
	const tap = async (name: string | RegExp): Promise<void> => {
		await page.waitForTimeout(300);
		try {
			await ui.getByRole('button', { name }).first().tap({ timeout: 5000 });
		} catch {
			issues.push(`${v.name}: button ${String(name)} not found`);
		}
		await page.waitForTimeout(400);
	};

	const toMenu = async (): Promise<void> => {
		await page.goto(`${base}/?touch=1`, { waitUntil: 'load' });
		await ui.getByText('PLAY').first().waitFor({ state: 'visible', timeout: 30000 });
	};
	await toMenu();
	await shot('menu');
	await tap('NEW GAME');
	await shot('slots');
	await toMenu();
	await tap('SKILL TREE');
	await shot('tree');
	await toMenu();
	await tap('PLAY');
	await shot('select');

	await page.goto(
		`${base}/?touch=1&skipMenu=1&hero=jack&round=4&seed=1&god=1&weapons=machete:3,knives:2,auxPistol,iceShards:4,flameRing,molotov`,
		{ waitUntil: 'load' },
	);
	await page.waitForFunction(`window.__GAME__ && ${G}.run`, null, { timeout: 30000 });
	await page.waitForTimeout(3000);
	// A heal potion and a charging Super Magic, so every HUD block is on screen at once.
	await page.evaluate(
		`${G}.level.level = 6; ${G}.run.superCharge = 60; ${G}.run.healPotion = { level: 2, charges: 3, rarity: 2, kills: 4 }`,
	);
	await page.waitForTimeout(800);
	await shot('hud');
	await checkHud(page, `${v.name} hud`);
	await page.evaluate(`${G}.pause()`);
	await shot('pause', true);
	await page.evaluate(`${G}.closeReactPause()`);
	await page.evaluate(`${G}.run.fish = 300; ${G}.run.timeLeft = 0`);
	await page.waitForFunction(`${G}.run.phase === 'shop'`, null, { timeout: 30000 });
	await shot('shop', true);
	await ctx.close();
}
await browser.close();
console.log('issues', issues.length ? issues : 'none');
