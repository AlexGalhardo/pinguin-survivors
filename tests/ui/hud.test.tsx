import { afterAll, describe, expect, test } from 'bun:test';

const uninstall = (await import('./dom')).installDom();
const { cleanup, render } = await import('@testing-library/react');
const { HudView } = await import('../../src/ui/components/Hud');
const { HUD_INTERVAL_MS, hudDue, hudStore, hudWeapons, publishHud } = await import(
	'../../src/ui/hud-bridge'
);
type Snapshot = import('../../src/ui/hud-bridge').HudSnapshot;

afterAll(uninstall);

const snapshot = (over: Partial<Snapshot> = {}): Snapshot => ({
	hp: 61.2,
	maxHp: 140,
	level: 7,
	xp: 10,
	xpToNext: 100,
	fish: 42,
	kills: 9,
	round: 5,
	timeLeft: 83.2,
	bossRound: false,
	boss: null,
	superpower: null,
	elite: 'none',
	weapons: [
		{ id: 'machete', tier: 1 },
		{ id: 'knives', tier: 4 },
	],
	gear: [null, null, null, null, null],
	gambits: [],
	speed: 1,
	fps: 60,
	...over,
});

describe('HudView', () => {
	test('formats HP, timer, level, round and fish', () => {
		const { container } = render(<HudView hud={snapshot()} version="v1.2.3" />);
		const text = container.textContent ?? '';
		expect(text).toContain('62 / 140');
		expect(text).toContain('1:24');
		expect(text).toContain('LV 7');
		expect(text).toContain('ROUND 5');
		expect(text).toContain('FISH 42');
		expect(text).toContain('v1.2.3');
		cleanup();
	});

	test('shows 6 weapon slots with tier numerals, boss bar and superpower', () => {
		const { container } = render(
			<HudView
				hud={snapshot({
					boss: { id: 'brute', hp: 50, maxHp: 100 },
					superpower: { charge: 3, cost: 3 },
					speed: 2,
				})}
			/>,
		);
		expect(container.querySelectorAll('[title]').length).toBe(2);
		expect(container.textContent).toContain('IV');
		expect(container.textContent).toContain('SPACE');
		expect(container.textContent).toContain('2x');
		cleanup();
	});
});

describe('hud bridge', () => {
	test('publishHud is throttled by hudDue and stores the snapshot', () => {
		publishHud(snapshot(), 1000);
		expect(hudStore.get().hud?.round).toBe(5);
		expect(hudDue(1000 + HUD_INTERVAL_MS - 1)).toBe(false);
		expect(hudDue(1000 + HUD_INTERVAL_MS)).toBe(true);
	});

	test('hudWeapons maps up to 6 weapon slots with their tier', () => {
		const weapons = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((id) => ({ id, tier: 3 as const }));
		expect(hudWeapons({ weapons: [{ id: 'machete', tier: 3 }] })).toEqual([
			{ id: 'machete', tier: 3, rarity: 3 },
		]);
		expect(hudWeapons({ weapons })).toHaveLength(6);
	});
});
