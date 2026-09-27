// Real-game playtest bot (calibrates the headless sim, PLAN 3.2 / docs/balancing.md §10).
// Plays the real build in Chromium: an in-page brain dodges (scores 8 directions by crowd
// danger each frame), casts the superpower on crowds/bosses, and picks cards with the same
// policy as the sim. Levels, stat points and potions are injected through the save.
// Needs a server: `bunx --bun vite --port 5183` (use a free port, not 5173/4173 if busy), or a
// frozen DEV build so source edits do not hot-reload the runs:
//   NODE_ENV=development bunx --bun vite build --mode development --outDir <dir>
//   bunx --bun vite preview --outDir <dir> --port 5184
//
// Usage: bun scripts/playtest-bot.ts [--url http://localhost:5183] [--heroes jack,bob,lucia]
//   [--levels 1,10,30] [--runs 1] [--seed 100] [--speed 4] [--max 1500] [--potions]
//   [--cards smart|first] [--json out.jsonl] [--headed]
// --speed runs N simulation substeps per frame (same dt as 1x, so collisions stay exact).
// --max is the wall-clock limit per run in seconds.
import { appendFileSync } from 'node:fs';
import { chromium, type Page } from 'playwright';
import { HERO_IDS, type HeroId } from '../src/config/constants';
import { ALL_CARDS, type CardDef, type Rarity } from '../src/data/cards';
import { SUPER } from '../src/data/superpowers';
import { UPGRADES } from '../src/data/upgrades';
import type { Build } from '../src/logic/build';
import { SAVE_KEY } from '../src/logic/save';
import { pickBest } from '../src/logic/sim/card-policy';
import { POINT_PLANS, spendPoints } from '../src/logic/sim/run-sim';

function arg(name: string, fallback: string): string {
	const i = process.argv.indexOf(`--${name}`);
	return i >= 0 ? (process.argv[i + 1] ?? fallback) : fallback;
}
const flag = (name: string) => process.argv.includes(`--${name}`);

const url = arg('url', 'http://localhost:5183');
const heroes = arg('heroes', HERO_IDS.join(',')).split(',') as HeroId[];
const levels = arg('levels', '1').split(',').map(Number);
const runs = Number(arg('runs', '1'));
const seed0 = Number(arg('seed', '100'));
const speed = Number(arg('speed', '4'));
const maxSeconds = Number(arg('max', '1500'));
const cardMode = arg('cards', 'smart');
const jsonOut = arg('json', '');
const potions = flag('potions');
/** Skill knobs: seconds between movement decisions and chance of a random wrong move. */
const react = Number(arg('react', '0'));
const mistakes = Number(arg('mistakes', '0'));
/** Start round (debug `?round=`): cards are not granted, so use it for boss checks only. */
const startRound = arg('round', '');
const difficulty = arg('difficulty', 'normal');
/** Workshop levels: `all:3` or `vitality:5,might:3`. */
const upgrades = parseUpgrades(arg('upgrades', ''));

function parseUpgrades(spec: string): Record<string, number> {
	const out: Record<string, number> = {};
	for (const part of spec.split(',').filter(Boolean)) {
		const [id, n] = part.split(':');
		const level = Number(n ?? 1);
		if (id === 'all') for (const u of UPGRADES) out[u.id] = Math.min(u.maxLevel, level);
		else if (id) out[id] = level;
	}
	return out;
}

export interface RoundLog {
	round: number;
	/** Game seconds spent in the round. */
	seconds: number;
	hpEnd: number;
	hpMin: number;
	maxHp: number;
	kills: number;
	/** HP lost to hits this round (sum of drops, before regen/heals). */
	damageTaken: number;
}

export interface RunLog {
	hero: HeroId;
	level: number;
	seed: number;
	round: number;
	outcome: string;
	kills: number;
	gameSeconds: number;
	wallSeconds: number;
	cards: string[];
	/** Boss HP share left the last time a boss was seen (0 = killed or never met). */
	bossLeft: number;
	rounds: RoundLog[];
}

function saveFor(hero: HeroId, level: number): string {
	const heroes = Object.fromEntries(
		HERO_IDS.map((h) => [
			h,
			{
				unlocked: true,
				level: h === hero ? level : 1,
				xp: 0,
				points: h === hero ? spendPoints(level, POINT_PLANS[h]) : {},
			},
		]),
	);
	const none = { heal: 0, megaHeal: 0, shield: 0, rage: 0, antidote: 0, haste: 0 };
	return JSON.stringify({
		version: 1,
		settings: {
			lang: 'en',
			volume: { master: 0, music: 0, sfx: 0, voice: 0 },
			gore: 'reduced',
			screenShake: false,
			damageNumbers: false,
			resolution: 'auto',
		},
		heroes,
		upgrades,
		fish: 0,
		potions: potions ? { ...none, heal: 1, megaHeal: 1, shield: 1 } : none,
		gambits: potions
			? [
					{ potion: 'megaHeal', condition: 'hpBelow25' },
					{ potion: 'heal', condition: 'hpBelow50' },
					{ potion: 'shield', condition: 'bossVisible' },
				]
			: [],
	});
}

