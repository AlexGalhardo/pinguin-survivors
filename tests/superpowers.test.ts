import { expect, test } from 'bun:test';
import { SUPERPOWERS } from '../src/data/superpowers';

test("Bob's bomb rings place every explosion around him", () => {
	const bob = SUPERPOWERS.bob;
	const total = (bob.rings ?? []).reduce((sum, ring) => sum + ring.count, 0);
	expect(total).toBe(bob.explosions ?? 0);
});
