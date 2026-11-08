import { describe, expect, test } from 'bun:test';
import { scanJsxLiterals } from '../scripts/lib/i18n-literals';

describe('scanJsxLiterals: positivos', () => {
	test('texto literal entre tags', () => {
		expect(scanJsxLiterals('const a = <p>Olá</p>;')).toEqual([
			{ line: 1, kind: 'text', value: 'Olá' },
		]);
	});

	test('texto em múltiplas linhas aponta a linha certa', () => {
		const src = 'export function A() {\n\treturn (\n\t\t<p>Play</p>\n\t);\n}';
		expect(scanJsxLiterals(src)).toEqual([{ line: 3, kind: 'text', value: 'Play' }]);
	});

	test('atributos visíveis com string literal', () => {
		const src =
			'<div><button title="Iniciar" aria-label="Fechar" placeholder="Nome" alt="Logo" /></div>';
		expect(scanJsxLiterals(src).map((h) => h.kind)).toEqual(['attr', 'attr', 'attr', 'attr']);
	});

	test('expressão só com string literal', () => {
		expect(scanJsxLiterals("<p>{'Texto'}</p>")).toEqual([
			{ line: 1, kind: 'expr', value: 'Texto' },
		]);
	});

	test('atributo visível com string literal em expressão', () => {
		expect(scanJsxLiterals("<b title={'Oi'} />")).toEqual([
			{ line: 1, kind: 'attr', value: 'Oi' },
		]);
	});

	test('JSX dentro de arrow e de ternário', () => {
		const src =
			'const l = items.map((i) => <li>Abrir</li>);\nconst m = ok ? <b>Sim</b> : null;';
		expect(scanJsxLiterals(src).map((h) => h.value)).toEqual(['Abrir', 'Sim']);
	});

	test('texto dentro de elementos aninhados', () => {
		expect(
			scanJsxLiterals('<div><p>Oi</p>{x && <b>Tchau</b>}</div>').map((h) => h.value),
		).toEqual(['Oi', 'Tchau']);
	});

	test('template literal sem expressão é literal', () => {
		expect(scanJsxLiterals('<p>{`Oi`}</p>')).toEqual([{ line: 1, kind: 'expr', value: 'Oi' }]);
	});
});

describe('scanJsxLiterals: negativos', () => {
	test('texto vindo de t() não é literal', () => {
		expect(scanJsxLiterals("<p>{t('menu.play')}</p>")).toEqual([]);
		expect(scanJsxLiterals("<b title={t('x.y')} aria-label={t('x.z')} />")).toEqual([]);
	});

	test('só números, espaços e pontuação', () => {
		expect(scanJsxLiterals('<span>{" "} · 3 — 4 … ×2 !</span>')).toEqual([]);
	});

	test('entidades HTML não contam como letras', () => {
		expect(scanJsxLiterals('<p>&nbsp;&amp;</p>')).toEqual([]);
	});

	test('atributo não visível com texto literal é ignorado', () => {
		expect(scanJsxLiterals('<div className="btn" data-id="abc" id={"main"} />')).toEqual([]);
	});

	test('operadores e genéricos em código TS não viram JSX', () => {
		const src = 'const s = useState<string>("Oi");\nif (a < b && c > d) run(a<b);';
		expect(scanJsxLiterals(src)).toEqual([]);
	});

	test('comentários são ignorados', () => {
		expect(scanJsxLiterals('// <p>Oi</p>\n/* title="Oi" */\n<p>{/* Oi */}</p>')).toEqual([]);
	});

	test('expressão com mais de um token não é literal sozinho', () => {
		expect(scanJsxLiterals("<p>{'a' + x}</p>")).toEqual([]);
	});

	test('string fora de JSX não é checada', () => {
		expect(scanJsxLiterals("const label = 'Olá';")).toEqual([]);
	});
});
