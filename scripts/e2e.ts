/**
 * End-to-end flow test (React UI is the only UI): main menu → hero select → run → round end →
 * level-up card → shop (buy, reroll, lock) → next round → pause (equipment, settings, Esc) →
 * quit → game over → main menu → match history, with a fresh save and zero page errors.
 * The round timer, the death and the boss are forced through the dev-only `window.__GAME__`
 * handle (headless WebGL is too slow to play a round for real). Audio is muted.
 *
 * Usage:
 *   bun run e2e                 needs `bun run dev` on http://localhost:5173
 *   bun run e2e -- --demo       starts its own dev server with VITE_DEMO=1 on port 5199 and
 *                               checks the demo (SDD-006 A2, A3): hero gate, DemoEnd, wishlist link
 *   bun scripts/e2e.ts [baseUrl] [--demo]
 * Exits with code 1 on the first failed step.
 */
import { chromium } from 'playwright';
import { seedSaveScript } from './lib/seed-save';

const args = process.argv.slice(2);
const demo = args.includes('--demo');
const DEMO_PORT = 5199;
const base = demo
	? `http://localhost:${DEMO_PORT}`
	: (args.find((a) => !a.startsWith('--')) ?? 'http://localhost:5173');

/** The slice of GameScene the scenarios touch (runtime-only, hence the structural type). */
interface GameProbe {
	run: {
		hero: string;
		round: number;
		phase: string;
		fish: number;
		timeLeft: number;
		pendingLevelUps: number;
		shop: {
			offers: ({ price: number; kind: string } | null)[];
			rerolls: number;
			locks: boolean[];
		} | null;
		gear?: { bag: string[]; equipped: Record<string, string | null> };
	};
	build: { weapons: unknown[] };
	arena: { sideTiles: number };
	weaponRing: { views: unknown[] };
	enemies: { boss: object | null; kill: (e: object) => void };
	combat: { god: boolean };
	shopBuy: (i: number) => void;
	shopReroll: () => void;
	shopLock: (i: number) => void;
	die: (outcome: string) => void;
}

type SceneProbe = { active: string[]; round: number | null };

const browser = await chromium.launch({ args: ['--mute-audio'] });
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
await page.addInitScript(seedSaveScript);
const errors: string[] = [];
page.on('pageerror', (e) => errors.push(e.message));
/** Last step logged, so a page error says where it happened. */
let step = 'start';
page.on('console', (m) => {
	if (m.type() === 'error') errors.push(`[after "${step}"] ${m.text().slice(0, 200)}`);
});

function fail(message: string): never {
	console.error(`FAIL ${message}`);
	for (const e of errors) console.error(`  page error: ${e}`);
	process.exit(1);
}

async function probe(): Promise<SceneProbe> {
	return page.evaluate(() => {
		const g = (window as unknown as { __GAME__: import('phaser').Game }).__GAME__;
		const game = g.scene.getScene('Game') as unknown as { run?: { round: number } };
		return {
			active: g.scene.getScenes(true).map((s) => s.scene.key),
			round: g.scene.isActive('Game') ? (game.run?.round ?? null) : null,
		};
	});
}

async function waitFor(label: string, check: (p: SceneProbe) => boolean): Promise<void> {
	const deadline = Date.now() + 15000;
	let last: SceneProbe | null = null;
	while (Date.now() < deadline) {
		last = await probe();
		if (check(last)) {
			step = label;
			console.log(`ok   ${label}`);
			return;
		}
		await page.waitForTimeout(150);
	}
	fail(`${label}: ${JSON.stringify(last)}`);
}

/** Runs `fn` against the live Game scene. */
async function game<T>(fn: (g: GameProbe) => T): Promise<T> {
	return page.evaluate(
		`(${fn.toString()})(window.__GAME__.scene.getScene('Game'))`,
	) as Promise<T>;
}

const ui = page.locator('#ui');

