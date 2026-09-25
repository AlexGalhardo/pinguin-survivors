// Injected by scripts/profile.sh: keeps 300 enemies and 500 piercing player shots alive and
// records frame times in window.__FT__ (dev build only; needs ?god=1 so the run doesn't end).
(() => {
	const s = window.__GAME__.scene;
	const types = ['chaser', 'runner', 'tank', 'shooter'];
	window.__FT__ = [];
	let last = performance.now();
	const tick = () => {
		const now = performance.now();
		window.__FT__.push(now - last);
		last = now;
		const need = 300 - s.enemies.aliveCount;
		for (let i = 0; i < need; i++) s.debugSpawn(types[i % 4], 1);
		for (let k = 0; s.playerShots.activeCount < 500 && k < 60; k++) {
			const a = Math.random() * Math.PI * 2;
			s.playerShots.fire({
				texture: 'proj.blaster',
				x: 480,
				y: 270,
				dirX: Math.cos(a),
				dirY: Math.sin(a),
				speed: 120,
				damage: 0.01,
				range: 2000,
				pierce: 99,
				radius: 3,
			});
		}
		requestAnimationFrame(tick);
	};
	requestAnimationFrame(tick);
	return 'stress on';
})();
