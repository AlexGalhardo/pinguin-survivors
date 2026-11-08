/**
 * End-to-end flow test (PLAN 7.1): main menu → hero select → run → round end → level-up card → shop (buy, reroll, lock) →
 * death → game over → main menu → match history, with a fresh save and zero page errors.
 * Menus are driven with real key presses; the round timer and the death are forced through the
 * dev-only `window.__GAME__` handle (headless WebGL is too slow to play a round for real).
 * Needs `bun run dev` running. Usage: bun scripts/e2e.ts [baseUrl=http://localhost:5173]
 * Exits with code 1 on the first failed step.
 */
import { chromium, type Page } from 'playwright';

const base = process.argv[2] ?? 'http://localhost:5173';

type SceneProbe = { active: string[]; history: number; round: number | null };

async function probe(page: Page): Promise<SceneProbe> {
	return page.evaluate(() => {
		const g = (window as unknown as { __GAME__: import('phaser').Game }).__GAME__;
		const save = g.registry.get('save') as { history: unknown[] };
		const game = g.scene.getScene('Game') as unknown as { run?: { round: number } };
		return {
			active: g.scene.getScenes(true).map((s) => s.scene.key),
			history: save.history.length,
			round: g.scene.isActive('Game') ? (game.run?.round ?? null) : null,
		};
	});
}

async function waitFor(
	page: Page,
	label: string,
	check: (p: SceneProbe) => boolean,
): Promise<void> {
	const deadline = Date.now() + 15000;
	let last: SceneProbe | null = null;
	while (Date.now() < deadline) {
		last = await probe(page);
		if (check(last)) {
			console.log(`ok   ${label}`);
			return;
		}
		await page.waitForTimeout(150);
	}
	console.error(`FAIL ${label}: ${JSON.stringify(last)}`);
	process.exit(1);
}

const browser = await chromium.launch({ args: ['--mute-audio'] });
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
const errors: string[] = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => {
	if (m.type() === 'error') errors.push(m.text());
});

await page.goto(base, { waitUntil: 'load' });
await page.waitForFunction(() => '__GAME__' in window);
await waitFor(page, 'main menu', (p) => p.active.includes('MainMenu'));
await page.waitForTimeout(300);
await page.keyboard.press('Enter');
await waitFor(page, 'hero select', (p) => p.active.includes('HeroSelect'));
await page.keyboard.press('Enter');
await waitFor(page, 'run started (round 1)', (p) => p.active.includes('Game') && p.round === 1);

type ShopProbe = {
	phase: string;
	fish: number;
	weapons: number;
	offers: number;
	rerolls: number;
	locks: boolean[];
};

/** The slice of GameScene the shop scenario touches (runtime-only, hence the structural type). */
interface GameProbe {
	run: {
		phase: string;
		fish: number;
		timeLeft: number;
		pendingLevelUps: number;
		shop: { offers: ({ price: number } | null)[]; rerolls: number; locks: boolean[] } | null;
		lockedOffers: unknown[];
	};
	build: { weapons: unknown[] };
	arena: { sideTiles: number };
	weaponRing: { views: unknown[] };
	shopBuy: (i: number) => void;
	shopReroll: () => void;
	shopLock: (i: number) => void;
	closeShop: () => void;
}

/** Runs `fn` against the live Game scene (dev-only handle). */
async function game<T>(page: Page, fn: (g: GameProbe) => T): Promise<T> {
	return page.evaluate(
		`(${fn.toString()})(window.__GAME__.scene.getScene('Game'))`,
	) as Promise<T>;
}

async function shop(page: Page): Promise<ShopProbe> {
	return game(page, (g: GameProbe) => ({
		phase: g.run.phase,
		fish: g.run.fish,
		weapons: g.build.weapons.length,
		offers: g.run.shop ? g.run.shop.offers.filter(Boolean).length : 0,
		rerolls: g.run.shop ? g.run.shop.rerolls : 0,
		locks: g.run.shop ? g.run.shop.locks : [],
	}));
}

// Round 1 ends with a pending level-up: the card comes first and the key is released while the
// game is paused (regression: the hero kept walking after the card because the scene missed the keyup).
await page.keyboard.down('KeyD');
await page.waitForTimeout(300);
await game(page, (g: GameProbe) => {
	g.run.pendingLevelUps = 1;
	g.run.timeLeft = 0;
});
await waitFor(page, 'level-up card before the shop', (p) => p.active.includes('CardPick'));
await page.keyboard.up('KeyD');
await page.keyboard.press('Digit1');
await page.waitForFunction(
	() =>
		(
			window as unknown as {
				__GAME__: { scene: { getScene: (k: string) => { run: { phase: string } } } };
			}
		).__GAME__.scene.getScene('Game').run.phase === 'shop',
	null,
	{ timeout: 15000 },
);
const open = await shop(page);
if (open.offers !== 4 || open.weapons !== 1) {
	console.error(`FAIL shop did not open with 4 offers: ${JSON.stringify(open)}`);
	process.exit(1);
}
console.log('ok   shop opens after the card (4 offers)');
const uiText = await page.evaluate(() => document.getElementById('ui')?.textContent ?? '');
if (uiText.trim().length === 0) {
	console.error('FAIL the React shop rendered nothing');
	process.exit(1);
}
console.log('ok   React shop is on screen');

