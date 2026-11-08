import Phaser from 'phaser';
import { KEYS } from '../art/manifest';
import { PALETTE, toCss } from '../config/palette';
import { getParams } from '../core/context';
import { GameEvents } from '../core/events';
import { trackZoom } from '../core/viewport';
import type { AchievementDef } from '../data/achievements';
import { type I18nKey, t } from '../i18n';
import { formatTime } from '../logic/format';
import { xpToNext } from '../logic/progression';
import { worldToScreen } from '../logic/projection';
import { eliteTiers, isBossRound } from '../logic/round';
import { TITLE_FONT, UI_FONT, UI_WEIGHT } from '../ui/font';
import { type Light, Lighting } from '../world/Lighting';
import type { GameScene } from './GameScene';
import { AchievementToast } from './ui-phaser/AchievementToast';
import { addVersionFooter } from './ui-phaser/version-footer';

/** Brotato-style HUD: big bars with the numbers inside, readable counters. */
const BAR_W = 190;
const HP_H = 20;
const XP_H = 12;
const PAD = 10;
const BOSS_W = 340;
const SUPER_W = 220;

export class HudScene extends Phaser.Scene {
	private debugText?: Phaser.GameObjects.Text;
	private lighting!: Lighting;
	private readonly hudLights: Light[] = [];
	private speedText!: Phaser.GameObjects.Text;
	private hpFill!: Phaser.GameObjects.Rectangle;
	private hpText!: Phaser.GameObjects.Text;
	private roundText!: Phaser.GameObjects.Text;
	private timerText!: Phaser.GameObjects.Text;
	private killsText!: Phaser.GameObjects.Text;
	private levelText!: Phaser.GameObjects.Text;
	private xpFill!: Phaser.GameObjects.Rectangle;
	private fishText!: Phaser.GameObjects.Text;
	private superBox!: Phaser.GameObjects.Container;
	private superFill!: Phaser.GameObjects.Rectangle;
	private superText!: Phaser.GameObjects.Text;
	private buildText!: Phaser.GameObjects.Text;
	private potionText!: Phaser.GameObjects.Text;
	private eliteText!: Phaser.GameObjects.Text;
	private fpsText!: Phaser.GameObjects.Text;
	private boss!: Phaser.GameObjects.Container;
	private bossFill!: Phaser.GameObjects.Rectangle;
	private bossName!: Phaser.GameObjects.Text;

	constructor() {
		super('Hud');
	}

