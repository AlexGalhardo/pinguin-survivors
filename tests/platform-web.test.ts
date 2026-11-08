import { afterEach, describe, expect, test } from 'bun:test';
import { detectPlatform, setPlatform } from '../src/core/platform';
import { createBridgePlatform } from '../src/core/platform/bridge';
import { createWebPlatform, detectTier } from '../src/core/platform/web';
import { loadSave, writeSave } from '../src/core/storage';
import { defaultSave, SAVE_KEY, serializeSave } from '../src/logic/save';

class MemoryStorage {
	data = new Map<string, string>();
	getItem(key: string): string | null {
		return this.data.get(key) ?? null;
	}
	setItem(key: string, value: string): void {
		this.data.set(key, value);
	}
}

afterEach(() => setPlatform(undefined));

describe('web platform', () => {
	test('A5: export then import round-trips the save', async () => {
		const files: { name: string; raw: string }[] = [];
		const web = createWebPlatform({
			storage: new MemoryStorage(),
			download: (name, raw) => files.push({ name, raw }),
		});
		setPlatform(web);
		const save = defaultSave();
		save.pearls = 42;
		save.heroes.bob = { unlocked: true, level: 12, xp: 30, points: { crit: 3 } };
		const { exportSave, importSave } = await import('../src/core/storage');
		exportSave(save);
		expect(files[0]?.name).toMatch(/^pinguin-survivors-save-\d{4}-\d{2}-\d{2}\.json$/);
		const file = new File([files[0]?.raw ?? ''], 'save.json');
		expect(await importSave(file, 'en')).toEqual(save);
	});

	test('storage.ts delegates to the platform and keeps an unreadable save as backup', () => {
		const storage = new MemoryStorage();
		setPlatform(createWebPlatform({ storage }));
		expect(writeSave(defaultSave())).toBe(true);
		expect(storage.getItem(SAVE_KEY)).toBe(serializeSave(defaultSave()));
		storage.setItem(SAVE_KEY, '{"version":2,"fish":"junk"}');
		loadSave('en');
		expect(storage.getItem(`${SAVE_KEY}.backup`)).toBe('{"version":2,"fish":"junk"}');
	});

	test('blocked storage never throws', () => {
		const blocked = {
			getItem: () => {
				throw new Error('blocked');
			},
			setItem: () => {
				throw new Error('blocked');
			},
		};
		setPlatform(createWebPlatform({ storage: blocked }));
		expect(loadSave('en').version).toBe(2);
		expect(writeSave(defaultSave())).toBe(false);
	});

	test('web store features are no-ops and the tier follows the device', () => {
		const web = createWebPlatform({ storage: new MemoryStorage() });
		expect(web.kind).toBe('web');
		expect(web.cloud).toBe(false);
		expect(() => web.achievements.unlock('x')).not.toThrow();
		expect(() => web.leaderboards.submit('b', 1)).not.toThrow();
		expect(detectTier(2, undefined)).toBe('low');
		expect(detectTier(8, 2)).toBe('low');
		expect(detectTier(6, 8)).toBe('mid');
		expect(detectTier(12, 16)).toBe('high');
		expect(detectTier(undefined, undefined)).toBe('high');
	});
});

describe('native bridge', () => {
	test('wraps the injected bridge and falls back to web for what it omits', () => {
		const calls: string[] = [];
		const remote = new Map<string, string>();
		const p = createBridgePlatform({
			kind: 'electron',
			cloud: true,
			tier: 'high',
			storage: { get: (k) => remote.get(k) ?? null, set: (k, v) => !!remote.set(k, v) },
			achievements: { unlock: (id) => calls.push(`ach:${id}`) },
			quit: () => calls.push('quit'),
		});
		expect(p.kind).toBe('electron');
		expect(p.cloud).toBe(true);
		p.save.save('k', 'v');
		expect(remote.get('k')).toBe('v');
		expect(p.save.load('k')).toBe('v');
		p.achievements.unlock('first-blood');
		p.quit();
		expect(calls).toEqual(['ach:first-blood', 'quit']);
		expect(() => p.leaderboards.submit('b', 1)).not.toThrow();
	});

	test('detectPlatform reads window.platform', () => {
		const g = globalThis as unknown as { window?: unknown };
		const before = g.window;
		g.window = { platform: { kind: 'capacitor', tier: 'low' } };
		try {
			const p = detectPlatform();
			expect(p.kind).toBe('capacitor');
			expect(p.tier).toBe('low');
		} finally {
			g.window = before;
		}
	});
});
