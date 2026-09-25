import Phaser from 'phaser';
import { TEX } from '../art/manifest';
import { MAX_ENEMIES_ALIVE } from '../config/constants';
import { ENEMIES, type EnemyType, SPAWN } from '../data/enemies';
import { PLAY_AREA } from '../entities/Arena';
import type { Enemy } from '../entities/Enemy';
import type { Rng } from '../logic/rng';
import { dmgMul, hpMul, overflowHpMul, spawnRate, spdMul } from '../logic/scaling';
import { groupSize, pickEnemyType } from '../logic/spawn';
import type { EnemySystem } from './EnemySystem';

interface PendingSpawn {
	type: EnemyType;
	x: number;
	y: number;
	timeLeft: number;
	marker: Phaser.GameObjects.Image;
	onSpawn?: (e: Enemy) => void;
}

/**
 * Spawns enemies from the weighted pool at the wave's rate. Every spawn is telegraphed
 * (blinking marker for 0.8 s) far from the player. Spawns above the alive cap become
 * extra HP for the next enemies (overflow).
 */
export class SpawnSystem {
	enabled = true;
	private wave = 1;
	private budget = 0;
	private overflow = 0;
	private readonly pending: PendingSpawn[] = [];
	private readonly markers: Phaser.GameObjects.Group;

	constructor(
		scene: Phaser.Scene,
		private readonly enemies: EnemySystem,
		private readonly player: { x: number; y: number },
		private readonly rng: Rng,
	) {
		this.markers = scene.add.group({ classType: Phaser.GameObjects.Image, maxSize: 400 });
	}

	setWave(wave: number): void {
		this.wave = wave;
		this.budget = 0;
		this.overflow = 0;
	}

	get pendingCount(): number {
		return this.pending.length;
	}

	/** Current multipliers for new enemies (wave scaling + overflow). */
	scaling(): { hp: number; dmg: number; spd: number } {
		return {
			hp: hpMul(this.wave) * overflowHpMul(this.overflow),
			dmg: dmgMul(this.wave),
			spd: spdMul(this.wave),
		};
	}

	tick(dt: number, time: number): void {
		if (this.enabled) {
			this.budget += spawnRate(this.wave) * dt;
			// The spawn rate is in enemies/s: a pack of runners consumes one unit per enemy.
			while (this.budget >= 1) {
				const type = pickEnemyType(this.wave, this.rng);
				const size = groupSize(type, this.rng);
				this.budget -= size;
				this.queueGroup(type, size);
			}
		}

		const blinkOn = Math.floor(time / 100) % 2 === 0;
		for (let i = this.pending.length - 1; i >= 0; i--) {
			const p = this.pending[i];
			if (!p) continue;
			p.timeLeft -= dt;
			p.marker.setAlpha(blinkOn ? 1 : 0.35);
			if (p.timeLeft > 0) continue;
			this.pending.splice(i, 1);
			p.marker.setActive(false).setVisible(false);
			const e = this.enemies.spawn(ENEMIES[p.type], p.x, p.y, this.scaling());
			if (e) p.onSpawn?.(e);
		}
	}

	/** Queues `count` enemies of a type around one spawn point (telegraphed). */
	queueGroup(type: EnemyType, count: number, onSpawn?: (e: Enemy) => void): void {
		const origin = this.pickPoint();
		for (let i = 0; i < count; i++) {
			if (this.enemies.aliveCount + this.pending.length >= MAX_ENEMIES_ALIVE && !onSpawn) {
				this.overflow++;
				continue;
			}
			const x = Phaser.Math.Clamp(
				origin.x + (i === 0 ? 0 : this.rng.range(-SPAWN.groupSpread, SPAWN.groupSpread)),
				PLAY_AREA.left + 8,
				PLAY_AREA.right - 8,
			);
			const y = Phaser.Math.Clamp(
				origin.y + (i === 0 ? 0 : this.rng.range(-SPAWN.groupSpread, SPAWN.groupSpread)),
				PLAY_AREA.top + 8,
				PLAY_AREA.bottom - 8,
			);
			const marker = this.markers.get(
				x,
				y,
				TEX.fxTelegraph,
			) as Phaser.GameObjects.Image | null;
			if (!marker) continue;
			marker.setActive(true).setVisible(true).setDepth(2).setPosition(x, y);
			if (onSpawn) marker.setScale(2);
			else marker.setScale(1);
			this.pending.push({ type, x, y, timeLeft: SPAWN.telegraph, marker, onSpawn });
		}
	}

	/** Random point on the arena edges or anywhere, always far from the player. */
	pickPoint(minDistance: number = SPAWN.minPlayerDistance): { x: number; y: number } {
		const inset = SPAWN.edgeInset;
		const a = PLAY_AREA;
		let best = { x: a.left + inset, y: a.top + inset };
		let bestD = -1;
		for (let tries = 0; tries < 12; tries++) {
			let x: number;
			let y: number;
			if (this.rng.chance(SPAWN.edgeChance)) {
				const side = this.rng.int(0, 3);
				x =
					side < 2
						? this.rng.range(a.left + inset, a.right - inset)
						: side === 2
							? a.left + inset
							: a.right - inset;
				y =
					side >= 2
						? this.rng.range(a.top + inset, a.bottom - inset)
						: side === 0
							? a.top + inset
							: a.bottom - inset;
			} else {
				x = this.rng.range(a.left + inset, a.right - inset);
				y = this.rng.range(a.top + inset, a.bottom - inset);
			}
			const d = Math.hypot(x - this.player.x, y - this.player.y);
			if (d >= minDistance) return { x, y };
			if (d > bestD) {
				bestD = d;
				best = { x, y };
			}
		}
		return best;
	}

	/** Cancels every telegraphed spawn (end of wave). */
	clearPending(): void {
		for (const p of this.pending) p.marker.setActive(false).setVisible(false);
		this.pending.length = 0;
	}
}
