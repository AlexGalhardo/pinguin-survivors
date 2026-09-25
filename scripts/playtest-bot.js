/**
 * Playtest bot for Starfall Survivors (dev builds only, uses window.__GAME__).
 * Paste/eval in the page (e.g. agent-browser eval) on a URL like
 *   /?skipMenu=1&char=ranger&seed=1&speed=4&unlockAll=1
 * It kites enemies and enemy shots with the virtual stick, collects gold, picks cards and
 * buys items with simple "reasonable player" priorities, and logs every wave in
 * window.__bot.log. Stops at window.__bot.target (default wave 30 cleared) or on game over.
 */
(() => {
	const G = window.__GAME__;
	if (!G) throw new Error('window.__GAME__ missing (dev build only)');
	const bot = {
		target: window.__botTarget ?? 30,
		log: [],
		done: false,
		result: null,
		errors: [],
	};
	window.__bot = bot;
	window.addEventListener('error', (e) => bot.errors.push(String(e.message)));

	const active = (k) => G.game.scene.isActive(k);
	const STAT_W = {
		damage: 3,
		attackSpeed: 3,
		maxHp: 2.5,
		maxHpPct: 2.5,
		armor: 2.5,
		hpRegen: 2,
		critChance: 2,
		lifesteal: 2,
		dodge: 2,
		moveSpeed: 1.5,
		range: 1.5,
		critDamage: 1.5,
		luck: 1,
		pickupRange: 0.8,
		abilityPower: 1.5,
		projectiles: 3,
		pierce: 1.5,
	};
	/** Converts a stat delta into "percent points" so flat and % stats compare. */
	const NORM = {
		maxHp: 0.1,
		hpRegen: 1,
		armor: 0.5,
		pickupRange: 0.02,
		luck: 0.03,
		projectiles: 3,
		pierce: 1.5,
	};
	const statValue = (k, v) =>
		(STAT_W[k] ?? 1) *
		v *
		(NORM[k] ?? 10) *
		(k === 'abilityPower' && G.state.character === 'mage' ? 2.2 : 1);

	function scoreCard(c) {
		const s = G.state;
		const g = G.scene;
		if (c.kind === 'ability') {
			const owned = s.abilities.find((a) => a.id === c.ability);
			if (owned) return 5 + owned.level;
			if (s.abilities.length < 4) return 4.5;
			return s.abilities.length < 6 ? 1.5 : 0;
		}
		if (c.kind === 'special') {
			if (c.special === 'revive') return s.revives > 0 ? 0 : 7;
			if (c.special === 'projectile') return 6;
			if (c.special === 'pierce') return 3;
			return s.hp < g.maxHp * 0.5 ? 5 : 0.5;
		}
		return statValue(c.stat, c.value) * (s.hp < g.maxHp * 0.4 && c.stat === 'maxHp' ? 1.5 : 1);
	}

	function scoreItem(offer) {
		const g = G.scene;
		const s = G.state;
		const item = window.__items?.[offer.itemId];
		let score = 0;
		const mods = item?.mods ?? {};
		for (const [k, v] of Object.entries(mods)) score += statValue(k, v);
		// Do not let Max HP drop too low.
		if ((mods.maxHpPct ?? 0) < 0 && g.maxHp < 40) score -= 6;
		for (const a of s.abilities) {
			if (window.__evo?.[a.id] === offer.itemId) score += 6;
		}
		return score;
	}

	// Item and evolution data come from the modules (loaded once).
	import('/src/data/items.ts').then((m) => {
		window.__items = Object.fromEntries(m.ITEMS.map((i) => [i.id, i]));
	});
	import('/src/data/abilities.ts').then((m) => {
		window.__evo = m.EVOLUTION_ITEM;
	});

	let lastWave = 0;
	let busy = false;
	function logWave() {
		const s = G.state;
		const g = G.scene;
		bot.log.push({
			wave: s.wave,
			hp: s.hp,
			maxHp: g.maxHp,
			gold: s.gold,
			kills: s.totals.kills,
			abilities: s.abilities
				.map((a) => `${a.id}:${a.level}${a.evolved ? '*' : ''}`)
				.join(','),
			items: s.items.length,
			dmg: +g.stats.damage.toFixed(2),
			armor: +g.stats.armor.toFixed(1),
		});
	}

	/**
	 * Steering: repel from enemies (predicting their next position) and enemy shots,
	 * avoid walls; when safe, melee classes close in on the nearest isolated enemy and
	 * ranged classes keep a comfortable distance while collecting gold.
	 */
	function steer() {
		const g = G.scene;
		const p = g.player;
		const melee = G.state.character === 'warrior';
		const hpRatio = G.state.hp / Math.max(1, g.maxHp);
		const danger = melee ? 55 : 85;
		let fx = 0;
		let fy = 0;
		let crowd = 0;
		let nearest = null;
		let nd = 1e9;
		for (const e of g.enemies.active) {
			if (!e.active || e.burrowed) continue;
			const vx = e.body.velocity.x * 0.25;
			const vy = e.body.velocity.y * 0.25;
			const dx = p.x - (e.x + vx);
			const dy = p.y - (e.y + vy);
			const d = Math.hypot(dx, dy) || 1;
			if (d < nd) {
				nd = d;
				nearest = e;
			}
			const reach = danger + e.radius * 1.5 + (e.def.isBoss ? 40 : 0) + (e.elite ? 20 : 0);
			if (d > reach) continue;
			crowd++;
			const w = ((reach - d) / reach) ** 2 * (e.def.isBoss ? 3 : e.elite ? 2 : 1);
			fx += (dx / d) * w;
			fy += (dy / d) * w;
		}
		g.enemyShots.forEachActive((s) => {
			const dx = p.x - s.x;
			const dy = p.y - s.y;
			const d = Math.hypot(dx, dy) || 1;
			if (d > 60) return;
			const w = ((60 - d) / 60) ** 2 * 3;
			fx += (dx / d) * w;
			fy += (dy / d) * w;
		});
		const wall = (v, lo, hi) =>
			v < lo + 70 ? (lo + 70 - v) / 70 : v > hi - 70 ? -(v - (hi - 70)) / 70 : 0;
		fx += wall(p.x, 32, 928) * 2;
		fy += wall(p.y, 32, 508) * 2;
		let mag = Math.hypot(fx, fy);
		const safe = mag < 0.2 && crowd <= (melee ? 2 : 1) && hpRatio > 0.35;
		if (safe && melee && nearest && nd > 32) {
			// Close in on the nearest enemy to use the blade.
			fx = nearest.x - p.x;
			fy = nearest.y - p.y;
			mag = Math.hypot(fx, fy) || 1;
		} else if (mag < 0.15) {
			let best = null;
			let bd = 170;
			g.pickups.forEachActive((c) => {
				const d = Math.hypot(c.x - p.x, c.y - p.y);
				if (d < bd) {
					bd = d;
					best = c;
				}
			});
			if (best) {
				fx = best.x - p.x;
				fy = best.y - p.y;
			} else {
				const cx = 480 - p.x;
				const cy = 270 - p.y;
				fx = -cy + cx * 0.3;
				fy = cx + cy * 0.3;
			}
			mag = Math.hypot(fx, fy) || 1;
		}
		G.pad.x = fx / mag;
		G.pad.y = fy / mag;
	}

	function tick() {
		if (bot.done) return;
		const g = G.scene;
		if (!g?.state) return;
		if (active('GameOver')) {
			bot.result = { died: true, wave: G.state.wave };
			bot.done = true;
			G.pad.x = 0;
			G.pad.y = 0;
			return;
		}
		if (active('Pause')) return G.press('Escape');
		if (active('Unlock')) return G.press('Enter');
		if (busy) return;
		if (active('CardPick')) {
			const cards = G.game.scene.getScene('CardPick').data$.cards;
			let best = 0;
			cards.forEach((c, i) => {
				if (scoreCard(c) > scoreCard(cards[best])) best = i;
			});
			busy = true;
			G.press(`Digit${best + 1}`);
			setTimeout(() => (busy = false), 400);
			return;
		}
		if (active('Shop')) {
			const shop = G.game.scene.getScene('Shop');
			const offers = shop.d.offers;
			const buyable = offers
				.map((o, i) => ({ o, i, s: scoreItem(o) }))
				.filter((x) => !x.o.sold && x.o.price <= G.state.gold && x.s > 0.5)
				.sort((a, b) => b.s - a.s);
			busy = true;
			if (buyable.length > 0) G.press(`Digit${buyable[0].i + 1}`);
			else G.press('Escape');
			setTimeout(() => (busy = false), 250);
			return;
		}
		if (G.state.wave !== lastWave && g.waves.inCombat) {
			lastWave = G.state.wave;
			logWave();
			if (G.state.wave > bot.target) {
				bot.result = { died: false, wave: G.state.wave - 1 };
				bot.done = true;
				G.pad.x = 0;
				G.pad.y = 0;
				return;
			}
		}
		if (g.waves.inCombat) steer();
	}
	bot.timer = setInterval(tick, 50);
	return 'bot started';
})();