async function see(label: string, text: string | RegExp, timeout = 15000): Promise<void> {
	try {
		await ui.getByText(text).first().waitFor({ state: 'visible', timeout });
	} catch {
		const shown = (await ui.textContent())?.slice(0, 160);
		const g = await page.evaluate(
			"(() => { const s = window.__GAME__.scene.getScene('Game'); return JSON.stringify({ phase: s.run && s.run.phase, ended: s.ended, dead: s.deadFor, paused: s.uiPaused, screen: window.__UI__.get().screen, active: window.__GAME__.scene.getScenes(true).map((x) => x.scene.key) }); })()",
		);
		fail(`${label}: "${text}" not shown (ui: ${shown}; game: ${g})`);
	}
	step = label;
	console.log(`ok   ${label}`);
}

async function click(name: string | RegExp): Promise<void> {
	// Screens mount in two renders (focus scope), so let them settle before clicking.
	await page.waitForTimeout(500);
	await ui.getByRole('button', { name }).first().click();
}

/** Unlock notices (new achievements, heroes) come before the run summary: dismiss them all. */
async function dismissUnlocks(): Promise<void> {
	await page.waitForTimeout(800);
	for (let i = 0; i < 6; i++) {
		const next = ui.getByRole('button', { name: 'CONTINUE' }).first();
		if (!(await next.isVisible())) return;
		await next.click();
		await page.waitForTimeout(400);
	}
}

async function gone(text: string): Promise<void> {
	await page.waitForFunction(
		(x) => !document.getElementById('ui')?.textContent?.includes(x),
		text,
	);
}

/** Save slots (SDD-014): the seeded slot 1 loads, a new game goes to the empty slot 2. */
async function checkSlots(): Promise<void> {
	await click('LOAD GAME');
	await see('load screen lists the slots', 'SLOT 3');
	await see('slot 1 is a used slot', /Jack · level 1/);
	await click('BACK');
	await see('back from the load screen', 'NEW GAME');
	await click('NEW GAME');
	await see('new game slot picker', 'START HERE');
	await page.waitForTimeout(500);
	await ui.getByRole('button', { name: 'START HERE' }).nth(1).click();
}

/** Main menu → hero select → START RUN (the menu can still be booting under the first click). */
async function startRunFromMenu(): Promise<void> {
	if (!(await ui.getByText('START RUN').first().isVisible()))
		await see('React main menu', 'PLAY');
	for (let i = 0; i < 4 && !(await ui.getByText('START RUN').first().isVisible()); i++)
		await click('PLAY');
	await see('React hero select', 'START RUN');
	await click('START RUN');
	await waitFor('run started (round 1)', (p) => p.active.includes('Game') && p.round === 1);
}

/** A fake gamepad (standard mapping) the test presses button by button through `window.__pad`. */
const FAKE_PAD = `(() => {
	const pad = { on: false, buttons: Array.from({ length: 17 }, () => ({ pressed: false })) };
	window.__pad = pad;
	navigator.getGamepads = () => pad.on ? [{ connected: true, axes: [0, 0, 0, 0], buttons: pad.buttons }] : [];
})()`;

async function tapPad(button: number): Promise<void> {
	await page.evaluate(`(window.__pad.buttons[${button}].pressed = true)`);
	await page.waitForTimeout(120);
	await page.evaluate(`(window.__pad.buttons[${button}].pressed = false)`);
	await page.waitForTimeout(120);
}

/** The React menu is navigable with the d-pad (up/down) and the south button (confirm). */
async function gamepadMenu(): Promise<void> {
	await see('React main menu (gamepad)', 'PLAY');
	await page.waitForTimeout(600);
	await page.evaluate('(window.__pad.on = true)');
	const focused = async (): Promise<string> =>
		(await ui.locator('button[data-focused="true"]').first().textContent()) ?? '';
	await tapPad(13);
	const second = await focused();
	if (second === 'PLAY') fail('d-pad down did not move the focus');
	await tapPad(12);
	if ((await focused()) !== 'PLAY') fail('d-pad up did not move the focus back');
	await tapPad(0);
	await see('gamepad confirm opens the hero select', 'START RUN');
	await page.evaluate('(window.__pad.on = false)');
}

