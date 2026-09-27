import Phaser from 'phaser';
import type { GameSpeed, HeroId } from '../config/constants';
import { getParams } from '../core/context';
import { gamepadMove } from '../core/gamepad';
import { anyDown, createMoveKeys, type MoveKeys } from '../core/input';
import { trackZoom } from '../core/viewport';
import { HEROES } from '../data/heroes';
import { Hero } from '../entities/Hero';
import { inputToWorld } from '../logic/iso';
import { randomSeed } from '../logic/rng';
import { nextSpeed } from '../logic/speed';
import { ChunkManager } from '../world/ChunkManager';

/** Padding (screen px) around the camera view where chunks are already built. */
const VIEW_PAD = 96;

export class GameScene extends Phaser.Scene {
	hero!: Hero;
	chunks!: ChunkManager;
	private keys!: MoveKeys;
	/** Multiplies simulation dt, scene timers and tweens (TAB toggles 1x/2x). */
	speed: GameSpeed = 1;

	constructor() {
		super('Game');
	}

	create(): void {
		const params = getParams(this);
		const heroId: HeroId = params.hero ?? 'jack';
		const seed = params.seed ?? randomSeed();
		this.keys = createMoveKeys(this);
		this.speed = 1;
		// addKey captures TAB so the browser does not move focus out of the canvas.
		this.input.keyboard
			?.addKey(Phaser.Input.Keyboard.KeyCodes.TAB)
			.on('down', () => this.setSpeed(nextSpeed(this.speed)));
		this.chunks = new ChunkManager(this, seed, 'antarctica');
		this.hero = new Hero(this, heroId, params.tier ?? 1, HEROES[heroId].moveSpeed);

		const cam = this.cameras.main;
		trackZoom(this, cam);
		cam.startFollow(this.hero.sprite, true, 0.12, 0.12);
		cam.centerOn(this.hero.sprite.x, this.hero.sprite.y);

		this.scene.launch('Hud');
		this.events.once('shutdown', () => this.chunks.destroy());
	}

	override update(_time: number, deltaMs: number): void {
		const dt = (Math.min(deltaMs, 50) / 1000) * this.speed;
		const k = this.keys;
		let ix = (anyDown(k.right) ? 1 : 0) - (anyDown(k.left) ? 1 : 0);
		let iy = (anyDown(k.down) ? 1 : 0) - (anyDown(k.up) ? 1 : 0);
		if (ix === 0 && iy === 0 && gamepadMove.connected) {
			ix = gamepadMove.x;
			iy = gamepadMove.y;
		}
		this.hero.update(dt, inputToWorld(ix, iy));

		const v = this.cameras.main.worldView;
		this.chunks.update({
			x: v.x - VIEW_PAD,
			y: v.y - VIEW_PAD,
			width: v.width + VIEW_PAD * 2,
			height: v.height + VIEW_PAD * 2,
		});
	}

	setSpeed(speed: GameSpeed): void {
		this.speed = speed;
		this.time.timeScale = speed;
		this.tweens.timeScale = speed;
	}
}
