import { expect, test } from 'bun:test';
import { canInterrupt, fpsToFit, locomotion, spriteDir } from '../src/logic/hero-anim';

test('west-side directions mirror the generated east-side ones', () => {
	expect(spriteDir('sw')).toEqual({ dir: 'se', flip: true });
	expect(spriteDir('w')).toEqual({ dir: 'e', flip: true });
	expect(spriteDir('nw')).toEqual({ dir: 'ne', flip: true });
	expect(spriteDir('s')).toEqual({ dir: 's', flip: false });
	expect(spriteDir('ne')).toEqual({ dir: 'ne', flip: false });
});

test('priorities: death > super > hurt > attack > locomotion', () => {
	expect(canInterrupt('attack', true, 'walk8')).toBe(false);
	expect(canInterrupt('attack', false, 'walk8')).toBe(true);
	expect(canInterrupt('attack', true, 'hurt')).toBe(true);
	expect(canInterrupt('death', true, 'hurt')).toBe(false);
	expect(canInterrupt(null, false, 'idle')).toBe(true);
	expect(locomotion(true)).toBe('walk8');
});

test('attack fps fits the weapon cooldown', () => {
	expect(fpsToFit(12, 0.5, 12)).toBe(24);
	expect(fpsToFit(12, 2, 12)).toBe(12);
});
