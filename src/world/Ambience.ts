import Phaser from 'phaser';
import { KEYS } from '../art/manifest';
import type { BiomeId } from '../config/constants';
import { PALETTE } from '../config/palette';
import { activeBudget } from '../core/tier';
import { CAMPFIRE } from '../data/ambient';
import {
	type CampfireSpot,
	campfireSpots,
	emitRate,
	firePulse,
	weatherFor,
} from '../logic/ambient';
import type { Bounds } from '../logic/arena';
import type { Obstacle } from '../logic/obstacles';
import { GROUND_DEPTH } from './Arena';

/** Above characters and ground marks, below floating numbers and the other overlays (FxSystem). */
const WEATHER_DEPTH = 1e9 - 10;
/** Spawn zone margin around the camera view, world px. */
const ZONE_MARGIN = 48;

interface Fire {
	spot: CampfireSpot;
	img: Phaser.GameObjects.Image;
	glow: Phaser.GameObjects.Image | null;
	phase: number;
}

/**
 * Per-biome weather and campfires (SDD-017). One weather emitter, rebuilt only when the biome
 * changes, capped by `maxAliveParticles` and the tier; a handful of pooled campfire images.
 */
export class Ambience {
	private weather: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
	private readonly zone = new Phaser.Geom.Rectangle(0, 0, 1, 1);
	private readonly zoneSource = {
		getRandomPoint: (p: Phaser.Types.Math.Vector2Like): void => {
			p.x = Math.random() * this.zone.width;
			p.y = Math.random() * this.zone.height;
		},
	};
	private readonly embers: Phaser.GameObjects.Particles.ParticleEmitter;
	private fires: Fire[] = [];
	private spots: CampfireSpot[] = [];
	private time = 0;
	private view = new Phaser.Geom.Rectangle(0, 0, 0, 0);

	constructor(
		private readonly scene: Phaser.Scene,
		private readonly seed: number,
		biome: BiomeId,
		private readonly reducedFlashes: boolean,
	) {
		const budget = activeBudget();
		const source = {
			getRandomPoint: (p: Phaser.Types.Math.Vector2Like): void => {
				const f = this.spots[Math.floor(Math.random() * this.spots.length)];
				p.x = (f?.x ?? 0) + Phaser.Math.Between(-6, 6);
				p.y = (f?.y ?? 0) - 10;
			},
		};
		this.embers = scene.add
			.particles(0, 0, KEYS.weather('dot'), {
				lifespan: { min: 700, max: 1200 },
				speedX: { min: -14, max: 14 },
				speedY: { min: -90, max: -40 },
				scale: { start: 1.5, end: 0 },
				alpha: { start: 1, end: 0 },
				tint: [PALETTE.elFire, PALETTE.crit, PALETTE.fish],
				blendMode: Phaser.BlendModes.ADD,
				emitZone: { type: 'random' as const, source },
				emitting: false,
				maxAliveParticles: Math.ceil(24 * budget.ambientScale),
			})
			.setDepth(WEATHER_DEPTH);
		this.setBiome(biome);
	}

	/** New biome: another weather effect and a fresh campfire roll (the props were re-rolled). */
	setBiome(biome: BiomeId): void {
		this.weather?.destroy();
		this.weather = null;
		this.spots = [];
		const w = weatherFor(biome, activeBudget().ambientScale);
		if (!w) return;
		const d = w.def;
		const { frequency, quantity } = emitRate(w.count, d.life);
		this.weather = this.scene.add
			.particles(0, 0, KEYS.weather(d.shape), {
				lifespan: { min: d.life[0], max: d.life[1] },
				speedX: { min: d.vx[0], max: d.vx[1] },
				speedY: { min: d.vy[0], max: d.vy[1] },
				scale: { min: d.scale[0], max: d.scale[1] },
				alpha: { start: d.alpha, end: 0, ease: 'Cubic.easeIn' },
				tint: [...d.colors],
				rotate: d.shape === 'leaf' ? { min: 0, max: 360 } : 0,
				blendMode: d.additive ? Phaser.BlendModes.ADD : Phaser.BlendModes.NORMAL,
				emitZone: { type: 'random' as const, source: this.zoneSource },
				frequency,
				quantity,
				maxAliveParticles: w.count,
				advance: d.life[0],
			})
			.setDepth(WEATHER_DEPTH);
	}

