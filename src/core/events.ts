import type Phaser from 'phaser';

/** Every cross-scene event (Game <-> HUD <-> CardPick <-> Shop). Emitted on game.events. */
export enum GameEvent {
	RunStarted = 'run-started',
	PlayerHpChanged = 'player-hp-changed',
	PlayerDied = 'player-died',
	PlayerRevived = 'player-revived',
	GoldChanged = 'gold-changed',
	WaveStarted = 'wave-started',
	WaveTimer = 'wave-timer',
	WaveEnded = 'wave-ended',
	BossSpawned = 'boss-spawned',
	BossHpChanged = 'boss-hp-changed',
	BossDied = 'boss-died',
	EnemyKilled = 'enemy-killed',
	AbilitiesChanged = 'abilities-changed',
	CardPicked = 'card-picked',
	ShopClosed = 'shop-closed',
	RunEnded = 'run-ended',
	SettingsChanged = 'settings-changed',
}

export interface AbilitySlotInfo {
	id: string;
	level: number;
	/** 0..1 cooldown fill (1 = ready). */
	ready: number;
}

/** Payload of each event. */
export interface GameEventMap {
	[GameEvent.RunStarted]: undefined;
	[GameEvent.PlayerHpChanged]: { hp: number; maxHp: number; revives: number };
	[GameEvent.PlayerDied]: { canRevive: boolean };
	[GameEvent.PlayerRevived]: undefined;
	[GameEvent.GoldChanged]: { gold: number };
	[GameEvent.WaveStarted]: { wave: number; duration: number };
	[GameEvent.WaveTimer]: { wave: number; remaining: number };
	[GameEvent.WaveEnded]: { wave: number };
	[GameEvent.BossSpawned]: { maxHp: number };
	[GameEvent.BossHpChanged]: { hp: number; maxHp: number };
	[GameEvent.BossDied]: undefined;
	[GameEvent.EnemyKilled]: { type: string; x: number; y: number };
	[GameEvent.AbilitiesChanged]: { slots: AbilitySlotInfo[] };
	[GameEvent.CardPicked]: { cardId: string };
	[GameEvent.ShopClosed]: undefined;
	[GameEvent.RunEnded]: undefined;
	[GameEvent.SettingsChanged]: undefined;
}

type Handler<E extends GameEvent> = (payload: GameEventMap[E]) => void;

/** Typed wrapper over the global game event emitter. */
export class EventBus {
	constructor(private readonly emitter: Phaser.Events.EventEmitter) {}

	emit<E extends GameEvent>(event: E, payload: GameEventMap[E]): void {
		this.emitter.emit(event, payload);
	}

	on<E extends GameEvent>(event: E, handler: Handler<E>, context?: unknown): void {
		this.emitter.on(event, handler, context);
	}

	off<E extends GameEvent>(event: E, handler: Handler<E>, context?: unknown): void {
		this.emitter.off(event, handler, context);
	}

	/** Subscribes for the lifetime of a scene (auto-removed on shutdown). */
	onScene<E extends GameEvent>(scene: Phaser.Scene, event: E, handler: Handler<E>): void {
		this.emitter.on(event, handler);
		scene.events.once('shutdown', () => this.emitter.off(event, handler));
	}
}

const buses = new WeakMap<Phaser.Game, EventBus>();

export function bus(game: Phaser.Game): EventBus {
	let b = buses.get(game);
	if (!b) {
		b = new EventBus(game.events);
		buses.set(game, b);
	}
	return b;
}
