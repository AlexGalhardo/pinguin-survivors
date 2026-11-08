import Phaser from 'phaser';
import { PALETTE, toCss } from '../config/palette';
import { sfx } from '../core/audio';
import { getParams } from '../core/context';
import { GameEvents } from '../core/events';
import { activeBudget } from '../core/tier';
import { trackZoom } from '../core/viewport';
import type { AchievementDef } from '../data/achievements';
import { GEAR_SLOTS } from '../data/equipment';
import { HEAL_POTION } from '../data/potions';
import { t } from '../i18n';
import { xpToNext } from '../logic/progression';
import { worldToScreen } from '../logic/projection';
import { eliteTiers, isBossRound } from '../logic/round';
import { achievementName } from '../ui/achievement-text';
import { UI_FONT, UI_WEIGHT } from '../ui/font';
import { hudDue, hudWeapons, publishHud } from '../ui/hud-bridge';
import { showToast } from '../ui/toast';
import { type Light, Lighting } from '../world/Lighting';
import type { GameScene } from './GameScene';

/**
 * Everything the player reads during a run is React (`Hud`, toasts); this scene only publishes
 * the HUD snapshot, draws the darkness layer and, with `?debug=1`, the debug overlay (the one
 * place Phaser text is allowed, SDD-004 A2).
 */
export class HudScene extends Phaser.Scene {
	private debugText?: Phaser.GameObjects.Text;
	private lighting: Lighting | null = null;
	private readonly hudLights: Light[] = [];

	constructor() {
		super('Hud');
	}

	create(): void {
		if (getParams(this).debug) {
			this.debugText = this.add.text(10, 10, '', {
				fontFamily: UI_FONT,
				fontSize: '11px',
				fontStyle: UI_WEIGHT,
				color: toCss(PALETTE.textDim),
				stroke: toCss(PALETTE.night),
				strokeThickness: 3,
			});
		}
		if (activeBudget().dynamicLights) this.lighting = new Lighting(this, 0.62);
		const onUnlock = (defs: AchievementDef[]) => {
			sfx(this, 'sfx.achievement');
			for (const def of defs) showToast(`${t('ach.unlocked')}: ${achievementName(def)}`);
		};
		this.game.events.on(GameEvents.AchievementsUnlocked, onUnlock);
		this.events.once('shutdown', () => {
			this.game.events.off(GameEvents.AchievementsUnlocked, onUnlock);
		});
		const cam = this.cameras.main;
		trackZoom(this, cam, (view) => {
			cam.centerOn(view.width / 2, view.height / 2);
			this.lighting?.resize(view.width, view.height);
		});
	}

	override update(): void {
		const game = this.scene.get('Game') as GameScene;
		const run = game.run;
		if (!run) return;
		this.drawLights(game);
		if (hudDue()) this.publishReactHud(game);
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

	/** Snapshot for the React HUD (~10 Hz). */
	private publishReactHud(game: GameScene): void {
		const run = game.run;
		const tiers = eliteTiers(run.round);
		const boss = game.enemies.boss;
		publishHud({
			hp: run.hp,
			maxHp: run.maxHp,
			level: game.level.level,
			xp: game.level.xp,
			xpToNext: xpToNext(game.level.level),
			fish: run.fish,
			kills: run.kills,
			round: run.round,
			timeLeft: run.timeLeft,
			bossRound: isBossRound(run.round),
			boss: boss ? { id: boss.def.id, hp: boss.hp, maxHp: boss.maxHp } : null,
			superpower: game.superIsUnlocked
				? { charge: Math.min(run.superCharge, game.superCost), cost: game.superCost }
				: null,
			elite: tiers.includes('orange') ? 'orange' : tiers.length ? 'purple' : 'none',
			weapons: hudWeapons(game.build),
			gear: GEAR_SLOTS.map((slot) => run.gear?.equipped[slot] ?? null),
			gambits: game.potions.flatMap((p, slot) =>
				p.potion && p.condition
					? [
							{
								slot,
								potion: p.potion as string,
								condition: p.condition as string,
								used: p.used,
							},
						]
					: [],
			),
			healPotion: run.healPotion.level
				? {
						charges: run.healPotion.charges,
						level: run.healPotion.level,
						rarity: run.healPotion.rarity,
						kills: run.healPotion.kills,
						killsPerPotion: HEAL_POTION.killsPerPotion,
					}
				: null,
			speed: game.speed,
			fps: Math.round(this.game.loop.actualFps),
		});
	}

	/** World lights → HUD coordinates (the HUD camera maps 0..view to the screen). */
	private drawLights(game: GameScene): void {
		if (!this.lighting) return;
		const view = game.cameras.main.worldView;
		const out = this.hudLights;
		out.length = 0;
		const max = activeBudget().maxLights;
		for (const l of game.collectLights()) {
			if (out.length >= max) break;
			const s = worldToScreen(l.x, l.y, 16);
			out.push({ x: s.x - view.x, y: s.y - view.y, radius: l.radius, strength: l.strength });
		}
		this.lighting.draw(out);
	}
}
