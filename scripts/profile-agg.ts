/**
 * Summarizes a Chrome trace saved by `agent-browser profiler stop`: idle share and the
 * functions with the most self time. Usage: bun scripts/profile-agg.ts <file> [top=25]
 */
interface CallFrame {
	functionName: string;
	url?: string;
	lineNumber?: number;
}
interface ProfileNode {
	id: number;
	callFrame: CallFrame;
}
interface TraceEvent {
	name: string;
	args?: {
		data?: {
			cpuProfile?: { nodes?: ProfileNode[]; samples?: number[] };
			timeDeltas?: number[];
		};
	};
}

const [file, topArg] = process.argv.slice(2);
if (!file) throw new Error('usage: bun scripts/profile-agg.ts <trace.json> [top]');
const trace = JSON.parse(await Bun.file(file).text()) as { traceEvents: TraceEvent[] };
const callFrames = new Map<number, CallFrame>();
const selfUs = new Map<number, number>();
let total = 0;
for (const e of trace.traceEvents) {
	const data = e.name === 'ProfileChunk' ? e.args?.data : undefined;
	if (!data?.cpuProfile) continue;
	for (const n of data.cpuProfile.nodes ?? []) callFrames.set(n.id, n.callFrame);
	const samples = data.cpuProfile.samples ?? [];
	const deltas = data.timeDeltas ?? [];
	samples.forEach((id, i) => {
		const dt = deltas[i] ?? 0;
		selfUs.set(id, (selfUs.get(id) ?? 0) + dt);
		total += dt;
	});
}
const byFn = new Map<string, number>();
for (const [id, us] of selfUs) {
	const cf = callFrames.get(id);
	if (!cf) continue;
	const where = (cf.url ?? '').split('/').slice(-2).join('/').split('?')[0];
	const key = `${cf.functionName || '(anon)'} ${where}:${(cf.lineNumber ?? 0) + 1}`;
	byFn.set(key, (byFn.get(key) ?? 0) + us);
}
console.log(`sampled ${(total / 1000).toFixed(0)} ms`);
for (const [key, us] of [...byFn].sort((a, b) => b[1] - a[1]).slice(0, Number(topArg ?? 25))) {
	console.log(`${((us / total) * 100).toFixed(1).padStart(5)}%  ${key}`);
}

export {};
