import Phaser from 'phaser';
import { PALETTE, toCss } from '../config/palette';
import { getParams, getSave } from '../core/context';
import { GameEvents } from '../core/events';
import { trackZoom } from '../core/viewport';
import type { VoiceLine } from '../core/voice';
import type { AchievementDef } from '../data/achievements';
import { SUPER } from '../data/superpowers';
import { VOICE } from '../data/voice';
import { type I18nKey, t } from '../i18n';
import { formatTime } from '../logic/format';
import { worldToScreen } from '../logic/iso';
import { xpToNext } from '../logic/progression';
import { eliteTiers, isBossRound } from '../logic/round';
import { AchievementToast } from '../ui/AchievementToast';
import { UI_FONT } from '../ui/font';
import { addVersionFooter } from '../ui/version-footer';
import { type Light, Lighting } from '../world/Lighting';
import type { GameScene } from './GameScene';

const HP_W = 120;
const BOSS_W = 260;

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
	private boss!: Phaser.GameObjects.Container;
	private bossFill!: Phaser.GameObjects.Rectangle;
	private bossName!: Phaser.GameObjects.Text;

	constructor() {
		super('Hud');
	}

	create(): void {
		const text = (size: number, color: number = PALETTE.textLight) => ({
			fontFamily: UI_FONT,
			fontSize: `${size}px`,
			color: toCss(color),
			stroke: toCss(PALETTE.night),
			strokeThickness: 2,
		});
		this.add.rectangle(8, 8, HP_W, 8, PALETTE.night, 0.8).setOrigin(0, 0);
		this.hpFill = this.add.rectangle(9, 9, HP_W - 2, 6, PALETTE.blood).setOrigin(0, 0);
		this.hpText = this.add.text(8, 18, '', text(8)).setOrigin(0, 0);
		this.add.rectangle(8, 29, HP_W, 4, PALETTE.night, 0.8).setOrigin(0, 0);
		this.xpFill = this.add.rectangle(9, 30, 0, 2, 0x5fe0ff).setOrigin(0, 0);
		this.levelText = this.add.text(HP_W + 12, 6, '', text(10, PALETTE.crit)).setOrigin(0, 0);
		this.killsText = this.add.text(8, 36, '', text(8, PALETTE.textDim)).setOrigin(0, 0);
		this.fishText = this.add.text(8, 46, '', text(8, PALETTE.fish)).setOrigin(0, 0);
		this.roundText = this.add.text(0, 4, '', text(12)).setOrigin(0.5, 0);
		this.timerText = this.add.text(0, 18, '', text(16)).setOrigin(0.5, 0);
		this.speedText = this.add.text(0, 4, '', text(16, PALETTE.crit)).setOrigin(1, 0);

		const bossBg = this.add.rectangle(0, 0, BOSS_W, 8, PALETTE.night, 0.85).setOrigin(0.5, 0);
		this.bossFill = this.add
			.rectangle(-BOSS_W / 2 + 1, 1, BOSS_W - 2, 6, PALETTE.auraOrange)
			.setOrigin(0, 0);
		this.bossName = this.add.text(0, 9, '', text(8, PALETTE.auraOrange)).setOrigin(0.5, 0);
		this.boss = this.add
			.container(0, 40, [bossBg, this.bossFill, this.bossName])
			.setVisible(false);

		const superBg = this.add.rectangle(0, 0, 120, 6, PALETTE.night, 0.85).setOrigin(0.5, 0);
		this.superFill = this.add.rectangle(-59, 1, 0, 4, PALETTE.blood).setOrigin(0, 0);
		this.superText = this.add.text(0, -12, '', text(8, PALETTE.textLight)).setOrigin(0.5, 0);
		this.superBox = this.add
			.container(0, 0, [superBg, this.superFill, this.superText])
			.setVisible(false);
		this.buildText = this.add.text(8, 0, '', text(8, PALETTE.textDim)).setOrigin(0, 1);
		this.potionText = this.add
			.text(0, 0, '', text(8, PALETTE.dotPoison))
			.setOrigin(1, 1)
			.setAlign('right');
		this.eliteText = this.add.text(0, 40, '', text(10, PALETTE.auraPurple)).setOrigin(0.5, 0);

		if (getParams(this).debug) {
			this.debugText = this.add.text(8, 58, '', text(8, PALETTE.textDim));
		}

		this.lighting = new Lighting(this, 0.62);
		const footer = addVersionFooter(this);
		const toast = new AchievementToast(this);
		const onUnlock = (defs: AchievementDef[]) => toast.show(defs);
		this.game.events.on(GameEvents.AchievementsUnlocked, onUnlock);
		const subtitle = this.add
			.text(0, 0, '', { ...text(10, PALETTE.textLight), align: 'center' })
			.setOrigin(0.5, 1)
			.setVisible(false);
		let subtitleTimer: Phaser.Time.TimerEvent | null = null;
		const onVoice = (line: VoiceLine) => {
			if (!getSave(this).settings.subtitles) return;
			const name = t(`hero.${line.hero}` as I18nKey);
			subtitle
				.setText(`${name}: ${t(`vo.${line.hero}.${line.event}.${line.n}` as I18nKey)}`)
				.setVisible(true);
			subtitleTimer?.remove();
			subtitleTimer = this.time.delayedCall(VOICE.subtitleSeconds * 1000, () =>
				subtitle.setVisible(false),
			);
		};
		this.game.events.on(GameEvents.Voice, onVoice);
		this.events.once('shutdown', () => {
			this.game.events.off(GameEvents.AchievementsUnlocked, onUnlock);
			this.game.events.off(GameEvents.Voice, onVoice);
		});

		const cam = this.cameras.main;
		trackZoom(this, cam, (view) => {
			cam.centerOn(view.width / 2, view.height / 2);
			const cx = Math.round(view.width / 2);
			this.roundText.setX(cx);
			this.timerText.setX(cx);
			this.boss.setX(cx);
			this.speedText.setX(view.width - 8);
			this.superBox.setPosition(cx, view.height - 24);
			subtitle.setPosition(cx, view.height - 46);
			this.buildText.setY(view.height - 8);
			this.potionText.setPosition(view.width - 8, view.height - 8);
			this.eliteText.setX(cx);
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
		this.hpFill.width = Math.max(0, (HP_W - 2) * (run.hp / run.maxHp));
		this.hpText.setText(t('hud.hp', { hp: Math.ceil(run.hp), max: run.maxHp }));
		this.killsText.setText(t('hud.kills', { n: run.kills }));
		this.fishText.setText(t('hud.fish', { n: run.fish }));
		this.levelText.setText(t('hud.level', { n: game.level.level }));
		this.xpFill.width = Math.max(
			0,
			(HP_W - 2) * Math.min(1, game.level.xp / xpToNext(game.level.level)),
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
			const charge = Math.min(run.superCharge, SUPER.charge);
			const ready = charge >= SUPER.charge;
			this.superFill.width = 118 * (charge / SUPER.charge);
			this.superFill.fillColor = ready ? PALETTE.crit : PALETTE.blood;
			this.superText.setText(ready ? t('hud.superReady') : t('hud.super', { n: charge }));
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
			this.bossFill.width = Math.max(0, (BOSS_W - 2) * (boss.hp / boss.maxHp));
			this.bossName.setText(t(`boss.${boss.def.id}` as I18nKey));
		}
		this.speedText.setText(game.speed > 1 ? t('hud.speed', { n: game.speed }) : '');
		this.debugText?.setText(
			t('debug.stats', {
				fps: Math.round(this.game.loop.actualFps),
				chunks: game.chunks.count,
				enemies: game.enemies.active.length,
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
