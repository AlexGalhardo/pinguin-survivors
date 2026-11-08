export interface JsxLiteral {
	line: number;
	kind: 'text' | 'attr' | 'expr';
	value: string;
}

const VISIBLE_ATTRS = new Set(['title', 'aria-label', 'placeholder', 'alt']);
const JSX_AFTER = new Set([
	'',
	'(',
	',',
	'[',
	'{',
	'=',
	':',
	'?',
	'&&',
	'||',
	'!',
	';',
	'=>',
	'return',
	'yield',
	'await',
	'case',
	'default',
	'else',
	'do',
]);
const LETTER = /\p{L}/u;
const IDENT_START = /[A-Za-z_$]/;
const IDENT = /[\w$-]/;

type Frame =
	| { type: 'children' }
	| { type: 'tag'; pendingAttr?: string }
	| {
			type: 'code';
			depth: number;
			attr?: string;
			tokens: number;
			literal?: string;
			literalPos: number;
	  };

/**
 * Varre um arquivo .tsx e devolve literais com letras que aparecem na tela:
 * texto entre tags, `{'...'}` sozinho e atributos visíveis (title, aria-label,
 * placeholder, alt) com string literal. Não é um parser TS completo: regex
 * literal com aspas ou `<` pode dessincronizar a varredura, e template com `${}`
 * não é checado.
 * shortcut: tokenizador sem AST (o `typescript` 7 não expõe API síncrona de AST),
 * trocar por ts.createSourceFile quando o pacote voltar a expor a API ou o falso-negativo incomodar.
 */
export function scanJsxLiterals(source: string): JsxLiteral[] {
	const out: JsxLiteral[] = [];
	const stack: Frame[] = [];
	const n = source.length;
	let i = 0;
	let lastTok = '';

	const lineAt = (pos: number): number => {
		let line = 1;
		for (let k = 0; k < pos; k++) if (source.charCodeAt(k) === 10) line++;
		return line;
	};

	const report = (pos: number, kind: JsxLiteral['kind'], value: string): void => {
		if (!LETTER.test(value)) return;
		out.push({ line: lineAt(pos), kind, value: value.trim().replace(/\s+/g, ' ') });
	};

	const top = (): Frame | undefined => stack[stack.length - 1];

	const childrenStep = (): void => {
		let j = i;
		while (j < n && source[j] !== '<' && source[j] !== '{') j++;
		const text = source.slice(i, j).replace(/&[a-zA-Z#0-9]+;/g, '');
		report(i, 'text', text);
		i = j;
		if (i >= n) return;
		if (source[i] === '{') {
			stack.push({ type: 'code', depth: 0, tokens: 0, literalPos: 0 });
			i++;
			lastTok = '{';
			return;
		}
		if (source[i + 1] === '/') {
			const end = source.indexOf('>', i);
			stack.pop();
			i = end === -1 ? n : end + 1;
			lastTok = '';
			return;
		}
		stack.push({ type: 'tag' });
		i++;
	};

	const tagStep = (frame: Extract<Frame, { type: 'tag' }>): void => {
		const c = source[i];
		if (c === '/' && source[i + 1] === '>') {
			stack.pop();
			i += 2;
			lastTok = '';
			return;
		}
		if (c === '>') {
			stack.pop();
			stack.push({ type: 'children' });
			i++;
			lastTok = '';
			return;
		}
		if (c === '{') {
			stack.push({
				type: 'code',
				depth: 0,
				attr: frame.pendingAttr,
				tokens: 0,
				literalPos: 0,
			});
			frame.pendingAttr = undefined;
			i++;
			lastTok = '{';
			return;
		}
		if (IDENT_START.test(c ?? '')) {
			let j = i + 1;
			while (j < n && IDENT.test(source[j] ?? '')) j++;
			const name = source.slice(i, j);
			let k = j;
			while (k < n && /\s/.test(source[k] ?? '')) k++;
			if (source[k] !== '=') {
				i = j;
				return;
			}
			k++;
			while (k < n && /\s/.test(source[k] ?? '')) k++;
			const q = source[k];
			if (q === '"' || q === "'") {
				const close = source.indexOf(q, k + 1);
				const end = close === -1 ? n : close;
				if (VISIBLE_ATTRS.has(name)) report(k, 'attr', source.slice(k + 1, end));
				i = end + 1;
				return;
			}
			frame.pendingAttr = name;
			i = k;
			return;
		}
		i++;
	};

	const codeStep = (): void => {
		const c = source[i] ?? '';
		const next = source[i + 1] ?? '';
		const frame = top();
		const countToken = (): void => {
			if (frame?.type === 'code') frame.tokens++;
		};

		if (/\s/.test(c)) {
			i++;
			return;
		}
		if (c === '/' && next === '/') {
			const end = source.indexOf('\n', i);
			i = end === -1 ? n : end;
			return;
		}
		if (c === '/' && next === '*') {
			const end = source.indexOf('*/', i + 2);
			i = end === -1 ? n : end + 2;
			return;
		}
		if (c === '"' || c === "'") {
			let j = i + 1;
			while (j < n && source[j] !== c && source[j] !== '\n') j += source[j] === '\\' ? 2 : 1;
			const value = source.slice(i + 1, j);
			if (frame?.type === 'code') {
				frame.tokens++;
				frame.literal = value;
				frame.literalPos = i;
			}
			i = j + 1;
			lastTok = 'str';
			return;
		}
		if (c === '`') {
			let j = i + 1;
			let hasExpr = false;
			while (j < n && source[j] !== '`') {
				if (source[j] === '\\') j += 2;
				else {
					if (source[j] === '$' && source[j + 1] === '{') hasExpr = true;
					j++;
				}
			}
			if (frame?.type === 'code') {
				frame.tokens++;
				frame.literal = hasExpr ? undefined : source.slice(i + 1, j);
				frame.literalPos = i;
			}
			i = j + 1;
			lastTok = 'str';
			return;
		}
		if (c === '<' && (IDENT_START.test(next) || next === '>') && JSX_AFTER.has(lastTok)) {
			stack.push({ type: 'tag' });
			i++;
			lastTok = '';
			return;
		}
		if (c === '{') {
			if (frame?.type === 'code') frame.depth++;
			i++;
			lastTok = '{';
			return;
		}
		if (c === '}') {
			if (frame?.type === 'code') {
				if (frame.depth > 0) frame.depth--;
				else {
					stack.pop();
					if (frame.tokens === 1 && frame.literal !== undefined) {
						if (frame.attr === undefined)
							report(frame.literalPos, 'expr', frame.literal);
						else if (VISIBLE_ATTRS.has(frame.attr))
							report(frame.literalPos, 'attr', frame.literal);
					}
				}
			}
			i++;
			lastTok = '}';
			return;
		}
		if (IDENT_START.test(c)) {
			let j = i + 1;
			while (j < n && IDENT.test(source[j] ?? '')) j++;
			lastTok = source.slice(i, j);
			countToken();
			i = j;
			return;
		}
		if (/\d/.test(c)) {
			let j = i + 1;
			while (j < n && /[\w.]/.test(source[j] ?? '')) j++;
			lastTok = 'num';
			countToken();
			i = j;
			return;
		}
		if ((c === '=' && next === '>') || ((c === '&' || c === '|') && next === c)) {
			lastTok = c === '=' ? '=>' : c + c;
			countToken();
			i += 2;
			return;
		}
		lastTok = c;
		countToken();
		i++;
	};

	while (i < n) {
		const frame = top();
		if (frame?.type === 'children') childrenStep();
		else if (frame?.type === 'tag') tagStep(frame);
		else codeStep();
	}
	return out;
}