/** Installs the per-frame brain and the substep speed-up inside the page. */
async function installBrain(page: Page, seed: number): Promise<boolean> {
	return page.evaluate(
		({ speed, superCharge, superLevel, react, mistakes, seed }) => {
			type E = {
				x: number;
				y: number;
				radius: number;
				alive: boolean;
				hp: number;
				maxHp: number;
				telegraph: boolean;
				ai: { mode: string };
				def: { behavior: string };
			};
			type Run = {
				round: number;
				hp: number;
				maxHp: number;
				kills: number;
				superCharge: number;
				elapsed: number;
			};
			const w = window as unknown as {
				__GAME__: import('phaser').Game;
				__BOT__?: Record<string, unknown>;
			};
			const s = w.__GAME__.scene.getScene('Game') as unknown as {
				sys: { sceneUpdate: (t: number, d: number) => void; isActive(): boolean };
				time: { timeScale: number };
				tweens: { timeScale: number };
				run?: Run;
				hero?: { x: number; y: number };
				stats: { moveSpeed: number };
				level: { level: number };
				deadFor: number;
				controls: { move(): { x: number; y: number } };
				obstacles?: { near(x: number, y: number, r: number): readonly unknown[] };
				enemies: { active: E[]; boss: E | null };
				weapons: { weapon: { range: number; kind: string } };
				hostile: {
					shots: { x: number; y: number; vx: number; vy: number; alive: boolean }[];
					pools?: { x: number; y: number; radius: number; alive: boolean }[];
				};
				castSuper(): void;
			};
			if (w.__BOT__) return true;
			if (!s?.run || !s.hero) return false;
			// Screen key combos (D/A = ±x, S/W = ±y) and their world directions (inverse iso).
			const combos: [number, number][] = [
				[1, 0],
				[1, 1],
				[0, 1],
				[-1, 1],
				[-1, 0],
				[-1, -1],
				[0, -1],
				[1, -1],
			];
			const dirs = combos.map(([ix, iy]) => {
				const x = iy + ix / 2;
				const y = iy - ix / 2;
				const l = Math.hypot(x, y) || 1;
				return { x: x / l, y: y / l };
			});
			let last = -1;
			let nextDecision = 0;
			let lcg = seed >>> 0;
			const random = () => {
				lcg = (Math.imul(lcg, 1664525) + 1013904223) >>> 0;
				return lcg / 4294967296;
			};
			const bot = {
				rounds: [] as unknown[],
				round: s.run.round,
				hpMin: s.run.hp,
				dmg: 0,
				prevHp: s.run.hp,
				roundStart: s.run.elapsed,
				killsStart: s.run.kills,
				bossLeft: 0,
			};
			w.__BOT__ = bot;
			// The brain drives GameInput.move() directly (screen-space intent, like a held key).
			const intent = { x: 0, y: 0 };
			s.controls.move = () => intent;
			const setKeys = (i: number) => {
				const [ix, iy] = i < 0 ? [0, 0] : (combos[i] as [number, number]);
				intent.x = ix;
				intent.y = iy;
			};
			const brain = () => {
				const h = s.hero as { x: number; y: number };
				const run = s.run as Run;
				if (run.round !== bot.round) {
					bot.rounds.push({
						round: bot.round,
						seconds: run.elapsed - bot.roundStart,
						hpEnd: bot.prevHp,
						hpMin: bot.hpMin,
						maxHp: run.maxHp,
						kills: run.kills - bot.killsStart,
						damageTaken: bot.dmg,
					});
					bot.round = run.round;
					bot.bossLeft = 0;
					bot.roundStart = run.elapsed;
					bot.killsStart = run.kills;
					bot.hpMin = run.hp;
					bot.dmg = 0;
				}
				if (run.hp < bot.prevHp) bot.dmg += bot.prevHp - run.hp;
				bot.prevHp = run.hp;
				bot.hpMin = Math.min(bot.hpMin, run.hp);

				const boss = s.enemies.boss?.alive ? s.enemies.boss : null;
				if (boss) bot.bossLeft = boss.hp / boss.maxHp;
				// Boss: stay at weapon range while it walks, get out while it winds up/charges.
				const w = s.weapons.weapon;
				const bossRange = w.kind === 'arc' ? w.range * 0.75 : Math.min(180, w.range * 0.6);
				const bossThreat = boss ? boss.telegraph || boss.ai.mode !== 'move' : false;
				const look = 0.35 * s.stats.moveSpeed;
				if (
					run.superCharge >= superCharge &&
					s.level.level >= superLevel &&
					(boss || s.enemies.active.length >= 60)
				)
					s.castSuper();
				if (run.elapsed < nextDecision) return;
				nextDecision = run.elapsed + react;
				const near: E[] = [];
				for (const e of s.enemies.active) {
					if (!e.alive) continue;
					const d = Math.hypot(e.x - h.x, e.y - h.y);
					if (d < 320) near.push(e);
				}
				// Healthy heroes keep the closest enemy near weapon range instead of running away
				// from everything (players fight the edge of the horde).
				let nearest: E | null = null;
				let nearestD = Number.POSITIVE_INFINITY;
				for (const e of near) {
					if (e === boss) continue;
					const d = Math.hypot(e.x - h.x, e.y - h.y);
					if (d < nearestD) {
						nearestD = d;
						nearest = e;
					}
				}
				const engage = !boss && nearest && run.hp / run.maxHp > 0.5;
				const prefer = w.kind === 'arc' ? w.range * 0.8 : w.range * 0.75;
				let best = -1;
				let bestScore = Number.POSITIVE_INFINITY;
				for (let i = -1; i < dirs.length; i++) {
					const v = i < 0 ? { x: 0, y: 0 } : (dirs[i] as { x: number; y: number });
					const px = h.x + v.x * look;
					const py = h.y + v.y * look;
					let danger = 0;
					for (const e of near) {
						if (e === boss) continue;
						const d = Math.max(4, Math.hypot(e.x - px, e.y - py) - e.radius - 12);
						danger += (e.def.behavior === 'charger' ? 2 : 1) / (d * d);
					}
					if (boss) {
						const d = Math.hypot(boss.x - px, boss.y - py);
						if (bossThreat) danger += 40 / Math.max(4, d - boss.radius - 12) ** 2;
						else danger += 0.002 * ((d - boss.radius - bossRange) / 100) ** 2;
					}
					for (const shot of s.hostile.shots) {
						if (!shot.alive) continue;
						const d = Math.max(
							4,
							Math.hypot(shot.x + shot.vx * 0.3 - px, shot.y + shot.vy * 0.3 - py) -
								18,
						);
						danger += 1.5 / (d * d);
					}
					for (const pool of s.hostile.pools ?? []) {
						if (!pool.alive) continue;
						const d = Math.hypot(pool.x - px, pool.y - py) - pool.radius - 12;
						if (d < 0) danger += 0.05 * (1 - d / pool.radius);
					}
					// Obstacles snag the hero (he slides around them): avoid walking into one.
					if (i >= 0 && s.obstacles) {
						const blocked =
							s.obstacles.near(h.x + v.x * look * 0.4, h.y + v.y * look * 0.4, 14)
								.length + s.obstacles.near(px, py, 14).length;
						danger += 0.0015 * blocked;
					}
					if (engage && nearest) {
						const d = Math.hypot(nearest.x - px, nearest.y - py) - nearest.radius;
						danger += 0.0004 * ((d - prefer) / 100) ** 2;
					}
					if (i === last) danger *= 0.9;
					if (danger < bestScore) {
						bestScore = danger;
						best = i;
					}
				}
				// Nothing close: drift in a slow circle so the crowd never settles.
				if (near.length === 0 && !boss) best = Math.floor(run.elapsed / 1.5) % 8;
				if (random() < mistakes) best = Math.floor(random() * 9) - 1;
				last = best;
				setKeys(best);
			};
			const orig = s.sys.sceneUpdate;
			s.sys.sceneUpdate = function (this: unknown, t: number, d: number) {
				for (let k = 0; k < speed; k++) {
					if (!s.sys.isActive()) break;
					if (s.deadFor < 0) brain();
					orig.call(this, t, d);
				}
			};
			s.time.timeScale = speed;
			s.tweens.timeScale = speed;
			return true;
		},
		{ speed, superCharge: SUPER.charge, superLevel: SUPER.unlockLevel, react, mistakes, seed },
	);
}

