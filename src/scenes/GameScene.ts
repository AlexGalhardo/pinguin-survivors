import Phaser from 'phaser';
import { ARENA_H, ARENA_W, CAMERA_DEADZONE_H, CAMERA_DEADZONE_W } from '../config/constants';
import { getParams } from '../core/context';
import { createMoveKeys, type MoveKeys } from '../core/input';
import { getView } from '../core/viewport';
import { CHARACTERS } from '../data/characters';
import { debugStats } from '../debug/debug-stats';
import { createArena } from '../entities/Arena';
import { Player } from '../entities/Player';
import { Rng, randomSeed } from '../logic/rng';
import { createRunState, type RunState, runStats } from '../logic/run-state';
import { finalMoveSpeed } from '../logic/stats';

/** Main gameplay scene: arena, player and (later) every combat system. */
export class GameScene extends Phaser.Scene {
	state!: RunState;
	rng!: Rng;
	player!: Player;
	private keys!: MoveKeys;

	constructor() {
		super('Game');
	}

	create(): void {
		const params = getParams(this);
		const seed = params.seed ?? randomSeed();
		this.rng = new Rng(seed);
		this.state = createRunState(params.char ?? 'warrior', seed, params.wave ?? 1);

		const walls = createArena(this, this.rng);
		const def = CHARACTERS[this.state.character];
		this.player = new Player(this, ARENA_W / 2, ARENA_H / 2, def);
		this.physics.add.collider(this.player, walls);
		this.keys = createMoveKeys(this);
		this.refreshStats();

		this.setupCamera();
	}

	/** Re-applies derived stats (speed, etc.) after cards/items change the run. */
	refreshStats(): void {
		const stats = runStats(this.state);
		this.player.speed = finalMoveSpeed(this.player.def.speed, stats);
	}

	private setupCamera(): void {
		const cam = this.cameras.main;
		cam.setBounds(0, 0, ARENA_W, ARENA_H);
		cam.startFollow(this.player, true);
		cam.setDeadzone(CAMERA_DEADZONE_W, CAMERA_DEADZONE_H);
		const apply = () => {
			cam.setSize(this.scale.width, this.scale.height);
			cam.setZoom(getView(this).zoom);
		};
		apply();
		this.scale.on('resize', apply);
		this.events.once('shutdown', () => this.scale.off('resize', apply));
	}

	override update(): void {
		this.player.handleInput(this.keys);
		debugStats.bodies = this.physics.world.bodies.size + this.physics.world.staticBodies.size;
	}
}
