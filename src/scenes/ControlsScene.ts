import Phaser from 'phaser';
import { PALETTE } from '../config/palette';
import { getSave, persist } from '../core/context';
import { type I18nKey, t } from '../i18n';
import { ACTIONS, type Action, DEFAULT_BINDS, keyLabel, rebind } from '../logic/keybinds';
import { MenuList } from './ui-phaser/MenuList';
import { setupScreen, text } from './ui-phaser/screen';

/** Rebind gameplay keys (PLAN 7.1). Enter on an action, then press the new key; Esc cancels. */
export class ControlsScene extends Phaser.Scene {
	private waiting: Action | null = null;

	constructor() {
		super('Controls');
	}

	create(data: { from?: string }): void {
		const save = getSave(this);
		const binds = save.settings.keys;
		this.waiting = null;
		const back = () => {
			if (this.waiting) return;
			this.scene.start('Settings', data);
		};
		const items = ACTIONS.map((action) => ({
			label: () =>
				t('controls.row', {
					action: t(`action.${action}` as I18nKey),
					key: this.waiting === action ? t('controls.press') : keyLabel(binds[action]),
				}),
			onSelect: () => {
				this.waiting = action;
				menu.refresh();
			},
		}));
		const menu = new MenuList(
			this,
			[
				...items,
				{
					label: () => t('controls.reset'),
					onSelect: () => {
						Object.assign(binds, DEFAULT_BINDS);
						persist(this);
					},
				},
				{ label: () => t('menu.back'), onSelect: back },
			],
			{ x: 0, y: 0, fontSize: 12, spacing: 20, onBack: back },
		);
		const hint = this.add
			.text(0, 0, t('controls.hint'), text(8, PALETTE.textDim, 420))
			.setOrigin(0.5, 0);
		const pad = this.add
			.text(0, 0, t('controls.pad'), text(8, PALETTE.textDim, 420))
			.setOrigin(0.5, 0);
		// Captures the next key while an action is waiting (before MenuList handles it).
		this.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
			const action = this.waiting;
			if (!action || e.code === 'Enter') return;
			e.stopImmediatePropagation();
			if (e.code !== 'Escape' && rebind(binds, action, e.code)) persist(this);
			// Let the Enter/Escape that follows this frame reach the menu as a no-op.
			this.time.delayedCall(0, () => {
				this.waiting = null;
				menu.refresh();
			});
		});
		setupScreen(this, t('controls.title'), (view, cx) => {
			menu.layout(cx, Math.round(view.height / 2 - menu.height / 2));
			hint.setPosition(cx, view.height - 64);
			pad.setPosition(cx, view.height - 46);
		});
	}
}
