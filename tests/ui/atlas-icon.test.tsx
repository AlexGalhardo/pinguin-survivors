import { afterAll, afterEach, describe, expect, test } from 'bun:test';

const uninstall = (await import('./dom')).installDom();
const { act, cleanup, render } = await import('@testing-library/react');
const { AtlasIcon, cardIconFrames, weaponFrames } = await import(
	'../../src/ui/components/AtlasIcon'
);
const { clearAtlases, registerAtlas } = await import('../../src/ui/atlas');

afterAll(uninstall);
afterEach(() => {
	cleanup();
	clearAtlases();
});

const atlas = {
	frames: {
		'weapon.machete': { frame: { x: 10, y: 20, w: 61, h: 11 } },
		'weapon.machete.t3': { frame: { x: 100, y: 40, w: 30, h: 10 } },
		'icon.maxHp': { frame: { x: 0, y: 0, w: 32, h: 32 } },
	},
	meta: { image: 'core.png', size: { w: 1024, h: 256 } },
};

describe('AtlasIcon', () => {
	test('shows the fallback when no frame exists (atlas not loaded)', () => {
		const { getByText } = render(
			<AtlasIcon frames={['weapon.machete']} fallback={<span>MA</span>} />,
		);
		expect(getByText('MA')).toBeTruthy();
	});

	test('draws the first existing frame with background-position at an integer scale', () => {
		registerAtlas(atlas, 'assets/atlas/');
		const { container } = render(
			<AtlasIcon frames={['weapon.machete.t9', 'weapon.machete']} size={128} />,
		);
		const el = container.querySelector('[data-atlas-frame]') as HTMLElement;
		expect(el.style.width).toBe('122px');
		expect(el.style.height).toBe('22px');
		expect(el.style.backgroundPosition).toBe('-20px -40px');
		expect(el.style.backgroundSize).toBe('2048px 512px');
		expect(el.style.backgroundImage).toContain('assets/atlas/core.png');
	});

	test('a frame registered later replaces the fallback', () => {
		const view = render(<AtlasIcon frames={['icon.maxHp']} fallback={<span>HP</span>} />);
		expect(view.queryByText('HP')).not.toBeNull();
		act(() => registerAtlas(atlas, 'a/'));
		expect(view.queryByText('HP')).toBeNull();
		expect(view.container.querySelector('[data-atlas-frame]')).not.toBeNull();
	});

	test('never scales below 1 and renders nothing without a fallback', () => {
		registerAtlas(atlas, 'a/');
		const big = render(<AtlasIcon frames={['weapon.machete']} size={10} />);
		expect((big.container.querySelector('[data-atlas-frame]') as HTMLElement).style.width).toBe(
			'61px',
		);
		cleanup();
		const none = render(<AtlasIcon frames={['nope']} />);
		expect(none.container.innerHTML).toBe('');
	});

	test('frame naming helpers', () => {
		expect(weaponFrames('knives', 3)).toEqual(['weapon.knives.t3', 'weapon.knives']);
		expect(cardIconFrames('maxHp')).toEqual(['icon.maxHp']);
		expect(cardIconFrames('perk.ironBreath')).toEqual(['icon.perk.ironBreath']);
		expect(cardIconFrames('active.seismicStomp')).toEqual(['icon.weapon.seismicStomp']);
	});
});