	create(): void {
		const text = (size: number, color: number = PALETTE.textLight, bold = false) => ({
			fontFamily: UI_FONT,
			fontSize: `${size}px`,
			fontStyle: bold ? 'bold' : UI_WEIGHT,
			color: toCss(color),
			stroke: toCss(PALETTE.night),
			strokeThickness: 3,
		});
		/** Framed bar: dark border + background, fill anchored left, label centered inside. */
		const bar = (x: number, y: number, w: number, h: number, color: number) => {
			this.add.rectangle(x - 2, y - 2, w + 4, h + 4, PALETTE.night, 0.9).setOrigin(0, 0);
			this.add.rectangle(x, y, w, h, 0x2a2f3a, 1).setOrigin(0, 0);
			return this.add.rectangle(x, y, w, h, color).setOrigin(0, 0);
		};
		this.hpFill = bar(PAD, PAD, BAR_W, HP_H, PALETTE.blood);
		this.hpText = this.add
			.text(PAD + BAR_W / 2, PAD + HP_H / 2, '', text(14, PALETTE.textLight, true))
			.setOrigin(0.5);
		const xpY = PAD + HP_H + 6;
		this.xpFill = bar(PAD, xpY, BAR_W, XP_H, PALETTE.xp);
		this.levelText = this.add
			.text(PAD + BAR_W / 2, xpY + XP_H / 2, '', text(11, PALETTE.textLight, true))
			.setOrigin(0.5);
		const fishY = xpY + XP_H + 8;
		this.add.image(PAD + 8, fishY + 9, KEYS.pickup('fish')).setScale(1.6);
		this.fishText = this.add.text(PAD + 22, fishY, '', text(16, PALETTE.fish, true));
		this.killsText = this.add.text(PAD, fishY + 22, '', text(12, PALETTE.textDim));
		this.roundText = this.add
			.text(0, 6, '', text(16, PALETTE.textLight, true))
			.setOrigin(0.5, 0);
		this.timerText = this.add
			.text(0, 24, '', { ...text(28, PALETTE.textLight, true), fontFamily: TITLE_FONT })
			.setOrigin(0.5, 0);
		this.speedText = this.add.text(0, PAD, '', text(13, PALETTE.crit, true)).setOrigin(1, 0);

		const bossBg = this.add
			.rectangle(0, 0, BOSS_W + 4, 16, PALETTE.night, 0.9)
			.setOrigin(0.5, 0);
		this.bossFill = this.add
			.rectangle(-BOSS_W / 2, 2, BOSS_W, 12, PALETTE.auraOrange)
			.setOrigin(0, 0);
		this.bossName = this.add
			.text(0, 18, '', text(12, PALETTE.auraOrange, true))
			.setOrigin(0.5, 0);
		this.boss = this.add
			.container(0, 62, [bossBg, this.bossFill, this.bossName])
			.setVisible(false);

		const superBg = this.add
			.rectangle(0, 0, SUPER_W + 4, 12, PALETTE.night, 0.9)
			.setOrigin(0.5, 0);
		this.superFill = this.add.rectangle(-SUPER_W / 2, 2, 0, 8, PALETTE.blood).setOrigin(0, 0);
		this.superText = this.add
			.text(0, -18, '', text(13, PALETTE.textLight, true))
			.setOrigin(0.5, 0);
		this.superBox = this.add
			.container(0, 0, [superBg, this.superFill, this.superText])
			.setVisible(false);
		this.buildText = this.add
			.text(PAD, 0, '', text(12, PALETTE.textDim))
			.setOrigin(0, 1)
			.setLineSpacing(2);
		this.potionText = this.add
			.text(0, 0, '', text(12, PALETTE.dotPoison))
			.setOrigin(1, 1)
			.setAlign('right');
		this.eliteText = this.add
			.text(0, 30, '', text(13, PALETTE.auraPurple, true))
			.setOrigin(1, 0);
		// Always on (user request): FPS for performance checks while playing.
		this.fpsText = this.add.text(PAD, 0, '', text(12, PALETTE.textDim, true)).setOrigin(0, 1);

		if (getParams(this).debug) {
			this.debugText = this.add.text(PAD, 110, '', text(11, PALETTE.textDim));
		}

		this.lighting = new Lighting(this, 0.62);
		const footer = addVersionFooter(this);
		const toast = new AchievementToast(this);
		const onUnlock = (defs: AchievementDef[]) => toast.show(defs);
		this.game.events.on(GameEvents.AchievementsUnlocked, onUnlock);
		this.events.once('shutdown', () => {
			this.game.events.off(GameEvents.AchievementsUnlocked, onUnlock);
		});

		const cam = this.cameras.main;
		trackZoom(this, cam, (view) => {
			cam.centerOn(view.width / 2, view.height / 2);
			const cx = Math.round(view.width / 2);
			this.roundText.setX(cx);
			this.timerText.setX(cx);
			this.boss.setX(cx);
			this.speedText.setX(view.width - PAD);
			this.eliteText.setX(view.width - PAD);
			this.superBox.setPosition(cx, view.height - 30);
			this.fpsText.setY(view.height - 6);
			this.buildText.setY(view.height - 24);
			this.potionText.setPosition(view.width - PAD, view.height - 20);
			footer.layout(view);
			this.lighting.resize(view.width, view.height);
			toast.layout(view.width);
		});
	}

