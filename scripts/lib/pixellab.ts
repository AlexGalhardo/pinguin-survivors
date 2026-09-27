// Minimal PixelLab API v2 client (https://api.pixellab.ai/v2/llms.txt).
// Token comes from PIXELLAB_API_TOKEN in .env (Bun loads it automatically).

import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const BASE = 'https://api.pixellab.ai/v2';
export const LOG_FILE = 'art-src/pixellab/log.jsonl';

export type Direction =
	| 'south'
	| 'south-east'
	| 'east'
	| 'north-east'
	| 'north'
	| 'north-west'
	| 'west'
	| 'south-west';

export const DIRECTIONS_8: Direction[] = [
	'south',
	'south-east',
	'east',
	'north-east',
	'north',
	'north-west',
	'west',
	'south-west',
];

function token(): string {
	const t = process.env.PIXELLAB_API_TOKEN;
	if (!t) throw new Error('PIXELLAB_API_TOKEN missing in .env');
	return t;
}

const RETRIES = 4;

/** Retries 5xx/429 with backoff: PixelLab has short outages and rate limits. */
export async function api<T>(
	path: string,
	init: { method?: string; body?: unknown } = {},
): Promise<T> {
	for (let attempt = 0; ; attempt++) {
		const res = await fetch(`${BASE}${path}`, {
			method: init.method ?? (init.body ? 'POST' : 'GET'),
			headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
			body: init.body ? JSON.stringify(init.body) : undefined,
		});
		const text = await res.text();
		if (res.ok) return JSON.parse(text) as T;
		const retryable = res.status >= 500 || res.status === 429;
		if (!retryable || attempt >= RETRIES)
			throw new Error(`PixelLab ${res.status} ${path}: ${text.slice(0, 500)}`);
		await Bun.sleep(2000 * 2 ** attempt);
	}
}

export interface Balance {
	credits: { usd: number };
	subscription: { generations: number; total: number; plan: string };
}

export const getBalance = () => api<Balance>('/balance');

/** Remaining subscription generations, or null when /balance is temporarily failing. */
export async function generationsLeft(): Promise<number | null> {
	try {
		return (await getBalance()).subscription.generations;
	} catch {
		return null;
	}
}

export interface JobStatus {
	id: string;
	status: 'processing' | 'completed' | 'failed';
	last_response?: Record<string, unknown> | null;
}

export async function waitJob(jobId: string, timeoutMs = 15 * 60_000): Promise<JobStatus> {
	const start = Date.now();
	for (;;) {
		const job = await api<JobStatus>(`/background-jobs/${jobId}`);
		if (job.status === 'completed') return job;
		if (job.status === 'failed')
			throw new Error(`job ${jobId} failed: ${JSON.stringify(job.last_response)}`);
		if (Date.now() - start > timeoutMs) throw new Error(`job ${jobId} timed out`);
		await Bun.sleep(5000);
	}
}

export interface CharacterDetail {
	id: string;
	name: string;
	status: string;
	size: { width: number; height: number };
	rotation_urls: Partial<Record<Direction, string>>;
	animations?: unknown[];
}

export const getCharacter = (id: string) => api<CharacterDetail>(`/characters/${id}`);

export async function download(url: string, out: string): Promise<void> {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`download ${res.status} ${url}`);
	mkdirSync(dirname(out), { recursive: true });
	await Bun.write(out, await res.arrayBuffer());
}

export function logGeneration(entry: Record<string, unknown>): void {
	mkdirSync(dirname(LOG_FILE), { recursive: true });
	appendFileSync(LOG_FILE, `${JSON.stringify({ at: new Date().toISOString(), ...entry })}\n`);
}