const cardById = new Map(ALL_CARDS.map((c) => [c.id, c]));

async function playRun(page: Page, hero: HeroId, level: number, seed: number): Promise<RunLog> {
	await page.addInitScript(
		([key, save]) => {
			if (!sessionStorage.getItem('bot.saved')) {
				localStorage.setItem(key, save);
				sessionStorage.setItem('bot.saved', '1');
			}
		},
		[SAVE_KEY, saveFor(hero, level)] as const,
	);
	await page.goto(
		`${url}/?skipMenu=1&hero=${hero}&seed=${seed}&difficulty=${difficulty}${startRound ? `&round=${startRound}` : ''}`,
	);
	const start = Date.now();
	let installed = false;
	let outcome = 'timeLimit';
	let snap = { round: 1, kills: 0, elapsed: 0, cards: [] as string[] };
	while ((Date.now() - start) / 1000 < maxSeconds) {
		await page.waitForTimeout(installed ? 250 : 400);
		if (!installed) {
			installed = await installBrain(page, seed).catch(() => false);
			if (!installed && Date.now() - start > 30_000)
				throw new Error(
					'bot could not attach: window.__GAME__ is only exposed in DEV builds',
				);
			continue;
		}
		const state = await page.evaluate(() => {
			const g = (window as unknown as { __GAME__: import('phaser').Game }).__GAME__;
			const game = g.scene.getScene('Game') as unknown as {
				run: { round: number; kills: number; elapsed: number };
				build: Build;
				outcome: string;
			};
			const active = new Set(g.scene.getScenes(true).map((x) => x.scene.key));
			const pick = g.scene.getScene('CardPick') as unknown as {
				sys: {
					settings: { data?: { offers: { card: { id: string }; rarity: string }[] } };
				};
			};
			return {
				round: game.run.round,
				kills: game.run.kills,
				elapsed: game.run.elapsed,
				outcome: game.outcome,
				build: game.build,
				over: active.has('GameOver'),
				picking: active.has('CardPick'),
				offers: active.has('CardPick')
					? (pick.sys.settings.data?.offers ?? []).map((o) => ({
							id: o.card.id,
							rarity: o.rarity,
						}))
					: [],
			};
		});
		snap = {
			round: state.round,
			kills: state.kills,
			elapsed: state.elapsed,
			cards: [...state.build.cards],
		};
		if (state.over) {
			outcome = state.outcome;
			break;
		}
		if (state.picking && state.offers.length > 0) {
			const offers = state.offers.map((o) => ({
				card: cardById.get(o.id) as CardDef,
				rarity: o.rarity as Rarity,
			}));
			const i = cardMode === 'first' ? 0 : pickBest(offers, state.build, hero);
			await page.evaluate((index) => {
				const g = (window as unknown as { __GAME__: import('phaser').Game }).__GAME__;
				const pick = g.scene.getScene('CardPick') as unknown as {
					sys: { settings: { data: unknown } };
					pick(i: number, data: unknown): void;
				};
				pick.pick(index, pick.sys.settings.data);
			}, i);
		}
	}
	const { rounds, bossLeft } = await page.evaluate(() => {
		const bot = (
			window as unknown as {
				__BOT__?: {
					rounds: unknown[];
					round: number;
					roundStart: number;
					prevHp: number;
					hpMin: number;
					dmg: number;
					bossLeft: number;
				};
			}
		).__BOT__;
		if (!bot) return { rounds: [] as RoundLog[], bossLeft: 0 };
		// The round the run ended on (death, boss timeout or time limit).
		const last = {
			round: bot.round,
			hpEnd: bot.prevHp,
			hpMin: bot.hpMin,
			damageTaken: bot.dmg,
		};
		return { rounds: [...bot.rounds, last] as RoundLog[], bossLeft: bot.bossLeft };
	});
	return {
		hero,
		level,
		seed,
		round: snap.round,
		outcome,
		kills: snap.kills,
		gameSeconds: Math.round(snap.elapsed),
		wallSeconds: Math.round((Date.now() - start) / 1000),
		cards: snap.cards,
		bossLeft,
		rounds,
	};
}

const browser = await chromium.launch({ channel: 'chrome', headless: !flag('headed') });
console.log('hero   lvl  seed  round  outcome     kills  gameSec  wallSec');
for (const level of levels) {
	for (const hero of heroes) {
		for (let i = 0; i < runs; i++) {
			const seed = seed0 + i;
			const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
			page.on('pageerror', (e) => console.error(`[pageerror] ${e.message}`));
			const log = await playRun(page, hero, level, seed);
			await page.close();
			console.log(
				`${hero.padEnd(6)} ${String(level).padStart(3)}  ${String(seed).padStart(4)}  ${String(log.round).padStart(5)}  ${log.outcome.padEnd(10)}  ${String(log.kills).padStart(5)}  ${String(log.gameSeconds).padStart(7)}  ${String(log.wallSeconds).padStart(7)}${log.bossLeft > 0 ? `  boss ${Math.round(log.bossLeft * 100)}% left` : ''}`,
			);
			if (jsonOut) appendFileSync(jsonOut, `${JSON.stringify(log)}\n`);
		}
	}
}
await browser.close();
