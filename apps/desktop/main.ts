import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { app, BrowserWindow, dialog, ipcMain, protocol, shell } from 'electron';
import { initSteam, openInOverlay, steamReady, submitScore, unlockAchievement } from './steam';

/**
 * Electron shell (SDD-007 RF-03, ADR-012): borderless fullscreen window (F11 toggles), context
 * isolation, the game served from `app://game/` out of the packaged `game/` folder, and the
 * `window.platform` bridge (see preload.ts) backed by files in userData and Steamworks.
 */
protocol.registerSchemesAsPrivileged([
	{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

// Bundled output folder; not `__dirname`, which `bun build` replaces with the source path.
const APP_DIR = (): string => join(app.getAppPath(), 'app');
const GAME_DIR = (): string => join(APP_DIR(), 'game');
const SAVE_DIR = (): string => app.getPath('userData');

/** The save lives in `save.json` (Steam Cloud syncs it); the one backup key gets its own file. */
const saveFile = (key: string): string =>
	join(SAVE_DIR(), key.endsWith('.backup') ? 'save.backup.json' : 'save.json');

let win: BrowserWindow | null = null;

function createWindow(): void {
	win = new BrowserWindow({
		fullscreen: true,
		frame: false,
		backgroundColor: '#0b0e14',
		autoHideMenuBar: true,
		webPreferences: {
			preload: join(APP_DIR(), 'preload.js'),
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: true,
		},
	});
	win.setMenuBarVisibility(false);
	win.webContents.on('before-input-event', (event, input) => {
		if (input.type === 'keyDown' && input.key === 'F11') {
			event.preventDefault();
			toggleFullscreen();
		}
	});
	// The game never opens windows or navigates away: external links go to the OS browser.
	win.webContents.setWindowOpenHandler(({ url }) => {
		openExternal(url);
		return { action: 'deny' };
	});
	win.webContents.on('will-navigate', (event, url) => {
		if (!url.startsWith('app://game/')) event.preventDefault();
	});
	win.on('closed', () => {
		win = null;
	});
	void win.loadURL('app://game/index.html');
}

function toggleFullscreen(): void {
	if (win) win.setFullScreen(!win.isFullScreen());
}

function openExternal(url: string): void {
	if (/^https?:\/\//i.test(url)) void shell.openExternal(url);
}

function registerIpc(): void {
	// Sync IPC keeps the renderer bridge synchronous (PinguinBridge) while the sandbox stays on.
	ipcMain.on('platform:storage:get', (event, key: string) => {
		try {
			event.returnValue = readFileSync(saveFile(key), 'utf8');
		} catch {
			event.returnValue = null;
		}
	});
	ipcMain.on('platform:storage:set', (event, key: string, raw: string) => {
		try {
			mkdirSync(SAVE_DIR(), { recursive: true });
			const file = saveFile(key);
			// Write then rename so a crash never leaves a half-written save.
			writeFileSync(`${file}.tmp`, raw, 'utf8');
			renameSync(`${file}.tmp`, file);
			event.returnValue = true;
		} catch (error) {
			console.error('[save] write failed', error);
			event.returnValue = false;
		}
	});
	ipcMain.on('platform:export', (_event, filename: string, raw: string) => {
		const options = { defaultPath: filename };
		const target = win
			? dialog.showSaveDialogSync(win, options)
			: dialog.showSaveDialogSync(options);
		if (target) writeFileSync(target, raw, 'utf8');
	});
	ipcMain.on('platform:achievement', (_event, id: string) => unlockAchievement(id));
	ipcMain.on('platform:leaderboard', (_event, board: string, score: number) =>
		submitScore(board, score),
	);
	ipcMain.on('platform:fullscreen', () => toggleFullscreen());
	ipcMain.on('platform:openUrl', (_event, url: string) => {
		if (!/^https?:\/\//i.test(url)) return;
		if (!openInOverlay(url)) openExternal(url);
	});
	ipcMain.on('platform:quit', () => app.quit());
	ipcMain.on('platform:info', (event) => {
		event.returnValue = { cloud: steamReady() };
	});
}

const MIME: Record<string, string> = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.json': 'application/json',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.webp': 'image/webp',
	'.svg': 'image/svg+xml',
	'.ogg': 'audio/ogg',
	'.mp3': 'audio/mpeg',
	'.wav': 'audio/wav',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2',
	'.wasm': 'application/wasm',
};

function serveGame(): void {
	// fs (not net.fetch): it reads inside the asar archive the game is packed into.
	protocol.handle('app', async (request) => {
		const { pathname } = new URL(request.url);
		const rel = decodeURIComponent(pathname).replace(/^\/+/, '') || 'index.html';
		const root = GAME_DIR();
		const file = resolve(root, rel);
		// Never serve anything outside the game folder.
		if (!file.startsWith(root + sep)) return new Response('Forbidden', { status: 403 });
		try {
			const body = await readFile(file);
			const type = MIME[extname(file).toLowerCase()] ?? 'application/octet-stream';
			return new Response(body, { headers: { 'content-type': type } });
		} catch {
			return new Response('Not found', { status: 404 });
		}
	});
}

if (!app.requestSingleInstanceLock()) app.quit();

void app.whenReady().then(() => {
	initSteam();
	registerIpc();
	serveGame();
	createWindow();
});

app.on('window-all-closed', () => app.quit());