	override update(): void {
		const game = this.scene.get('Game') as GameScene;
		const run = game.run;
		if (!run) return;
		this.drawLights(game);
		this.hpFill.width = Math.max(0, BAR_W * (run.hp / run.maxHp));
		this.hpText.setText(t('hud.hpBar', { hp: Math.ceil(run.hp), max: Math.round(run.maxHp) }));
		this.killsText.setText(t('hud.kills', { n: run.kills }));
		this.fishText.setText(String(run.fish));
		this.levelText.setText(t('hud.level', { n: game.level.level }));
		this.xpFill.width = Math.max(
			0,
			BAR_W * Math.min(1, game.level.xp / xpToNext(game.level.level)),
		);
		this.roundText.setText(t('hud.round', { n: run.round }));
		this.timerText
			.setText(formatTime(run.timeLeft))
			.setColor(
				toCss(
					run.timeLeft <= 5 || isBossRound(run.round) ? PALETTE.blood : PALETTE.textLight,
				),
			);
		this.superBox.setVisible(game.superIsUnlocked);
		if (game.superIsUnlocked) {
			const cost = game.superCost;
			const charge = Math.min(run.superCharge, cost);
			const ready = charge >= cost;
			this.superFill.width = SUPER_W * (charge / cost);
			this.superFill.fillColor = ready ? PALETTE.crit : PALETTE.blood;
			this.superText.setText(
				ready ? t('hud.superReady') : t('hud.super', { n: charge, max: cost }),
			);
			this.superText.setAlpha(ready ? 0.6 + 0.4 * Math.sin(this.time.now / 120) : 1);
		}
		const lines = Object.entries(game.build.secondaries).map(
			([id, lv]) =>
				`${t(`card.weapon.${id}.name` as I18nKey)} ${t('hud.level', { n: lv as number })}`,
		);
		const perks = Object.entries(game.build.perks).map(
			([id, lv]) =>
				`${t(`card.perk.${id}.name` as I18nKey)} ${t('hud.level', { n: lv as number })}`,
		);
		this.buildText.setText([...lines, ...perks].join('\n'));
		this.potionText.setText(
			game.potions
				.filter((p) => p.potion && p.condition)
				.map(
					(p) =>
						`${p.used ? '✕ ' : ''}${t(`potion.${p.potion}` as I18nKey)} · ${t(`cond.${p.condition}` as I18nKey)}`,
				)
				.join('\n'),
		);
		const tiers = eliteTiers(run.round);
		this.eliteText
			.setText(tiers.length ? t('hud.eliteRound') : '')
			.setColor(toCss(tiers.includes('orange') ? PALETTE.auraOrange : PALETTE.auraPurple));
		const boss = game.enemies.boss;
		this.boss.setVisible(boss !== null);
		if (boss) {
			this.bossFill.width = Math.max(0, BOSS_W * (boss.hp / boss.maxHp));
			this.bossName.setText(t(`boss.${boss.def.id}` as I18nKey));
		}
		// Always visible so players discover TAB (user request).
		this.speedText.setText(
			t(game.speed > 1 ? 'hud.speedOn' : 'hud.speedHint', { n: game.speed }),
		);
		this.fpsText.setText(t('hud.fps', { n: Math.round(this.game.loop.actualFps) }));
		this.debugText?.setText(
			t('debug.stats', {
				fps: Math.round(this.game.loop.actualFps),
				arena: `${game.arena.sideTiles}x${game.arena.sideTiles}`,
				enemies: game.enemies.active.length,
				silent: game.enemies.spawnStats.silentInView,
				marked: game.enemies.spawnStats.telegraphed,
				spawns: game.enemies.spawnStats.total,
				decals: game.arena.gore.count,
				x: Math.round(game.hero.x),
				y: Math.round(game.hero.y),
			}),
		);
	}

	/** World lights → HUD coordinates (the HUD camera maps 0..view to the screen). */
	private drawLights(game: GameScene): void {
		const view = game.cameras.main.worldView;
		const out = this.hudLights;
		out.length = 0;
		for (const l of game.collectLights()) {
			const s = worldToScreen(l.x, l.y, 16);
			out.push({ x: s.x - view.x, y: s.y - view.y, radius: l.radius, strength: l.strength });
		}
		this.lighting.draw(out);
	}
}