async function fullFlow(): Promise<void> {
	await page.addInitScript(FAKE_PAD);
	await page.goto(base, { waitUntil: 'load' });
	await page.waitForFunction(() => '__GAME__' in window);
	await gamepadMenu();
	await click('BACK');
	await see('back on the main menu', 'PLAY');
	await checkSlots();
	await startRunFromMenu();
	// The run idles for a while behind the screens: the hero must not die in the middle of them.
	await game((g) => {
		g.combat.god = true;
	});

	// Round 1 ends with a pending level-up: the cards come first, then the shop.
	await game((g) => {
		g.run.pendingLevelUps = 1;
		g.run.timeLeft = 0;
	});
	await see('React level-up cards', /LEVEL UP/);
	await ui.locator('div.grid button').first().click();
	await see('React shop after the card', 'NEXT ROUND');
	await game((g) => {
		g.run.fish = 500;
	});
	const bought = await game((g) => {
		// The mixed shop also sells gear and potions: reroll until a weapon shows up.
		const weaponIndex = (): number =>
			(g.run.shop?.offers ?? []).findIndex((o) => o?.kind === 'weapon');
		for (let i = 0; i < 8 && weaponIndex() < 0; i++) g.shopReroll();
		const before = g.run.fish;
		const i = weaponIndex();
		const price = g.run.shop?.offers[i]?.price ?? 0;
		g.shopBuy(i);
		return { before, price, after: g.run.fish, weapons: g.build.weapons.length };
	});
	if (bought.after !== bought.before - bought.price || bought.weapons !== 2)
		fail(`weapon purchase: ${JSON.stringify(bought)}`);
	step = 'bought a weapon (Fish debited, 2 slots)';
	console.log('ok   bought a weapon (Fish debited, 2 slots)');
	const fishBefore = await game((g) => g.run.fish);
	await click(/^REROLL/);
	const fishAfter = await game((g) => g.run.fish);
	if (fishAfter >= fishBefore) fail('reroll button did not charge Fish');
	step = 'reroll charged Fish';
	console.log('ok   reroll charged Fish');
	await game((g) => g.shopLock(1));
	const locked = await game((g) => g.run.shop?.locks[1] === true);
	if (!locked) fail('lock did not stick');
	step = 'lock toggled';
	console.log('ok   lock toggled');
	await click('NEXT ROUND');
	await waitFor('round 2 after the shop', (p) => p.active.includes('Game') && p.round === 2);
	const next = await game((g) => ({
		side: g.arena.sideTiles,
		phase: g.run.phase,
		ring: g.weaponRing.views.length,
	}));
	if (next.side !== 11 || next.phase !== 'round' || next.ring !== 2)
		fail(`round 2 state: ${JSON.stringify(next)}`);
	step = 'arena grew 10x10 to 11x11 and both weapons are on the ring';
	console.log('ok   arena grew 10x10 to 11x11 and both weapons are on the ring');

	// Pause: equipment from the bag, settings and Esc.
	await game((g) => {
		g.run.gear = { bag: ['helmet.wool'], equipped: { helmet: null } };
	});
	await page.keyboard.press('Escape');
	await see('React pause', 'PAUSED');
	await click('Wool Beanie');
	const worn = await game((g) => g.run.gear?.equipped.helmet);
	if (worn !== 'helmet.wool') fail(`equipping from the pause bag: ${worn}`);
	step = 'equipped from the pause bag';
	console.log('ok   equipped from the pause bag');
	await click('SETTINGS');
	await see('React settings over the pause', /^SETTINGS$/);
	await click('BACK');
	await see('pause again after settings', 'PAUSED');
	await click('RESUME');
	await gone('PAUSED');
	step = 'resumed';
	console.log('ok   resumed');
	await page.waitForTimeout(400);
	await page.keyboard.press('Escape');
	await see('pause reopens with Esc', 'PAUSED');
	await page.waitForTimeout(400);
	await page.keyboard.press('Escape');
	await gone('PAUSED');
	step = 'Esc resumes';
	console.log('ok   Esc resumes');
	await page.waitForTimeout(400);
	await page.keyboard.press('Escape');
	await see('pause reopens again', 'PAUSED');
	await click('QUIT RUN');
	await click('YES, QUIT');
	await dismissUnlocks();
	await see('React game over', 'YOU DIED');
	await click('MAIN MENU');
	await see('back on the React main menu', 'PLAY');
	await click(/HISTORY/);
	await see('match history', /HISTORY/);
	await click('BACK');
	await see('back from history', 'PLAY');
}

