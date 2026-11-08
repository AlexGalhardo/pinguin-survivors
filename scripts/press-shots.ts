// Press-kit screenshots (docs/site.md §8): 1920x1080 captures of the real game, muted, saved as
// JPEG in site/public/press/screenshots/. Needs a dev server: `bunx --bun vite --port 5173`.
// Usage: bun scripts/press-shots.ts [--url http://localhost:5173]
import { chromium } from 'playwright';

const i = process.argv.indexOf('--url');
const base = i >= 0 ? (process.argv[i + 1] as string) : 'http://localhost:5173';
const out = 'site/public/press/screenshots';

const browser = await chromium.launch({
	channel: 'chrome',
	headless: true,
	args: ['--mute-audio'],
});
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, locale: 'en-US' });
page.on('pageerror', (e) => console.error(`[pageerror] ${e.message}`));

const shot = async (name: string) => {
	await page.screenshot({ path: `${out}/${name}.jpg`, type: 'jpeg', quality: 86 });
	console.log(`shot ${name}`);
};
const game = (fn: string) => page.evaluate(`(${fn})(window.__GAME__.scene.getScene('Game'))`);

await page.goto(base, { waitUntil: 'load' });
await page.waitForFunction(() => '__GAME__' in window);
// The menu art loads late on a cold dev server: wait until the frame is not just panels on black.
for (let attempt = 0; attempt < 6; attempt++) {
	await page.waitForTimeout(3000);
	if ((await page.screenshot({ type: 'jpeg', quality: 86 })).length > 150_000) break;
}
await shot('menu');

/** A dev-server reload can blank a frame: retry until the shot is not near-empty. */
async function gameplay(name: string, query: string): Promise<void> {
	for (let attempt = 0; attempt < 4; attempt++) {
		await page.goto(`${base}/?skipMenu=1&${query}`, { waitUntil: 'load' });
		await page.waitForFunction(() => '__GAME__' in window);
		await page.waitForTimeout(11000);
		const buf = await page.screenshot({ type: 'jpeg', quality: 86 });
		if (buf.length > 40_000) {
			await Bun.write(`${out}/${name}.jpg`, buf);
			console.log(`shot ${name}`);
			return;
		}
	}
	throw new Error(`${name}: the game never rendered`);
}

await gameplay(
	'jack-horde',
	'hero=jack&round=8&seed=11&god=1&weapons=machete:3,knives:2,hammer:2,fishBoomerang:2',
);
await gameplay(
	'lucia-magic',
	'hero=lucia&round=14&seed=5&god=1&weapons=elementStaff:3,flameRing:2,iceShards:2,lightningTotem:2',
);

await page.goto(
	`${base}/?skipMenu=1&hero=bob&round=5&seed=3&god=1&weapons=doubleBarrel:2,auxPistol:2`,
	{
		waitUntil: 'load',
	},
);
await page.waitForFunction(() => '__GAME__' in window);
await page.waitForTimeout(6000);
await game('(g) => { g.run.fish = 300; g.run.pendingLevelUps = 1; g.run.timeLeft = 0; }');
await page
	.locator('#ui')
	.getByText(/LEVEL UP/)
	.first()
	.waitFor({ state: 'visible', timeout: 15000 });
await page.waitForTimeout(900);
await shot('level-up');
await page.locator('#ui div.grid button').first().click();
await page
	.locator('#ui')
	.getByText('NEXT ROUND')
	.first()
	.waitFor({ state: 'visible', timeout: 15000 });
await page.waitForTimeout(1200);
await shot('shop');

await browser.close();
