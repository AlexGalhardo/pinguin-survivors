// Balance report (SDD-013 RF-03): reads run-end JSONL (sim `--jsonl`, bot `--json`, exported
// telemetry) and writes docs/reports/balance-auto-<date>.md (the hand-written balance-<date>.md is never overwritten) with the A4 goals marked ✓/✗/n/d.
// Usage: bun scripts/balance-report.ts <file.jsonl> [more.jsonl...] [--out docs/reports/x.md]
import { readFileSync, writeFileSync } from 'node:fs';
import { renderReport } from '../src/logic/sim/balance-report';
import { parseJsonl } from '../src/logic/telemetry';

const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const out = outIdx >= 0 ? args[outIdx + 1] : undefined;
const files = args.filter((a, i) => !a.startsWith('--') && (outIdx < 0 || i !== outIdx + 1));
if (files.length === 0) {
	console.error('usage: bun scripts/balance-report.ts <file.jsonl>... [--out path.md]');
	process.exit(1);
}
const events = files.flatMap((f) => parseJsonl(readFileSync(f, 'utf8')));
if (events.length === 0) {
	console.error('no valid run-end events in the input');
	process.exit(1);
}
const date = new Date().toISOString().slice(0, 10);
const path = out ?? `docs/reports/balance-auto-${date}.md`;
writeFileSync(path, renderReport(events, { date, sources: files }));
console.log(`${path}: ${events.length} runs`);
