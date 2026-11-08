import { en } from '../src/i18n/en';
import { es } from '../src/i18n/es';
import { ptBR } from '../src/i18n/pt-BR';
import { zhCN } from '../src/i18n/zh-CN';

type Table = Readonly<Record<string, string>>;

const REFERENCE: Table = en;
const LANGS: readonly [string, Table][] = [
	['pt-BR', ptBR],
	['es', es],
	['zh-CN', zhCN],
];

const placeholders = (text: string): string => {
	const names = [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1] ?? '');
	return names.sort().join(',');
};

let problems = 0;
for (const [lang, table] of LANGS) {
	const missing = Object.keys(REFERENCE).filter((k) => !(k in table));
	const extra = Object.keys(table).filter((k) => !(k in REFERENCE));
	const divergent = Object.keys(REFERENCE).filter(
		(k) => k in table && placeholders(REFERENCE[k] ?? '') !== placeholders(table[k] ?? ''),
	);
	console.log(
		`${lang}: missing ${missing.length} · extra ${extra.length} · placeholders ${divergent.length}`,
	);
	for (const k of missing) console.error(`  missing ${k}`);
	for (const k of extra) console.error(`  extra ${k}`);
	for (const k of divergent)
		console.error(`  placeholders ${k}: en "${REFERENCE[k]}" vs "${table[k]}"`);
	problems += missing.length + extra.length + divergent.length;
}

process.exit(problems > 0 ? 1 : 0);
