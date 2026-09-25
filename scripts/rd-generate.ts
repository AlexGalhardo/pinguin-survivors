/**
 * Retro Diffusion (API v2) -> art-src/rd/<key>/: one generation job, logged for reproducibility.
 *
 *   bun scripts/rd-generate.ts --key enemy.chaser --style rd_plus__topdown_item --size 32 \
 *     --prompt "green alien slime" [--height 32] [--n 1] [--seed 7] [--no-bg] [--sheet]
 *     [--palette] [--input path.png] [--strength 0.6] [--check]
 *
 * --check      free dry run: prints the cost, generates nothing.
 * --no-bg      asks for a transparent background (remove_bg).
 * --sheet      animation styles: PNG spritesheet instead of GIF.
 * --palette    constrains colors to Endesga 32 (input_palette built from src/config/palette.ts).
 * Every paid call is appended to art-src/rd-log.jsonl (prompt, style, size, seed, cost, files);
 * docs/art-prompts.md is the human-readable history. Needs RETRO_DIFFUSION_API_KEY in .env.
 */
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { PALETTE } from '../src/config/palette';

const API = 'https://api.retrodiffusion.ai/v2';
const LOG = 'art-src/rd-log.jsonl';

interface Args {
	key: string;
	style: string;
	width: number;
	height: number;
	prompt: string;
	n: number;
	seed?: number;
	noBg: boolean;
	sheet: boolean;
	palette: boolean;
	input?: string;
	strength?: number;
	check: boolean;
}

function parseArgs(argv: string[]): Args {
	const get = (name: string): string | undefined => {
		const i = argv.indexOf(`--${name}`);
		return i >= 0 ? argv[i + 1] : undefined;
	};
	const has = (name: string): boolean => argv.includes(`--${name}`);
	const key = get('key');
	const style = get('style');
	const size = Number(get('size') ?? 32);
	if (!key || !style) {
		console.log(
			'usage: bun scripts/rd-generate.ts --key <manifest.key> --style <prompt_style> ...',
		);
		process.exit(1);
	}
	return {
		key,
		style,
		width: size,
		height: Number(get('height') ?? size),
		prompt: get('prompt') ?? '',
		n: Number(get('n') ?? 1),
		seed: get('seed') !== undefined ? Number(get('seed')) : undefined,
		noBg: has('no-bg'),
		sheet: has('sheet'),
		palette: has('palette'),
		input: get('input'),
		strength: get('strength') !== undefined ? Number(get('strength')) : undefined,
		check: has('check'),
	};
}

/** 32x1 PNG with every Endesga 32 color (RD reads the palette from an image). */
async function paletteImage(): Promise<string> {
	const colors = Object.values(PALETTE);
	const data = Buffer.alloc(colors.length * 3);
	colors.forEach((c, i) => {
		data[i * 3] = (c >> 16) & 0xff;
		data[i * 3 + 1] = (c >> 8) & 0xff;
		data[i * 3 + 2] = c & 0xff;
	});
	const png = await sharp(data, { raw: { width: colors.length, height: 1, channels: 3 } })
		.png()
		.toBuffer();
	return png.toString('base64');
}

async function inputImage(path: string): Promise<string> {
	// The API wants RGB without alpha: flatten transparent pixels on magenta.
	const png = await sharp(readFileSync(path)).flatten({ background: '#ff00ff' }).png().toBuffer();
	return png.toString('base64');
}

async function api(path: string, init: RequestInit, token: string): Promise<unknown> {
	const res = await fetch(`${API}${path}`, {
		...init,
		headers: { 'X-RD-Token': token, 'Content-Type': 'application/json', ...init.headers },
	});
	const body: unknown = await res.json();
	if (!res.ok) throw new Error(`RD ${res.status}: ${JSON.stringify(body)}`);
	return body;
}

interface TaskResult {
	status: string;
	result?: { base64_images?: string[]; balance_cost?: number; remaining_balance?: number };
	error?: unknown;
}

async function main(): Promise<void> {
	const a = parseArgs(process.argv.slice(2));
	const token = process.env.RETRO_DIFFUSION_API_KEY;
	if (!token) throw new Error('RETRO_DIFFUSION_API_KEY missing in .env');
	const body: Record<string, unknown> = {
		prompt: a.prompt,
		prompt_style: a.style,
		width: a.width,
		height: a.height,
		num_images: a.n,
		remove_bg: a.noBg,
		return_spritesheet: a.sheet,
	};
	if (a.seed !== undefined) body.seed = a.seed;
	if (a.palette) body.input_palette = await paletteImage();
	if (a.input) body.input_image = await inputImage(a.input);
	if (a.strength !== undefined) body.strength = a.strength;
	if (a.check) {
		body.check_cost = true;
		console.log(
			JSON.stringify(
				await api('/inferences', { method: 'POST', body: JSON.stringify(body) }, token),
			),
		);
		return;
	}
	const accepted = (await api(
		'/inferences',
		{
			method: 'POST',
			body: JSON.stringify(body),
			headers: { 'Idempotency-Key': crypto.randomUUID() },
		},
		token,
	)) as { task_id: string };
	let task: TaskResult;
	for (;;) {
		await Bun.sleep(2000);
		task = (await api(
			`/inferences/tasks/${accepted.task_id}`,
			{ method: 'GET' },
			token,
		)) as TaskResult;
		if (task.status !== 'pending' && task.status !== 'running') break;
	}
	if (task.status !== 'succeeded' || !task.result?.base64_images) {
		throw new Error(`task ${accepted.task_id} ${task.status}: ${JSON.stringify(task.error)}`);
	}
	const dir = join('art-src/rd', a.key);
	mkdirSync(dir, { recursive: true });
	const stamp = new Date().toISOString().replace(/[:.]/g, '-');
	const files = task.result.base64_images.map((b64, i) => {
		const file = join(dir, `${stamp}_${i}.png`);
		writeFileSync(file, Buffer.from(b64, 'base64'));
		return file;
	});
	const entry = {
		at: new Date().toISOString(),
		key: a.key,
		style: a.style,
		width: a.width,
		height: a.height,
		n: a.n,
		seed: a.seed ?? null,
		prompt: a.prompt,
		removeBg: a.noBg,
		palette: a.palette,
		input: a.input ?? null,
		cost: task.result.balance_cost ?? null,
		remaining: task.result.remaining_balance ?? null,
		files,
	};
	appendFileSync(LOG, `${JSON.stringify(entry)}\n`);
	console.log(JSON.stringify({ files, cost: entry.cost, remaining: entry.remaining }));
}

await main();