/** SDD-006 A2/A3: locked hero falls back to Jack, the last demo boss ends the demo. */
async function demoFlow(): Promise<void> {
	await page.goto(`${base}/?skipMenu=1&hero=bob&round=10&seed=1&god=1`, {
		waitUntil: 'domcontentloaded',
		timeout: 60000,
	});
	await page.waitForFunction(() => '__GAME__' in window);
	await waitFor('demo run started', (p) => p.active.includes('Game') && p.round === 10);
	// The demo server starts fresh, so every audio file on disk must have been loaded (no 404).
	const missing = await page.evaluate(
		`['sfx.shopOpen','sfx.shopBuy','sfx.shopReroll','sfx.shopLock','sfx.weaponFuse','sfx.shopNoFish','sfx.fire','sfx.ice','sfx.earth','sfx.lightning','sfx.freeze','music.shop','music.forest','music.city','sfx.knife','sfx.boomerang','sfx.pistol','sfx.crossbow','sfx.molotov','sfx.mine','sfx.totem','sfx.flameRing','sfx.uiHover','sfx.uiConfirm','sfx.uiBack','sfx.mooseKingRoar','sfx.colossusRoar','sfx.bossDown','sfx.krakenInk','sfx.abominationAcid','sfx.pearls','sfx.dangerUnlock','sfx.equip','sfx.demoEnd'].filter((k) => !window.__GAME__.cache.audio.exists(k))`,
	);
	if ((missing as string[]).length > 0)
		fail(`audio not loaded: ${(missing as string[]).join(', ')}`);
	console.log('ok   new audio loaded (shop, elements, weapons, bosses, UI, biome music)');
	const hero = await game((g) => g.run.hero);
	if (hero !== 'jack') fail(`?hero=bob in the demo should fall back to jack, got ${hero}`);
	await see('toast: available in the full game', 'Available in the full game', 5000);
	await game((g) => {
		// Wait until the boss exists, then kill it: the round ends and the demo with it.
		if (g.enemies.boss) g.enemies.kill(g.enemies.boss);
	});
	await see('DemoEnd after the last boss', 'DEMO COMPLETE');
	const href = await ui
		.locator('button[data-href^="https://store.steampowered.com"]')
		.first()
		.getAttribute('data-href');
	if (!href) fail('wishlist button has no Steam href');
	console.log(`ok   wishlist link ${href}`);
	await click('PLAY AGAIN');
	await waitFor('demo run again', (p) => p.active.includes('Game') && p.round !== null);
	await game((g) => g.die('death'));
	await see('DemoEnd after dying', 'DEMO OVER');
	await click('MAIN MENU');
	await see('back on the main menu', 'PLAY');
}

let server: ReturnType<typeof Bun.spawn> | undefined;

async function startDemoServer(): Promise<void> {
	server = Bun.spawn(['bunx', '--bun', 'vite', '--port', String(DEMO_PORT), '--strictPort'], {
		env: { ...process.env, VITE_DEMO: '1', SOUND_MUTED: 'true' },
		stdout: 'ignore',
		stderr: 'ignore',
	});
	const deadline = Date.now() + 40000;
	while (Date.now() < deadline) {
		try {
			const res = await fetch(`${base}/src/data/demo.ts`);
			if (res.ok) {
				// Something else may own the port: only a VITE_DEMO server counts.
				if (!(await res.text()).includes('"VITE_DEMO": "1"'))
					fail(`${base} is not a VITE_DEMO dev server (is the port taken?)`);
				return;
			}
		} catch {
			// not up yet
		}
		await Bun.sleep(300);
	}
	fail(`demo dev server did not start on ${base}`);
}

try {
	if (demo) await startDemoServer();
	await (demo ? demoFlow() : fullFlow());
} finally {
	await browser.close();
	server?.kill();
}
if (errors.length > 0) fail(`page errors:\n${errors.join('\n')}`);
console.log(demo ? 'E2E (demo) passed' : 'E2E passed');
process.exit(0);
