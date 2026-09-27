// Real-game playtest bot (calibrates the headless sim, PLAN 3.2). Needs `bun run dev` on :5173
// (or pass the URL). Kites away from nearby enemies (circles when none), picks the first card, 2x speed.
// Usage: bun scripts/playtest-bot.ts [baseUrl=http://localhost:5173] [runs=2] [maxSeconds=240]
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://localhost:5173';
const runs = Number(process.argv[3] ?? 2);
const maxSeconds = Number(process.argv[4] ?? 240);

interface Snapshot {
	round: number;
	hp: number;
	kills: number;
	scene: string;
}

const browser = await chromium.launch({ channel: 'chrome' });
console.log('hero   seed  round  kills  seconds');
for (const hero of ['jack', 'bob', 'lucia']) {
	for (let i = 0; i < runs; i++) {
		const seed = 100 + i;
		const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
		await page.goto(`${base}/?skipMenu=1&hero=${hero}&seed=${seed}`);
		await page.waitForTimeout(1500);
		await page.keyboard.press('Tab');
		let last: Snapshot = { round: 1, hp: 1, kills: 0, scene: 'Game' };
		const start = Date.now();
		let step = 0;
		const held = new Set<string>();
		while ((Date.now() - start) / 1000 < maxSeconds) {
			// Kite: move away from the crowd within 180 u, else circle; mapped to screen keys.
			const state = await page.evaluate((stepIndex) => {
				const g = (window as unknown as { __GAME__: import('phaser').Game }).__GAME__;
				const game = g.scene.getScene('Game') as unknown as {
					run?: { round: number; hp: number; kills: number };
					hero?: { x: number; y: number };
					enemies?: { active: { x: number; y: number; alive: boolean }[] };
				};
				const active = new Set(g.scene.getScenes(true).map((s) => s.scene.key));
				let vx = 0;
				let vy = 0;
				const h = game.hero;
				for (const e of game.enemies?.active ?? []) {
					if (!h || !e.alive) continue;
					const dx = h.x - e.x;
					const dy = h.y - e.y;
					const d2 = dx * dx + dy * dy;
					if (d2 > 180 * 180 || d2 === 0) continue;
					vx += dx / d2;
					vy += dy / d2;
				}
				if (vx === 0 && vy === 0) {
					const a = stepIndex * 0.6;
					vx = Math.cos(a);
					vy = Math.sin(a);
				}
				// World → screen direction (2:1 iso), then to WASD.
				const sx = vx - vy;
				const sy = (vx + vy) / 2;
				const len = Math.hypot(sx, sy) || 1;
				const keys: string[] = [];
				if (sx / len > 0.38) keys.push('KeyD');
				if (sx / len < -0.38) keys.push('KeyA');
				if (sy / len > 0.38) keys.push('KeyS');
				if (sy / len < -0.38) keys.push('KeyW');
				return {
					keys,
					snap: {
						round: game.run?.round ?? 0,
						hp: game.run?.hp ?? 0,
						kills: game.run?.kills ?? 0,
						scene: active.has('GameOver')
							? 'GameOver'
							: active.has('CardPick')
								? 'CardPick'
								: 'Game',
					},
				};
			}, step++);
			last = state.snap;
			for (const k of [...held]) {
				if (!state.keys.includes(k)) {
					await page.keyboard.up(k);
					held.delete(k);
				}
			}
			for (const k of state.keys) {
				if (!held.has(k)) {
					await page.keyboard.down(k);
					held.add(k);
				}
			}
			if (last.scene === 'CardPick') await page.keyboard.press('Digit1');
			if (last.scene === 'GameOver') break;
			await page.waitForTimeout(150);
		}
		const secs = Math.round((Date.now() - start) / 1000);
		console.log(
			`${hero.padEnd(6)} ${String(seed).padStart(4)}  ${String(last.round).padStart(5)}  ${String(last.kills).padStart(5)}  ${String(secs).padStart(7)}${last.scene === 'GameOver' ? '' : '  (alive at time limit)'}`,
		);
		await page.close();
	}
}
await browser.close();
