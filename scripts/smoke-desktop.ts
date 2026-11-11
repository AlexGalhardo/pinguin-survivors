// Smoke test of the packaged Windows build (SDD-007 A3): launches the .exe muted with a remote
// debugging port, drives the React UI over CDP (menu, run, suspend pause, quit) and checks that the
// window state file was written. Needs `bun run build:desktop` first.
// Usage: bun scripts/smoke-desktop.ts [full|demo]. The demo variant stops at the death screen:
// DemoEnd (wishlist button) is covered by `bun run e2e -- --demo`, since a packaged run has no debug hooks
// and a standing penguin survives the demo rounds.
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright';

const flavor = process.argv[2] === 'demo' ? 'demo' : 'full';
const exe = `apps/desktop/dist/${flavor}/win-unpacked/Pinguin Survivors${flavor === 'demo' ? ' Demo' : ''}.exe`;
if (!existsSync(exe)) throw new Error(`build first: ${exe} not found`);
const port = 9333;
// A fresh profile per run: no saved run or language leaks in from earlier launches.
const profile = mkdtempSync(join(tmpdir(), 'pinguin-smoke-'));
const stateFile = join(profile, 'window.json');

const proc = Bun.spawn(
	[
		exe,
		`--remote-debugging-port=${port}`,
		`--user-data-dir=${profile}`,
		'--mute-audio',
		'--lang=en-US',
	],
	{
		stdout: 'ignore',
		stderr: 'ignore',
	},
);

function fail(message: string): never {
	console.error(`FAIL ${message}`);
	proc.kill();
	process.exit(1);
}

let browser: Awaited<ReturnType<typeof chromium.connectOverCDP>> | undefined;
for (let i = 0; i < 60 && !browser; i++) {
	try {
		browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
	} catch {
		await Bun.sleep(500);
	}
}
if (!browser) fail('could not attach to the Electron window');
const page = browser.contexts()[0]?.pages()[0];
if (!page) fail('no page');
const errors: string[] = [];
page.on('pageerror', (e) => errors.push(e.message));
const ui = page.locator('#ui');
const see = async (label: string, text: string | RegExp, timeout = 20000) => {
	try {
		await ui.getByText(text).first().waitFor({ state: 'visible', timeout });
	} catch {
		fail(
			`${label}: "${text}" not shown (ui: ${((await ui.textContent()) ?? '').slice(0, 200)})`,
		);
	}
	console.log(`ok   ${label}`);
};
const click = async (name: string | RegExp) => {
	await page.waitForTimeout(500);
	await ui.getByRole('button', { name }).first().click();
};

const kind = await page.evaluate(
	() => (window as unknown as { platform?: { kind: string } }).platform?.kind,
);
if (kind !== 'electron') fail(`window.platform.kind = ${kind}`);
console.log('ok   window.platform is the Electron bridge');
// A fresh profile has no save slot: only NEW GAME is offered, and it creates slot 1 (SDD-014).
await see('main menu (no slot yet)', 'NEW GAME');
await see('Quit button (desktop only)', 'QUIT');
await click('NEW GAME');
await see('save slot picker', 'START HERE');
await click('START HERE');
await see('hero select', 'START RUN');
await click('START RUN');
await see('HUD in the run', /ROUND 1/);
await page.waitForTimeout(1500);
await page.evaluate(() => window.dispatchEvent(new Event('pinguin:suspend')));
await see('focus loss pauses the run', 'PAUSED');
await click('RESUME');
await page.waitForFunction(() => !document.getElementById('ui')?.textContent?.includes('PAUSED'));
console.log('ok   resumed from the pause screen');
await page.waitForTimeout(600);
await page.keyboard.press('Escape');
await see('Esc opens the pause menu', 'PAUSED');
await click('QUIT RUN');
await click('YES, QUIT');
for (let i = 0; i < 6; i++) {
	const next = ui.getByRole('button', { name: /^CONTINUE$/ }).first();
	if (!(await next.isVisible())) break;
	await next.click();
	await page.waitForTimeout(400);
}
await see('game over', 'RUN ENDED');
await click('MAIN MENU');
await see('back on the main menu', 'QUIT');
await click('QUIT');
const exitCode = await Promise.race([proc.exited, Bun.sleep(10000).then(() => 'timeout')]);
if (exitCode === 'timeout') fail('the app did not quit');
console.log('ok   QUIT closed the app');
const saved = JSON.parse(readFileSync(join(profile, 'save.json'), 'utf8')) as {
	version: number;
	slots: unknown[];
};
if (saved.version !== 3 || saved.slots[0] === null || saved.slots[1] !== null)
	fail('save.json should hold slot 1 only');
console.log('ok   save.json written with slot 1');
if (!existsSync(stateFile)) fail('window state file was not written');
console.log(`ok   window state saved: ${readFileSync(stateFile, 'utf8')}`);
if (errors.length > 0) fail(`page errors: ${errors.join(' | ')}`);
console.log('desktop smoke passed');
process.exit(0);
