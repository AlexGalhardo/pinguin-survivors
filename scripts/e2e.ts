/**
 * End-to-end flow test (PLAN 7.1): main menu → hero select → run → round end → card pick →
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

const browser = await chromium.launch();
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

// Walk into the card pick and release the key while the game is paused (regression: the
// hero kept walking after the card because the paused scene missed the keyup).
await page.keyboard.down('KeyD');
await page.waitForTimeout(300);
await page.evaluate(() => {
	const g = (window as unknown as { __GAME__: import('phaser').Game }).__GAME__;
	(g.scene.getScene('Game') as unknown as { run: { timeLeft: number } }).run.timeLeft = 0;
});
await waitFor(page, 'card pick after the round', (p) => p.active.includes('CardPick'));
await page.keyboard.up('KeyD');
await page.keyboard.press('Digit1');
await waitFor(page, 'round 2 after the card', (p) => p.active.includes('Game') && p.round === 2);
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
