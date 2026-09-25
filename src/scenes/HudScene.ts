import Phaser from 'phaser';
import { TEX } from '../art/manifest';
import { PALETTE } from '../config/palette';
import { MODIFIER_NAMES, STRINGS, TUTORIAL } from '../config/strings';
import { type AbilitySlotInfo, bus, GameEvent } from '../core/events';
import { fitUiCamera } from '../core/viewport';
import { MAX_ABILITIES } from '../data/abilities';
import { formatTime } from '../logic/format';
import type { ViewSize } from '../logic/viewport';
import { SaveSystem } from '../systems/SaveSystem';
import { Bar } from '../ui/Bar';
import { addIcon } from '../ui/IconFactory';
import { addPanel } from '../ui/PixelPanel';
import { addText } from '../ui/text';
import { pixelIn } from '../ui/transition';
import type { GameScene } from './GameScene';

const MARGIN = 4;
const HP_W = 92;
const SLOT = 20;
const BOSS_W = 180;
/** Timer turns red (and blinks) in the last seconds. */
const TIMER_WARN = 5;
const MAX_ARROWS = 6;
const ARROW_INSET = 10;

interface SlotView {
	panel: Phaser.GameObjects.NineSlice;
	icon: Phaser.GameObjects.Image | null;
	level: Phaser.GameObjects.BitmapText;
	cooldown: Phaser.GameObjects.Rectangle;
	id: string;
}

/** HUD drawn in logical pixels on top of the GameScene (runs in parallel). */
export class HudScene extends Phaser.Scene {
	private banner!: Phaser.GameObjects.BitmapText;
	private hpBar!: Bar;
	private hpText!: Phaser.GameObjects.BitmapText;
	private reviveIcon!: Phaser.GameObjects.Image;
	private goldIcon!: Phaser.GameObjects.Image;
	private goldText!: Phaser.GameObjects.BitmapText;
	private waveText!: Phaser.GameObjects.BitmapText;
	private timerText!: Phaser.GameObjects.BitmapText;
	private bossBar!: Bar;
	private bossLabel!: Phaser.GameObjects.BitmapText;
	private slots: SlotView[] = [];
	/** Off-screen indicators for the boss and elites. */
	private arrows: Phaser.GameObjects.Image[] = [];
	private viewW = 480;
	private viewH = 270;
	private remaining = 0;

	constructor() {
		super('Hud');
	}

	create(): void {
		this.slots = [];
		this.arrows = Array.from({ length: MAX_ARROWS }, () =>
			this.add.image(0, 0, TEX.uiArrow).setVisible(false).setDepth(5),
		);
		this.hpBar = new Bar(this, 0, 0, HP_W, 10, PALETTE.red);
		this.hpText = addText(this, 0, 0, '', { originX: 0.5 });
		this.reviveIcon = addIcon(this, 0, 0, 'revive').setVisible(false);
		this.goldIcon = addIcon(this, 0, 0, 'gold');
		this.goldText = addText(this, 0, 0, '0', { color: PALETTE.amber });
		this.waveText = addText(this, 0, 0, '', { originX: 0.5, color: PALETTE.silver });
		this.timerText = addText(this, 0, 0, '', { originX: 0.5, scale: 2 });
		this.bossBar = new Bar(this, 0, 0, BOSS_W, 8, PALETTE.magenta).setVisible(false);
		this.bossLabel = addText(this, 0, 0, STRINGS.boss, { originX: 0.5, color: PALETTE.salmon });
		this.bossLabel.setVisible(false);
		for (let i = 0; i < MAX_ABILITIES; i++) {
			this.slots.push({
				panel: addPanel(this, 0, 0, SLOT, SLOT),
				icon: null,
				level: addText(this, 0, 0, '', { color: PALETTE.yellow, originX: 1, originY: 1 }),
				cooldown: this.add.rectangle(0, 0, SLOT - 4, 0, PALETTE.void, 0.6).setOrigin(0, 0),
				id: '',
			});
		}
		this.banner = addText(this, 0, 0, '', {
			scale: 3,
			color: PALETTE.amber,
			originX: 0.5,
			originY: 0.5,
		}).setVisible(false);

		fitUiCamera(this, (view) => this.layout(view));
		this.bindEvents();
		this.syncFromGame();
		this.startTutorial();
		pixelIn(this);
	}

