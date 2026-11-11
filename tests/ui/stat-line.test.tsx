import { afterAll, describe, expect, test } from 'bun:test';

const uninstall = (await import('./dom')).installDom();
const { cleanup, render } = await import('@testing-library/react');
const { StatLine, statIconFrames } = await import('../../src/ui/components/ItemViews');

afterAll(uninstall);

describe('StatLine', () => {
	test('maps a stat to its atlas icon, including resistances and damage by class', () => {
		expect(statIconFrames('maxHp')).toEqual(['icon.maxHp']);
		expect(statIconFrames('resist.fire')).toEqual(['icon.resistFire']);
		expect(statIconFrames('tagMul.melee')).toEqual(['icon.meleeDamage']);
	});

	test('shows the label of the stat and its value', () => {
		const { container } = render(<StatLine stat="maxHp" value="140" strong />);
		expect(container.textContent).toBe('max HP140');
		expect(container.querySelector('[data-stat="maxHp"]')?.className).toContain(
			'text-gold-bright',
		);
		cleanup();
	});
});
