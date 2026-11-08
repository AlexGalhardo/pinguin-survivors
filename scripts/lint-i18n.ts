import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanJsxLiterals } from './lib/i18n-literals';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const uiRoot = fileURLToPath(new URL('../src/ui/', import.meta.url));

const files = [...new Bun.Glob('**/*.tsx').scanSync({ cwd: uiRoot, absolute: true })].sort();

let total = 0;
for (const file of files) {
	for (const hit of scanJsxLiterals(readFileSync(file, 'utf8'))) {
		console.error(`${relative(repoRoot, file)}:${hit.line} [${hit.kind}] ${hit.value}`);
		total++;
	}
}

console.log(`lint-i18n: ${files.length} .tsx file(s), ${total} visible literal(s) outside t()`);
process.exit(total > 0 ? 1 : 0);