	private bindEvents(): void {
		const events = bus(this.game);
		events.onScene(this, GameEvent.WaveStarted, ({ wave, duration, modifier }) => {
			this.setWave(wave, duration);
			const mod = modifier
				? ` - ${MODIFIER_NAMES[modifier as keyof typeof MODIFIER_NAMES] ?? ''}`
				: '';
			this.showBanner(`${STRINGS.wave} ${wave}${mod}`);
		});
		events.onScene(this, GameEvent.WaveEnded, () =>
			this.showBanner(STRINGS.waveCleared, PALETTE.green),
		);
		events.onScene(this, GameEvent.WaveTimer, ({ remaining }) => this.setTimer(remaining));
		events.onScene(this, GameEvent.PlayerHpChanged, ({ hp, maxHp, revives }) =>
			this.setHp(hp, maxHp, revives),
		);
		events.onScene(this, GameEvent.GoldChanged, ({ gold }) => this.goldText.setText(`${gold}`));
		events.onScene(this, GameEvent.BossSpawned, () => this.setBoss(true, 1));
		events.onScene(this, GameEvent.BossHpChanged, ({ hp, maxHp }) =>
			this.setBoss(true, hp / maxHp),
		);
		events.onScene(this, GameEvent.BossDied, () => this.setBoss(false, 0));
		events.onScene(this, GameEvent.AbilitiesChanged, ({ slots }) => this.setSlots(slots));
		events.onScene(this, GameEvent.PlayerDied, () => this.setBoss(false, 0));
	}

	/** The HUD may start after the first events were emitted: pull the current state once. */
	private syncFromGame(): void {
		const game = this.gameScene;
		if (!game?.waves) return;
		const s = game.state;
		this.setHp(s.hp, game.maxHp, s.revives);
		this.goldText.setText(`${s.gold}`);
		if (game.waves.schedule) this.setWave(s.wave, game.waves.remaining);
		this.setSlots(game.abilities.slots());
		const boss = game.waves.boss;
		this.setBoss(!!boss, boss ? boss.hp / boss.maxHp : 0);
		if (game.waves.phase === 'intro') this.showBanner(`${STRINGS.wave} ${s.wave}`);
	}

	private get gameScene(): GameScene | null {
		return (this.scene.get('Game') as GameScene | null) ?? null;
	}

	private layout(view: ViewSize): void {
		this.viewW = view.width;
		this.viewH = view.height;
		const cx = Math.round(view.width / 2);
		this.hpBar.setPosition(MARGIN, MARGIN);
		this.hpText.setPosition(MARGIN + HP_W / 2, MARGIN + 2);
		this.reviveIcon.setPosition(MARGIN + HP_W + 10, MARGIN + 5);
		this.goldIcon.setPosition(MARGIN + 8, MARGIN + 21);
		this.goldText.setPosition(MARGIN + 18, MARGIN + 17);
		this.waveText.setPosition(cx, MARGIN);
		this.timerText.setPosition(cx, MARGIN + 10);
		this.bossLabel.setPosition(cx, MARGIN + 30);
		this.bossBar.setPosition(cx - BOSS_W / 2, MARGIN + 40);
		const y = view.height - SLOT - MARGIN;
		this.slots.forEach((s, i) => {
			const x = MARGIN + i * (SLOT + 2);
			s.panel.setPosition(x, y);
			s.icon?.setPosition(x + SLOT / 2, y + SLOT / 2);
			s.level.setPosition(x + SLOT - 1, y + SLOT - 1);
			s.cooldown.setPosition(x + 2, y + 2);
		});
		this.banner.setPosition(cx, Math.round(view.height / 3));
	}

	private setHp(hp: number, maxHp: number, revives: number): void {
		this.hpBar.setRatio(maxHp > 0 ? hp / maxHp : 0);
		this.hpText.setText(`${Math.max(0, Math.ceil(hp))}/${maxHp}`);
		this.reviveIcon.setVisible(revives > 0);
	}

	private setWave(wave: number, remaining: number): void {
		this.waveText.setText(`${STRINGS.wave} ${wave}`);
		this.setTimer(remaining);
	}

	private setTimer(remaining: number): void {
		this.remaining = Math.ceil(remaining);
		this.timerText.setText(formatTime(this.remaining));
		this.timerText.setTint(this.remaining <= TIMER_WARN ? PALETTE.red : PALETTE.white);
	}

