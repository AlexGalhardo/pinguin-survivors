// Menu screens QA: screenshots of Achievements, Settings, Controls, Heroes, Workshop, History and
// Hero select at 1280x720, 1920x1080 and 2560x1080, and a check that the page itself never scrolls.
// Needs `bun run dev`. Usage: bun scripts/qa-menus.ts <outDir>
import { chromium } from 'playwright';
import { seedSaveScript } from './lib/seed-save';

const out = process.argv[2];
if (!out) throw new Error('usage: bun scripts/qa-menus.ts <outDir>');
const b = await chromium.launch({ args: ['--mute-audio'] });
const VP: [number, number][] = [
	[1280, 720],
	[1920, 1080],
	[2560, 1080],
];
const errs: string[] = [];
for (const [w, h] of VP) {
	const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'en-US' });
	const p = await ctx.newPage();
	await p.addInitScript(seedSaveScript);
	p.on('pageerror', (e) => errs.push(e.message));
	await p.goto('http://localhost:5173/', { waitUntil: 'load' });
	const ui = p.locator('#ui');
	const open = async (name: string | RegExp) => {
		await p.waitForTimeout(300);
		// A menu entry that does not exist (renamed or removed screens) is reported, not fatal.
		try {
			await ui.getByRole('button', { name }).first().click({ timeout: 4000 });
		} catch {
			errs.push(`missing button ${String(name)} at ${w}x${h}`);
		}
		await p.waitForTimeout(500);
	};
	const shot = async (n: string) => {
		await p.screenshot({ path: `${out}/${w}x${h}-${n}.png`, timeout: 90000 });
		const sc = await p.evaluate(() => ({
			doc: document.documentElement.scrollHeight - innerHeight,
			body: document.body.scrollHeight - innerHeight,
		}));
		if (sc.doc > 1 || sc.body > 1)
			errs.push(`PAGE SCROLL ${w}x${h} ${n} ${JSON.stringify(sc)}`);
	};
	await ui.getByText('PLAY').first().waitFor({ timeout: 30000 });
	await open('ACHIEVEMENTS');
	await shot('achievements');
	await p.keyboard.press('Escape');
	await open('SETTINGS');
	await shot('settings');
	await open(/Controls/i);
	await shot('controls');
	await p.keyboard.press('Escape');
	await p.keyboard.press('Escape');
	await open(/HEROES/i);
	await shot('hero');
	await open('MATCH HISTORY');
	await shot('history');
	await p.keyboard.press('Escape');
	await open('PLAY');
	await shot('select');
	/** Shop and pause never scroll or clip: no element may have more content than room. */
	const noClip = async (n: string): Promise<void> => {
		const bad = await p.evaluate(() =>
			[...document.querySelectorAll('#ui *')]
				.filter((el) => el.clientHeight > 0 && el.scrollHeight > el.clientHeight + 1)
				.map(
					(el) =>
						`${el.tagName}.${String(el.className).slice(0, 60)} ${el.scrollHeight}>${el.clientHeight}`,
				)
				.slice(0, 5),
		);
		if (bad.length > 0) errs.push(`CLIPPED ${w}x${h} ${n}: ${bad.join(' | ')}`);
	};
	// In-run screens: the shop and the pause with rarity items and affixes.
	await p.goto(
		'http://localhost:5173/?skipMenu=1&hero=jack&round=8&seed=3&god=1&weapons=machete:2,hammer:3,knives,auxPistol:2,iceShards,molotov',
		{ waitUntil: 'load' },
	);
	const G = "window.__GAME__.scene.getScene('Game')";
	await p.waitForFunction(`window.__GAME__ && ${G}.run`, null, { timeout: 30000 });
	await p.waitForTimeout(2500);
	await p.evaluate(
		`(() => { const s = ${G}; const g = s.run.gear; g.equipped.helmet = 'helmet.miner'; g.equipped.armor = 'armor.kevlar'; g.bag.push('helmet.crown', 'legs.skates'); g.rolls = { 'helmet.miner': { rarity: 3, affixes: [{ stat: 'maxHp', value: 7 }, { stat: 'dodge', value: 0.012 }] }, 'armor.kevlar': { rarity: 2, affixes: [{ stat: 'regen', value: 0.2 }] }, 'helmet.crown': { rarity: 5, affixes: [{ stat: 'damage', value: 0.06 }, { stat: 'crit', value: 0.02 }, { stat: 'luck', value: 0.03 }, { stat: 'armor', value: 1.4 }] } }; s.run.fish = 400; s.pause(); })()`,
	);
	await p.waitForTimeout(900);
	await shot('pause');
	await noClip('pause');
	await p.keyboard.press('Escape');
	await p.evaluate(`(() => { const s = ${G}; s.run.timeLeft = 0; })()`);
	await p.waitForFunction(`${G}.run.phase === 'shop'`, null, { timeout: 30000 });
	await p.waitForTimeout(1200);
	await shot('shop');
	await noClip('shop');
	// A gear offer for the slot that is already worn: the explanation shows both items side by side.
	await p.evaluate(
		`(() => { const s = ${G}; s.run.fish = 900; s.run.shop.offers[0] = { kind: 'gear', id: 'helmet.crown', tier: 3, price: 60, affixes: [{ stat: 'damage', value: 0.05 }, { stat: 'crit', value: 0.02 }] }; s.publishShopView(); })()`,
	);
	await p.waitForTimeout(600);
	await ui.getByRole('button', { name: /BUY/ }).first().hover();
	await p.waitForTimeout(500);
	await shot('shop-compare');
	await noClip('shop-compare');
	await ctx.close();
}
console.log('issues', errs);
await b.close();
