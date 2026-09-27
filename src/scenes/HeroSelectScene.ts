import Phaser from 'phaser';
import { KEYS } from '../art/manifest';
import { HERO_IDS, type HeroId } from '../config/constants';
import { PALETTE } from '../config/palette';
import { getSave, persist, setRunHero } from '../core/context';
import { type I18nKey, t } from '../i18n';
import { nextDifficulty } from '../logic/difficulty';
import { setupScreen, text } from '../ui/screen';

const UNLOCK_HINT: Record<HeroId, I18nKey | null> = {
	jack: null,
	bob: 'select.unlockBob',
	lucia: 'select.unlockLucia',
};

/** Pick one of the three penguins; locked ones show how to unlock them (P-17). */
export class HeroSelectScene extends Phaser.Scene {
	private index = 0;

	constructor() {
		super('HeroSelect');
	}

	create(): void {
		const save = getSave(this);
		this.index = 0;
		const cards = HERO_IDS.map((hero) => {
			const unlocked = save.heroes[hero].unlocked;
			const frame = this.add
				.rectangle(0, 8, 150, 214, 0x151a24, 0.95)
				.setStrokeStyle(2, PALETTE.rarityCommon);
			const hasPortrait = this.textures.exists(KEYS.portrait(hero));
			const sprite = hasPortrait
				? this.add.image(0, -36, KEYS.portrait(hero))
				: this.add.image(0, -30, KEYS.heroFacing(hero, 1, 's')).setScale(2);
			if (!unlocked) sprite.setTint(0x000000).setAlpha(0.6);
			const name = this.add
				.text(0, 30, t(`hero.${hero}` as I18nKey).toUpperCase(), text(16))
				.setOrigin(0.5, 0);
			const role = this.add
				.text(0, 52, t(`role.${hero}` as I18nKey), text(8, PALETTE.textDim, 140))
				.setOrigin(0.5, 0);
			const hint = UNLOCK_HINT[hero];
			const info = this.add
				.text(
					0,
					72,
					unlocked
						? `${t('select.level', { n: save.heroes[hero].level })}
${t('select.best', { n: save.progress.hero[hero].bestRound })}`
						: `${t('select.locked')}\n${hint ? t(hint) : ''}`,
					text(9, unlocked ? PALETTE.crit : PALETTE.blood, 140),
				)
				.setOrigin(0.5, 0);
			frame.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
				this.index = HERO_IDS.indexOf(hero);
				this.start();
			});
			const box = this.add.container(0, 0, [frame, sprite, name, role, info]);
			return { hero, box, frame, unlocked };
		});
		const help = this.add
			.text(0, 0, t('select.start'), text(9, PALETTE.textDim))
			.setOrigin(0.5, 0);
		const diff = this.add.text(0, 0, '', text(12, PALETTE.crit)).setOrigin(0.5, 0);
		const diffInfo = this.add.text(0, 0, '', text(8, PALETTE.textDim, 360)).setOrigin(0.5, 0);
		const showDifficulty = () => {
			const d = save.settings.difficulty;
			diff.setText(t('select.difficulty', { v: t(`difficulty.${d}` as I18nKey) }));
			diffInfo.setText(t(`difficulty.${d}.desc` as I18nKey));
		};
		const changeDifficulty = (dir: -1 | 1) => {
			save.settings.difficulty = nextDifficulty(save.settings.difficulty, dir);
			persist(this);
			showDifficulty();
		};
		showDifficulty();
		diff.setInteractive({ useHandCursor: true }).on('pointerdown', () => changeDifficulty(1));
		const highlight = () =>
			cards.forEach((c, i) => {
				c.frame.setStrokeStyle(2, i === this.index ? PALETTE.crit : PALETTE.rarityCommon);
				c.box.setScale(i === this.index ? 1.05 : 1);
			});
		const kb = this.input.keyboard;
		const move = (d: number) => {
			this.index = (this.index + d + cards.length) % cards.length;
			highlight();
		};
		kb?.on('keydown-LEFT', () => move(-1));
		kb?.on('keydown-A', () => move(-1));
		kb?.on('keydown-RIGHT', () => move(1));
		kb?.on('keydown-D', () => move(1));
		kb?.on('keydown-UP', () => changeDifficulty(-1));
		kb?.on('keydown-W', () => changeDifficulty(-1));
		kb?.on('keydown-DOWN', () => changeDifficulty(1));
		kb?.on('keydown-S', () => changeDifficulty(1));
		kb?.on('keydown-ENTER', () => this.start());
		kb?.on('keydown-SPACE', () => this.start());
		kb?.on('keydown-ESC', () => this.scene.start('MainMenu'));
		// Backspace too: in fullscreen the browser takes Esc to leave fullscreen.
		kb?.on('keydown-BACKSPACE', () => this.scene.start('MainMenu'));
		setupScreen(this, t('select.title'), (view, cx) => {
			const cy = Math.round(view.height / 2);
			cards.forEach((c, i) => {
				c.box.setPosition(cx + (i - 1) * 170, cy);
			});
			diff.setPosition(cx, cy + 124);
			diffInfo.setPosition(cx, cy + 142);
			help.setPosition(cx, cy + 170);
		});
		highlight();
	}

	private start(): void {
		const hero = HERO_IDS[this.index] as HeroId;
		if (!getSave(this).heroes[hero].unlocked) {
			this.cameras.main.shake(120, 0.004);
			return;
		}
		setRunHero(this.game, hero);
		this.scene.start('Game');
	}
}