	private setBoss(visible: boolean, ratio: number): void {
		this.bossBar.setVisible(visible).setRatio(ratio);
		this.bossLabel.setVisible(visible);
	}

	private setSlots(infos: AbilitySlotInfo[]): void {
		this.slots.forEach((s, i) => {
			const info = infos[i];
			if (!info) {
				s.icon?.destroy();
				s.icon = null;
				s.id = '';
				s.level.setText('');
				s.cooldown.setSize(SLOT - 4, 0);
				return;
			}
			if (s.id !== info.id) {
				s.icon?.destroy();
				s.icon = addIcon(this, s.panel.x + SLOT / 2, s.panel.y + SLOT / 2, info.id);
				s.id = info.id;
				this.children.bringToTop(s.cooldown);
				this.children.bringToTop(s.level);
			}
			s.level.setText(info.evolved ? '*' : `${info.level}`);
			s.panel.setTint(info.evolved ? PALETTE.amber : 0xffffff);
		});
	}

	/** Arrows at the screen edge pointing to off-screen bosses and elites. */
	private updateArrows(game: GameScene, time: number): void {
		const view = game.cameras.main.worldView;
		const cx = view.centerX;
		const cy = view.centerY;
		let n = 0;
		for (const e of game.enemies.active) {
			if (n >= MAX_ARROWS) break;
			if (!e.active || (!e.def.isBoss && !e.elite)) continue;
			if (view.contains(e.x, e.y)) continue;
			const dx = e.x - cx;
			const dy = e.y - cy;
			const hw = this.viewW / 2 - ARROW_INSET;
			const hh = this.viewH / 2 - ARROW_INSET;
			const t = Math.min(
				hw / Math.max(1e-3, Math.abs(dx)),
				hh / Math.max(1e-3, Math.abs(dy)),
			);
			const arrow = this.arrows[n++];
			if (!arrow) break;
			const pulse = Math.floor(time / 200) % 2 === 0 ? 1 : 0.6;
			arrow
				.setVisible(true)
				.setPosition(
					Math.round(this.viewW / 2 + dx * t),
					Math.round(this.viewH / 2 + dy * t),
				)
				.setRotation(Math.atan2(dy, dx))
				.setTint(e.def.isBoss ? PALETTE.red : PALETTE.amber)
				.setScale(e.def.isBoss ? 2 : 1)
				.setAlpha(pulse);
		}
		for (let i = n; i < this.arrows.length; i++) this.arrows[i]?.setVisible(false);
	}

	override update(time: number): void {
		// Cooldown fills are polled (cheap) instead of evented every frame.
		const game = this.gameScene;
		if (game?.enemies) this.updateArrows(game, time);
		if (game?.abilities) {
			const infos = game.abilities.slots();
			this.slots.forEach((s, i) => {
				const ready = infos[i]?.ready ?? 1;
				s.cooldown.setSize(SLOT - 4, Math.round((SLOT - 4) * (1 - ready)));
			});
		}
		if (this.remaining <= TIMER_WARN && this.remaining > 0) {
			this.timerText.setVisible(Math.floor(time / 250) % 2 === 0);
		} else this.timerText.setVisible(true);
	}

	/** First run only: cycles short hints at the bottom of the screen during wave 1. */
	private startTutorial(): void {
		if (SaveSystem.get().tutorialDone) return;
		const text = addText(this, 0, 0, '', { color: PALETTE.yellow, originX: 0.5 });
		let i = 0;
		const show = () => {
			const hint = TUTORIAL.hints[i];
			if (!hint || SaveSystem.get().tutorialDone) {
				text.destroy();
				return;
			}
			text.setText(hint).setPosition(Math.round(this.viewW / 2), this.viewH - 40);
			i++;
			this.time.delayedCall(4500, show);
		};
		this.time.delayedCall(1500, show);
	}

	private showBanner(text: string, color: number = PALETTE.amber): void {
		this.tweens.killTweensOf(this.banner);
		this.banner.setText(text).setTint(color).setAlpha(1).setVisible(true);
		this.tweens.add({
			targets: this.banner,
			alpha: 0,
			delay: 900,
			duration: 300,
			onComplete: () => this.banner.setVisible(false),
		});
	}
}
