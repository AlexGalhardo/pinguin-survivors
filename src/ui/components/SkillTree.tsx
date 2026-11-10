import { type ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { HeroId } from '../../config/constants';
import type { TreeNode } from '../../data/skill-tree';
import { type I18nKey, t } from '../../i18n';
import { formatStat } from '../../logic/format';
import { canRefund, heroTree, pathTo, rankOf, treeStats } from '../../logic/skill-tree';
import type { StatKey } from '../../logic/stats';
import { useFocusable } from '../focus';
import { BAND, type GridDir, layoutGrid, stepGrid } from '../skill-grid';
import { Btn } from './Btn';
import { AdjustRow, BackBtn, MenuScreen } from './MenuScreen';
import { Hint, ItemCard, Panel } from './Panel';

export interface SkillTreeData {
	heroes: readonly HeroId[];
	hero: HeroId;
	level: number;
	allocated: readonly string[];
	/** Unspent tree points. */
	points: number;
	pearls: number;
	refundCost: number;
	resetCost: number;
}

export interface SkillTreeActions {
	selectHero: (hero: HeroId) => void;
	/** Allocates the shortest path to the node (when the points allow). */
	allocate: (id: string) => void;
	refund: (id: string) => void;
	reset: () => void;
	back: () => void;
}

/** Branch colors: offense, defense, utility (design-system.md, "Árvore"). */
const BRANCH_COLOR = ['var(--color-blood)', 'var(--color-ice)', 'var(--color-xp)'] as const;
const NEUTRAL = 'var(--color-snow-light)';
const ARROWS: Record<string, GridDir> = {
	ArrowUp: 'up',
	ArrowDown: 'down',
	ArrowLeft: 'left',
	ArrowRight: 'right',
};

type CellState = 'locked' | 'available' | 'bought' | 'max';

const statLabel = (key: string): string =>
	key === 'cardRerolls' ? t('tree.stat.cardRerolls') : t(`gstat.${key}` as I18nKey);

function statLines(stats: TreeNode['stats']): string[] {
	return (Object.entries(stats) as [StatKey, number][]).map(([key, value]) =>
		key === 'cardRerolls'
			? `+${value} ${statLabel(key)}`
			: `${formatStat(key, value, true)} ${statLabel(key)}`,
	);
}

/** Stats of `rank` ranks of a node (ranked nodes add their stats again per rank). */
function scaleStats(stats: TreeNode['stats'], rank: number): TreeNode['stats'] {
	const out: TreeNode['stats'] = {};
	for (const [key, value] of Object.entries(stats) as [StatKey, number][])
		out[key] = value * rank;
	return out;
}

function nodeTitle(node: TreeNode): string {
	if (node.name) return t(`tree.n.${node.name}` as I18nKey);
	if (node.kind === 'start') return t('tree.start');
	return t(node.kind === 'travel' ? 'tree.kind.travel' : 'tree.kind.small');
}

/** Two-letter badge of a square: the initials of two words, or the first two letters. */
function sigla(node: TreeNode): string {
	const first = Object.keys(node.stats)[0];
	const text = node.name || !first ? nodeTitle(node) : statLabel(first);
	const words = text.trim().split(/\s+/);
	const letters =
		words.length > 1
			? words.slice(0, 2).map((w) => Array.from(w)[0])
			: Array.from(text).slice(0, 2);
	return letters.join('').toUpperCase();
}

const STATE_STYLE: Record<CellState, string> = {
	locked: 'border-snow-dark bg-night text-text-dim',
	available: 'bg-night text-text-light',
	bought: 'border-gold-bright bg-night text-gold-bright',
	max: 'border-gold-bright bg-gold-aged text-night',
};

function Square(props: {
	node: TreeNode;
	state: CellState;
	rank: number;
	onActivate: () => void;
	onFocus: () => void;
	onArrow: (dir: GridDir) => boolean;
}): ReactElement {
	const f = useFocusable({ onActivate: props.onActivate });
	const focusChanged = useRef(props.onFocus);
	focusChanged.current = props.onFocus;
	useEffect(() => {
		if (f.focused) focusChanged.current();
	}, [f.focused]);
	const { node, state } = props;
	const big = node.kind === 'notable' || node.kind === 'keystone';
	return (
		<button
			type="button"
			ref={f.ref}
			{...f.props}
			data-node={node.id}
			data-state={state}
			aria-label={`${nodeTitle(node)}${node.maxRank > 1 ? ` ${props.rank}/${node.maxRank}` : ''}`}
			onKeyDown={(e) => {
				const dir = ARROWS[e.code];
				if (dir && props.onArrow(dir)) {
					e.preventDefault();
					// The scope's geometric handler listens on window; the grid already moved the focus.
					e.stopPropagation();
				}
			}}
			className={`relative flex h-full w-full cursor-pointer appearance-none flex-col items-center justify-center rounded-none p-0 font-body leading-none font-bold outline-offset-2 data-[focused=true]:outline-3 data-[focused=true]:outline-crit ${big ? 'border-[3px]' : 'border-2'} ${STATE_STYLE[state]}`}
			style={
				state === 'available'
					? { borderColor: node.branch >= 0 ? BRANCH_COLOR[node.branch] : NEUTRAL }
					: undefined
			}
		>
			<span className="pointer-events-none text-[1.125rem]">{sigla(node)}</span>
			{node.maxRank > 1 && (
				<span className="pointer-events-none mt-0.5 text-[0.875rem] tabular-nums">
					{props.rank}/{node.maxRank}
				</span>
			)}
			{big && (
				<span
					aria-hidden="true"
					className="pointer-events-none absolute top-0 left-0.5 text-[0.75rem]"
				>
					{node.kind === 'keystone' ? '★' : '◆'}
				</span>
			)}
		</button>
	);
}

/**
 * Skill tree as a grid of squares (ADR-026, amends ADR-019 in presentation only): one band of
 * columns per branch, rows = tier, fixed details on the right. Arrows move cell by cell.
 */
export function SkillTree({
	data,
	actions,
}: {
	data: SkillTreeData;
	actions: SkillTreeActions;
}): ReactElement {
	const tree = heroTree(data.hero);
	const cells = useMemo(() => layoutGrid(tree), [tree]);
	const byId = useMemo(() => new Map(cells.map((c) => [c.id, c])), [cells]);
	const at = useMemo(() => new Map(cells.map((c) => [`${c.row},${c.col}`, c])), [cells]);
	const allocated = useMemo(() => new Set(data.allocated), [data.allocated]);
	const [selected, setSelected] = useState<string>('');
	const grid = useRef<HTMLDivElement>(null);
	const pointerType = useRef('mouse');
	// Square the last touch tap selected; the initial focus must not count as that first tap.
	const tapped = useRef('');
	const rows = Math.max(...cells.map((c) => c.row));

	const stateOf = (n: TreeNode): CellState => {
		const rank = rankOf(data.allocated, n.id);
		if (rank >= n.maxRank) return 'max';
		if (rank > 0) return 'bought';
		const owned = (id: string): boolean => id === tree.start || allocated.has(id);
		return n.links.some(owned) ? 'available' : 'locked';
	};

	// Opening the screen (or switching hero) puts the focus on a square that can be bought now.
	// biome-ignore lint/correctness/useExhaustiveDependencies: refocus only when the hero changes
	useEffect(() => {
		const first =
			grid.current?.querySelector<HTMLElement>('[data-state="available"]') ??
			grid.current?.querySelector<HTMLElement>('[data-node]');
		first?.focus();
	}, [data.hero]);

	const move = useCallback(
		(id: string, dir: GridDir): boolean => {
			const from = byId.get(id);
			const to = from && stepGrid(cells, from, dir);
			const el = to && grid.current?.querySelector<HTMLElement>(`[data-node="${to.id}"]`);
			el?.focus();
			return !!el;
		},
		[byId, cells],
	);

	const node = tree.nodes[selected] ?? tree.nodes[cells[0]?.id ?? tree.start];
	const rank = node ? rankOf(data.allocated, node.id) : 0;
	const path = useMemo(
		() => (node ? pathTo(tree, data.allocated, node.id) : []),
		[tree, data.allocated, node],
	);
	const refundable = node ? canRefund(tree, data.allocated, node.id) : false;
	const totals = statLines(treeStats(tree, data.allocated));

	// Touch: the first tap on a square selects it (details), a second tap on the same one allocates
	// or refunds it. Mouse and keyboard keep the one-step behavior.
	const activate = (n: TreeNode): void => {
		if (pointerType.current === 'touch' && tapped.current !== n.id) {
			tapped.current = n.id;
			setSelected(n.id);
			return;
		}
		setSelected(n.id);
		const r = rankOf(data.allocated, n.id);
		// Enter adds a rank while the node can take one; on a full or single-rank node it refunds.
		if (r === 0 || r < n.maxRank) actions.allocate(n.id);
		else actions.refund(n.id);
	};

	const i = data.heroes.indexOf(data.hero);
	const other = (d: number): HeroId =>
		data.heroes[(i + d + data.heroes.length) % data.heroes.length] ?? data.hero;

	const canRankUp = !!node && rank > 0 && rank < node.maxRank;
	const state = node ? stateOf(node) : 'locked';
	let action = t('tree.action.start');
	let cost = 0;
	if (node) {
		if (canRankUp) {
			cost = 1;
			action = data.points > 0 ? t('tree.action.rankUp') : t('tree.action.short', { n: 1 });
		} else if (rank > 0)
			action = refundable
				? t('tree.action.refund', { n: data.refundCost })
				: t('tree.action.locked');
		else {
			cost = path.length;
			action =
				path.length > data.points
					? t('tree.action.short', { n: path.length })
					: t('tree.action.allocate', { n: path.length });
		}
	}
	const ranked = !!node && node.maxRank > 1;

	return (
		<MenuScreen
			title={t('tree.title')}
			onBack={actions.back}
			wide
			subtitle={t('tree.desc')}
			footer={
				<>
					<Btn
						onActivate={actions.reset}
						disabled={data.allocated.length === 0 || data.pearls < data.resetCost}
						variant="danger"
					>
						{t('tree.reset', { n: data.resetCost })}
					</Btn>
					<BackBtn onBack={actions.back} label={t('menu.back')} />
				</>
			}
		>
			<div className="flex h-full min-h-0 w-full flex-1 flex-col">
				<Panel className="h-full min-h-[50vh] [@media(max-height:500px)]:min-h-0">
					<div className="flex flex-wrap items-center gap-x-4 gap-y-1 [@media(max-height:500px)]:flex-nowrap [@media(max-height:500px)]:gap-2">
						<div className="min-w-[22rem] flex-1 [@media(max-height:500px)]:min-w-0">
							<AdjustRow
								label={`${t(`hero.${data.hero}` as I18nKey)} · ${t('select.level', { n: data.level })}`}
								onPrev={() => actions.selectHero(other(-1))}
								onNext={() => actions.selectHero(other(1))}
								disabled={data.heroes.length < 2}
							/>
						</div>
						<div
							data-tree-points
							className="font-title text-title leading-none font-bold whitespace-nowrap text-crit"
						>
							{t('tree.points', { n: data.points })}
						</div>
						<div className="text-secondary font-bold whitespace-nowrap text-fish">
							{t('tree.pearls', { n: data.pearls })}
						</div>
					</div>
					<div className="flex min-h-0 flex-1 gap-3">
						<div
							ref={grid}
							data-tree-grid
							onPointerDown={(e) => {
								pointerType.current = e.pointerType;
							}}
							className="no-scrollbar min-h-0 flex-1 overflow-auto bg-night/60 p-1 [--cell:max(2.75rem,4vh)] [--gap:0.375rem] [@media(max-height:500px)]:[--cell:2.5rem] [@media(max-height:500px)]:[--gap:0.25rem]"
						>
							<div
								className="mx-auto grid w-max gap-(--gap)"
								style={{
									gridTemplateColumns: `auto repeat(${tree.branches.length * BAND}, var(--cell))`,
									gridTemplateRows: `auto repeat(${rows}, var(--cell))`,
								}}
							>
								{tree.branches.map((theme, b) => (
									<div
										key={theme}
										className="sticky top-0 z-10 border-b-2 bg-night text-center text-secondary font-bold tracking-section whitespace-nowrap uppercase"
										style={{
											gridRow: 1,
											gridColumn: `${b * BAND + 2} / span 3`,
											borderColor: BRANCH_COLOR[b],
										}}
									>
										{t(`tree.b.${theme}` as I18nKey)}
									</div>
								))}
								{Array.from({ length: rows }, (_, r) => (
									<div
										// biome-ignore lint/suspicious/noArrayIndexKey: static tier labels
										key={r}
										aria-hidden="true"
										className="flex items-center justify-end pr-1 text-secondary font-bold text-gold-aged tabular-nums"
										style={{ gridRow: r + 2, gridColumn: 1 }}
									>
										{r + 1}
									</div>
								))}
								{cells.map((cell) => {
									const n = tree.nodes[cell.id] as TreeNode;
									const lit = allocated.has(n.id);
									const link = (row: number, col: number): string | null => {
										const to = at.get(`${row},${col}`);
										return to && n.links.includes(to.id) ? to.id : null;
									};
									const down = link(cell.row + 1, cell.col);
									const right = link(cell.row, cell.col + 1);
									const line = (id: string | null): string =>
										lit && id && allocated.has(id)
											? 'bg-gold-bright'
											: 'bg-snow-dark';
									return (
										<div
											key={n.id}
											className="relative"
											style={{
												gridRow: cell.row + 1,
												gridColumn: cell.col + 2,
											}}
										>
											{down && (
												<span
													aria-hidden="true"
													className={`absolute top-full left-1/2 h-(--gap) w-0.5 -translate-x-1/2 ${line(down)}`}
												/>
											)}
											{right && (
												<span
													aria-hidden="true"
													className={`absolute top-1/2 left-full h-0.5 w-(--gap) -translate-y-1/2 ${line(right)}`}
												/>
											)}
											<Square
												node={n}
												state={stateOf(n)}
												rank={rankOf(data.allocated, n.id)}
												onActivate={() => activate(n)}
												onFocus={() => setSelected(n.id)}
												onArrow={(dir) => move(n.id, dir)}
											/>
										</div>
									);
								})}
							</div>
						</div>
						<aside
							data-tree-detail
							className="no-scrollbar flex min-h-0 w-[24rem] shrink-0 flex-col gap-2 overflow-y-auto [@media(max-height:500px)]:w-[13.5rem]"
						>
							{node && (
								<ItemCard
									name={nodeTitle(node)}
									color={node.branch >= 0 ? BRANCH_COLOR[node.branch] : undefined}
									kind={
										<>
											{node.branch >= 0
												? t(
														`tree.b.${tree.branches[node.branch]}` as I18nKey,
													)
												: t('tree.kind.shared')}
											{' · '}
											{t(`tree.kindName.${node.kind}` as I18nKey)}
											{' · '}
											{t('tree.tier', { n: byId.get(node.id)?.row ?? 0 })}
										</>
									}
									lines={[
										<span key="state" className="font-bold text-gold-bright">
											{t(`tree.state.${state}` as I18nKey)}
											{ranked &&
												` · ${t('tree.rank', { n: rank, max: node.maxRank })}`}
										</span>,
										...(ranked
											? [
													<span key="now" className="text-text-light">
														{t('tree.now', {
															v:
																rank > 0
																	? statLines(
																			scaleStats(
																				node.stats,
																				rank,
																			),
																		).join(', ')
																	: '—',
														})}
													</span>,
													...(rank < node.maxRank
														? [
																<span
																	key="next"
																	className="font-bold text-xp"
																>
																	{t('tree.next', {
																		v: statLines(
																			scaleStats(
																				node.stats,
																				rank + 1,
																			),
																		).join(', '),
																	})}
																</span>,
															]
														: []),
												]
											: statLines(node.stats).map((line) => (
													<span key={line} className="font-bold text-xp">
														{line}
													</span>
												))),
										...(cost > 0
											? [
													<span key="cost" className="text-text-light">
														{t('tree.cost', { n: cost })}
													</span>,
												]
											: []),
										...(path.length > 1
											? [
													<span key="req" className="text-text-light">
														{t('tree.requires', { n: path.length - 1 })}
													</span>,
												]
											: []),
										...(node.kind === 'keystone'
											? [<Hint key="ks">{t('tree.keystoneHint')}</Hint>]
											: []),
										<span key="action" className="font-bold text-crit">
											{action}
										</span>,
									]}
									footer={
										canRankUp && refundable ? (
											<Btn
												onActivate={() => actions.refund(node.id)}
												disabled={data.pearls < data.refundCost}
												variant="danger"
											>
												{t('tree.refundOne', { n: data.refundCost })}
											</Btn>
										) : undefined
									}
								/>
							)}
							{totals.length > 0 && (
								<div className="flex flex-col [@media(max-height:500px)]:hidden">
									<div className="text-secondary font-bold tracking-section text-gold-bright uppercase">
										{t('tree.totals')}
									</div>
									{totals.slice(0, 6).map((line) => (
										<div
											key={line}
											className="text-secondary font-bold text-xp"
										>
											{line}
										</div>
									))}
									{totals.length > 6 && (
										<div className="text-secondary text-text-light">…</div>
									)}
								</div>
							)}
						</aside>
					</div>
					<div className="[@media(max-height:500px)]:hidden">
						<Hint>{t('tree.hint')}</Hint>
					</div>
				</Panel>
			</div>
		</MenuScreen>
	);
}