	/** Arena changed (grow, new biome, new props): places the missing campfires, keeps the rest. */
	sync(bounds: Bounds, side: number, props: readonly Obstacle[]): void {
		this.spots = campfireSpots(this.seed, bounds, side, props, this.spots);
		const withGlow = activeBudget().glow;
		this.spots.forEach((spot, i) => {
			let f = this.fires[i];
			if (!f) {
				f = {
					spot,
					img: this.scene.add.image(0, 0, KEYS.campfire(0)).setOrigin(0.5, 0.85),
					glow: withGlow
						? this.scene.add
								.image(0, 0, KEYS.glow)
								.setBlendMode(Phaser.BlendModes.ADD)
								.setTint(PALETTE.fish)
								.setDepth(GROUND_DEPTH + 5)
						: null,
					phase: i * 1.7,
				};
				this.fires.push(f);
			}
			f.spot = spot;
			f.img
				.setScale(CAMPFIRE.scale)
				.setPosition(Math.round(spot.x), Math.round(spot.y))
				.setDepth(spot.y)
				.setVisible(true);
			f.glow?.setPosition(spot.x, spot.y).setVisible(true);
		});
		for (let i = this.spots.length; i < this.fires.length; i++) {
			this.fires[i]?.img.setVisible(false);
			this.fires[i]?.glow?.setVisible(false);
		}
		const rate = CAMPFIRE.embersPerSecond * this.spots.length * activeBudget().ambientScale;
		if (rate > 0) this.embers.setFrequency(1000 / rate).start();
		else this.embers.stop();
	}

	update(dt: number, view: Phaser.Geom.Rectangle): void {
		this.time += dt;
		this.view.setTo(view.x, view.y, view.width, view.height);
		if (this.weather) {
			this.weather.setPosition(view.x - ZONE_MARGIN, view.y - ZONE_MARGIN);
			this.zone.setSize(view.width + ZONE_MARGIN * 2, view.height + ZONE_MARGIN * 2);
		}
		const frame = Math.floor(this.time / CAMPFIRE.frame);
		for (let i = 0; i < this.spots.length; i++) {
			const f = this.fires[i];
			if (!f) continue;
			f.img.setTexture(KEYS.campfire((frame + i) % CAMPFIRE.frames));
			if (!f.glow) continue;
			const k = firePulse(this.time, f.phase, this.reducedFlashes);
			const size = ((CAMPFIRE.glowRadius * 2) / 128) * (0.9 + 0.1 * k);
			f.glow.setScale(size).setAlpha(0.55 * k);
		}
	}

	/** Campfire lights inside the camera view, appended to `out` (read by the darkness layer). */
	collectLights(out: { x: number; y: number; radius: number; strength: number }[]): void {
		const r = CAMPFIRE.lightRadius;
		for (let i = 0; i < this.spots.length; i++) {
			const s = this.spots[i];
			if (!s) continue;
			if (Math.abs(s.x - this.view.centerX) > this.view.width / 2 + r) continue;
			if (Math.abs(s.y - this.view.centerY) > this.view.height / 2 + r) continue;
			const k = firePulse(this.time, this.fires[i]?.phase ?? 0, this.reducedFlashes);
			out.push({
				x: s.x,
				y: s.y,
				radius: r * (0.92 + 0.08 * k),
				strength: CAMPFIRE.lightStrength * k,
			});
		}
	}

	destroy(): void {
		this.weather?.destroy();
		this.embers.destroy();
		for (const f of this.fires) {
			f.img.destroy();
			f.glow?.destroy();
		}
		this.fires = [];
	}
}
