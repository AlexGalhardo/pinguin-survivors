import { describe, expect, it } from 'bun:test';
import type { Card, SpecialCardId } from '../src/data/cards';
import {
	abilityOptions,
	applyCard,
	cardRerollCost,
	generateCards,
	statCardValue,
} from '../src/logic/cards';
import { Rng } from '../src/logic/rng';
import { createRunState, type RunState, runStats } from '../src/logic/run-state';
import { finalMaxHp } from '../src/logic/stats';

const maxHp = (s: RunState) => finalMaxHp(runStats(s));

describe('card generation', () => {
	it('returns 3 distinct cards', () => {
		const rng = new Rng(4);
		for (let i = 0; i < 300; i++) {
			const cards = generateCards(
				{ wave: 1 + (i % 20), luck: 0, abilities: [], revives: 0 },
				rng,
			);
			expect(cards).toHaveLength(3);
			expect(new Set(cards.map((c) => c.id)).size).toBe(3);
		}
	});

	it('scales stat values by rarity', () => {
		expect(statCardValue(5, 'common', true)).toBe(5);
		expect(statCardValue(5, 'rare', true)).toBe(8);
		expect(statCardValue(0.08, 'epic')).toBeCloseTo(0.176);
		expect(statCardValue(1, 'legendary', true)).toBe(3);
	});

	it('only offers owned abilities when the 6 slots are full', () => {
		const abilities = [
			{ id: 'orbital_drones', level: 1 },
			{ id: 'chain_lightning', level: 5 },
			{ id: 'plasma_nova', level: 2 },
			{ id: 'cryo_field', level: 1 },
			{ id: 'homing_missiles', level: 3 },
			{ id: 'laser_beam', level: 4 },
		];
		const opts = abilityOptions(abilities);
		expect(opts.map((c) => c.id)).not.toContain('ability.chain_lightning');
		expect(opts).toHaveLength(5);
		const rng = new Rng(2);
		for (let i = 0; i < 200; i++) {
			for (const c of generateCards({ wave: 10, luck: 0, abilities, revives: 0 }, rng)) {
				if (c.kind === 'ability') expect(c.ability).not.toBe('chain_lightning');
			}
		}
	});

	it('does not offer new abilities once 6 are owned', () => {
		const abilities = ['a', 'b', 'c', 'd', 'e', 'orbital_drones'].map((id) => ({
			id,
			level: 1,
		}));
		expect(abilityOptions(abilities).map((c) => c.id)).toEqual(['ability.orbital_drones']);
	});

	it('never offers revive while holding a charge, nor specials below their rarity', () => {
		const rng = new Rng(8);
		for (let i = 0; i < 500; i++) {
			for (const c of generateCards(
				{ wave: 30, luck: 200, abilities: [], revives: 1 },
				rng,
			)) {
				if (c.kind !== 'special') continue;
				expect(c.special).not.toBe('revive');
				if (c.special === 'projectile') expect(['epic', 'legendary']).toContain(c.rarity);
				if (c.special === 'full_heal') expect(c.rarity).not.toBe('common');
			}
		}
	});
});

describe('applyCard', () => {
	it('adds stat cards and heals Max HP gains', () => {
		const s = createRunState('warrior', 1);
		s.hp = 10;
		const card: Card = {
			kind: 'stat',
			id: 'stat.max_hp',
			rarity: 'common',
			stat: 'maxHp',
			value: 5,
		};
		applyCard(s, card, maxHp);
		expect(maxHp(s)).toBe(35);
		expect(s.hp).toBe(15);
	});

	it('learns and levels abilities up to 5', () => {
		const s = createRunState('mage', 1);
		const card: Card = {
			kind: 'ability',
			id: 'ability.plasma_nova',
			rarity: 'common',
			ability: 'plasma_nova',
			level: 1,
		};
		for (let i = 0; i < 7; i++) applyCard(s, card, maxHp);
		expect(s.abilities).toEqual([{ id: 'plasma_nova', level: 5 }]);
	});

	it('applies specials: revive (max 1), full heal, projectile, pierce', () => {
		const s = createRunState('ranger', 1);
		s.hp = 1;
		const sp = (special: SpecialCardId): Card => ({
			kind: 'special',
			id: `special.${special}`,
			rarity: 'epic',
			special,
		});
		applyCard(s, sp('revive'), maxHp);
		applyCard(s, sp('revive'), maxHp);
		expect(s.revives).toBe(1);
		applyCard(s, sp('full_heal'), maxHp);
		expect(s.hp).toBe(20);
		applyCard(s, sp('projectile'), maxHp);
		applyCard(s, sp('pierce'), maxHp);
		expect(runStats(s).projectiles).toBe(1);
		expect(runStats(s).pierce).toBe(1);
	});

	it('re-roll cost is 2 + N and grows per re-roll', () => {
		expect(cardRerollCost(1, 0)).toBe(3);
		expect(cardRerollCost(5, 2)).toBe(9);
	});
});