// Buy the first affordable weapon, reroll, lock a slot, leave.
await game(page, (g: GameProbe) => {
	g.run.fish = 500;
});
const bought = await game(page, (g: GameProbe) => {
	const before = g.run.fish;
	const offers = g.run.shop?.offers ?? [];
	const i = offers.findIndex((o) => o);
	const price = offers[i]?.price ?? 0;
	g.shopBuy(i);
	return { before, price, after: g.run.fish, weapons: g.build.weapons.length };
});
if (bought.after !== bought.before - bought.price || bought.weapons !== 2) {
	console.error(`FAIL buy: ${JSON.stringify(bought)}`);
	process.exit(1);
}
console.log('ok   bought a weapon (Fish debited, 2 slots)');
const rerolled = await game(page, (g: GameProbe) => {
	const before = g.run.fish;
	g.shopReroll();
	return { spent: before - g.run.fish, rerolls: g.run.shop?.rerolls };
});
if (rerolled.spent <= 0 || rerolled.rerolls !== 1) {
	console.error(`FAIL reroll: ${JSON.stringify(rerolled)}`);
	process.exit(1);
}
console.log('ok   reroll charged Fish');
await game(page, (g: GameProbe) => g.shopLock(1));
const locked = await shop(page);
if (!locked.locks[1]) {
	console.error('FAIL lock did not stick');
	process.exit(1);
}
console.log('ok   lock toggled');
await game(page, (g: GameProbe) => g.closeShop());
await waitFor(page, 'round 2 after the shop', (p) => p.active.includes('Game') && p.round === 2);
const next = await game(page, (g: GameProbe) => ({
	side: g.arena.sideTiles,
	phase: g.run.phase,
	slots: g.build.weapons.length,
	ring: g.weaponRing.views.length,
	kept: g.run.lockedOffers.filter(Boolean).length,
}));
if (next.side !== 11 || next.phase !== 'round' || next.ring !== 2 || next.slots !== 2) {
	console.error(`FAIL round 2 state: ${JSON.stringify(next)}`);
	process.exit(1);
}
console.log('ok   arena grew 10x10 to 11x11 and both weapons are on the ring');
const stillMoving = await page.evaluate(() => {
	const g = (window as unknown as { __GAME__: import('phaser').Game }).__GAME__;
	const game = g.scene.getScene('Game') as unknown as {
		controls: { move: () => { x: number; y: number } };
	};
	const m = game.controls.move();
	return m.x !== 0 || m.y !== 0;
});
if (stillMoving) {
	console.error('FAIL hero keeps walking after the card pick');
	process.exit(1);
}
console.log('ok   hero stops after the card pick');

await page.evaluate(() => {
	const g = (window as unknown as { __GAME__: import('phaser').Game }).__GAME__;
	(g.scene.getScene('Game') as unknown as { die: (o: string) => void }).die('death');
});
await waitFor(page, 'game over', (p) => p.active.includes('GameOver') && p.history === 1);
await page.waitForTimeout(400);
// "Play again" (first item) must start a clean run (it used to crash on chunk textures).
await page.keyboard.press('Enter');
await waitFor(
	page,
	'play again starts a new run',
	(p) => p.active.includes('Game') && p.round === 1,
);
await page.evaluate(() => {
	const g = (window as unknown as { __GAME__: import('phaser').Game }).__GAME__;
	(g.scene.getScene('Game') as unknown as { die: (o: string) => void }).die('death');
});
await waitFor(page, 'second game over', (p) => p.active.includes('GameOver') && p.history === 2);
await page.waitForTimeout(400);
// "Main menu" via arrows + Enter (Esc is eaten by the browser in fullscreen).
await page.keyboard.press('ArrowDown');
await page.waitForTimeout(120);
await page.keyboard.press('Enter');
await waitFor(
	page,
	'back to the main menu (only the menu running)',
	(p) => p.active.includes('MainMenu') && !p.active.includes('Game'),
);
await page.waitForTimeout(300);
// Play, Heroes & Potions, Workshop, Achievements, Match history.
await page.waitForTimeout(700);
for (let i = 0; i < 4; i++) {
	await page.keyboard.press('ArrowDown');
	await page.waitForTimeout(120);
}
await page.keyboard.press('Enter');
await waitFor(page, 'match history lists the run', (p) => p.active.includes('History'));

await browser.close();
if (errors.length > 0) {
	console.error(`FAIL page errors:\n${errors.join('\n')}`);
	process.exit(1);
}
console.log('E2E passed');
