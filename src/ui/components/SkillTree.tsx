import { type ReactElement, useEffect, useMemo, useRef, useState } from 'react';
import type { HeroId } from '../../config/constants';
import type { TreeNode } from '../../data/skill-tree';
import { type I18nKey, t } from '../../i18n';
import { formatStat } from '../../logic/format';
import { canRefund, heroTree, pathTo, treeStats } from '../../logic/skill-tree';
import type { StatKey } from '../../logic/stats';
import { useFocusable } from '../focus';
import { Btn } from './Btn';
import { AdjustRow, BackBtn, MenuScreen } from './MenuScreen';
import { Hint, Panel, StatRow } from './Panel';

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
const GOLD = 'var(--color-gold-bright)';
/** Tree units to CSS pixels at zoom 1. */
const BASE_SCALE = 0.5;
const ZOOMS = [0.6, 0.8, 1, 1.25, 1.6, 2] as const;
/** Node diameter in px by kind. */
const SIZE: Record<TreeNode['kind'], number> = {
	start: 40,
	small: 22,
	travel: 18,
	notable: 36,
	keystone: 44,
};

const statLabel = (key: string): string =>
	key === 'cardRerolls' ? t('tree.stat.cardRerolls') : t(`gstat.${key}` as I18nKey);

function statLines(stats: TreeNode['stats']): string[] {
	return (Object.entries(stats) as [StatKey, number][]).map(([key, value]) =>
		key === 'cardRerolls'
			? `+${value} ${statLabel(key)}`
			: `${formatStat(key, value, true)} ${statLabel(key)}`,
	);
}

function nodeTitle(node: TreeNode): string {
	if (node.name) return t(`tree.n.${node.name}` as I18nKey);
	if (node.kind === 'start') return t('tree.start');
	return t(node.kind === 'travel' ? 'tree.kind.travel' : 'tree.kind.small');
}

function NodeBtn(props: {
	node: TreeNode;
	x: number;
	y: number;
	allocated: boolean;
	onPath: boolean;
	match: boolean;
	onActivate: () => void;
	onFocus: () => void;
}): ReactElement {
	const f = useFocusable({ onActivate: props.onActivate });
	const { node } = props;
	const focusChanged = useRef(props.onFocus);
	focusChanged.current = props.onFocus;
	useEffect(() => {
		if (f.focused) focusChanged.current();
	}, [f.focused]);
	const size = SIZE[node.kind];
	const color = node.branch >= 0 ? BRANCH_COLOR[node.branch] : NEUTRAL;
	const ring = props.allocated ? GOLD : props.onPath ? GOLD : color;
	return (
		<button
			type="button"
			ref={f.ref}
			{...f.props}
			aria-label={nodeTitle(node)}
			aria-pressed={props.allocated}
			className="absolute cursor-pointer appearance-none p-0 outline-offset-4 data-[focused=true]:outline-2 data-[focused=true]:outline-crit"
			style={{
				left: props.x - size / 2,
				top: props.y - size / 2,
				width: size,
				height: size,
				borderRadius: node.kind === 'keystone' ? 6 : '50%',
				transform: node.kind === 'keystone' ? 'rotate(45deg)' : undefined,
				border: `${node.kind === 'notable' || node.kind === 'keystone' ? 3 : 2}px ${props.onPath && !props.allocated ? 'dashed' : 'solid'} ${ring}`,
				background: props.allocated
					? `radial-gradient(circle, ${GOLD} 0%, var(--color-gold-aged) 70%)`
					: 'var(--color-night)',
				boxShadow: props.allocated
					? `0 0 12px ${GOLD}`
					: props.match
						? '0 0 0 4px var(--color-crit)'
						: node.kind === 'notable' || node.kind === 'keystone'
							? `0 0 8px ${color}`
							: undefined,
			}}
		/>
	);
}

/** Path of Exile style passive tree (ADR-019): pan by scrolling or dragging, zoom, search, path preview. */
export function SkillTree({
	data,
	actions,
}: {
	data: SkillTreeData;
	actions: SkillTreeActions;
}): ReactElement {
	const tree = heroTree(data.hero);
	const nodes = useMemo(() => Object.values(tree.nodes), [tree]);
	const allocated = useMemo(() => new Set(data.allocated), [data.allocated]);
	const [zoomIndex, setZoomIndex] = useState(2);
	const [selected, setSelected] = useState<string>(tree.start);
	const [query, setQuery] = useState('');
	const viewport = useRef<HTMLDivElement>(null);
	const zoom = ZOOMS[zoomIndex] ?? 1;
	const scale = BASE_SCALE * zoom;

	const bounds = useMemo(() => {
		const pad = 60;
		const xs = nodes.map((n) => n.x);
		const ys = nodes.map((n) => n.y);
		return {
			minX: Math.min(...xs) - pad,
			minY: Math.min(...ys) - pad,
			w: Math.max(...xs) - Math.min(...xs) + pad * 2,
			h: Math.max(...ys) - Math.min(...ys) + pad * 2,
		};
	}, [nodes]);
	const px = (n: TreeNode): { x: number; y: number } => ({
		x: (n.x - bounds.minX) * scale,
		y: (n.y - bounds.minY) * scale,
	});

	// Camera (no scrollbars, developer request): the world moves by a CSS transform that eases to
	// the focused node; dragging and the wheel move it directly.
	const [cam, setCam] = useState({ x: 0, y: 0, smooth: true });
	const drag = useRef<{ x: number; y: number; camX: number; camY: number } | null>(null);
	const view = (): { w: number; h: number } => ({
		w: viewport.current?.clientWidth ?? 800,
		h: viewport.current?.clientHeight ?? 600,
	});
	const centerOn = (n: TreeNode | undefined, smooth = true): void => {
		if (!n) return;
		const p = px(n);
		const v = view();
		setCam({ x: v.w / 2 - p.x, y: v.h / 2 - p.y, smooth });
	};

	// Opening the screen (or switching hero) centers the view on the start node.
	// biome-ignore lint/correctness/useExhaustiveDependencies: recenter only when the hero changes
	useEffect(() => {
		setSelected(tree.start);
		centerOn(tree.nodes[tree.start], false);
	}, [data.hero]);

	const node = tree.nodes[selected] ?? tree.nodes[tree.start];
	const path = useMemo(
		() => (node ? pathTo(tree, data.allocated, node.id) : []),
		[tree, data.allocated, node],
	);
	const onPath = useMemo(() => new Set(path), [path]);
	const q = query.trim().toLowerCase();
	const matches = useMemo(() => {
		if (!q) return new Set<string>();
		return new Set(
			nodes
				.filter((n) =>
					[nodeTitle(n), ...statLines(n.stats)].join(' ').toLowerCase().includes(q),
				)
				.map((n) => n.id),
		);
	}, [nodes, q]);
	// The camera follows the selected node (keyboard, gamepad, click) and keeps it centered on zoom.
	// biome-ignore lint/correctness/useExhaustiveDependencies: follow selection and zoom only
	useEffect(() => {
		if (!drag.current) centerOn(node);
	}, [selected, zoomIndex]);
	const totals = statLines(treeStats(tree, data.allocated));
	const isAllocated = node ? allocated.has(node.id) : false;
	const refundable = node ? canRefund(tree, data.allocated, node.id) : false;

	const activate = (n: TreeNode): void => {
		setSelected(n.id);
		if (allocated.has(n.id)) actions.refund(n.id);
		else actions.allocate(n.id);
	};

	// Drag to pan (mouse, pen and touch, also when the finger starts on a node); two fingers pinch to
	// zoom; the wheel pans, Ctrl+wheel zooms. A drag never counts as a tap on a node.
	const pointers = useRef(new Map<number, { x: number; y: number }>());
	const pinchBase = useRef(0);
	const moved = useRef(false);
	const spread = (): number => {
		const [a, b] = [...pointers.current.values()];
		return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
	};
	const onPointerDown = (e: React.PointerEvent<HTMLDivElement>): void => {
		pointerType.current = e.pointerType;
		pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
		moved.current = false;
		if (pointers.current.size === 2) {
			pinchBase.current = spread();
			drag.current = null;
			return;
		}
		if (e.pointerType !== 'touch' && (e.target as HTMLElement).closest('button')) return;
		drag.current = { x: e.clientX, y: e.clientY, camX: cam.x, camY: cam.y };
	};
	const onPointerMove = (e: React.PointerEvent<HTMLDivElement>): void => {
		const d = drag.current;
		if (!d) return;
		if (!moved.current && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 8) {
			moved.current = true;
			// Capture only once it is a drag, so a plain tap still reaches the node under the finger.
			e.currentTarget.setPointerCapture(e.pointerId);
		}
		if (moved.current)
			setCam({ x: d.camX + e.clientX - d.x, y: d.camY + e.clientY - d.y, smooth: false });
	// Touch: the first tap on a node selects it (details and path preview), a second tap on the
	// same node allocates or refunds it. Mouse and keyboard keep the one-step behavior.
	const pointerType = useRef('mouse');
	};
		// A drag that ended on a node is not a tap.
		if (moved.current) return;
		if (pointerType.current === 'touch' && selected !== n.id) {
			setSelected(n.id);
			return;
		}
	const stopDrag = (e: React.PointerEvent<HTMLDivElement>): void => {
		pointers.current.delete(e.pointerId);
		if (pointers.current.size < 2) pinchBase.current = 0;
		if (pointers.current.size === 0) drag.current = null;
	};
	const onWheel = (e: React.WheelEvent<HTMLDivElement>): void => {
		if (e.ctrlKey) {
			setZoomIndex((z) =>
				Math.max(0, Math.min(ZOOMS.length - 1, z + (e.deltaY < 0 ? 1 : -1))),
			);
			return;
		}
		setCam((c) => ({ x: c.x - e.deltaX, y: c.y - e.deltaY, smooth: false }));
	};

	const i = data.heroes.indexOf(data.hero);
		if (pointers.current.has(e.pointerId))
			pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
		if (pointers.current.size === 2) {
			moved.current = true;
			const ratio = spread() / (pinchBase.current || 1);
			if (ratio > 1.25 || ratio < 0.8) {
				setZoomIndex((z) =>
					Math.max(0, Math.min(ZOOMS.length - 1, z + (ratio > 1 ? 1 : -1))),
				);
				pinchBase.current = spread();
			}
			return;
		}
	const other = (d: number): HeroId =>
		data.heroes[(i + d + data.heroes.length) % data.heroes.length] ?? data.hero;

	let action = t('tree.action.start');
	if (node && node.id !== tree.start) {
		if (isAllocated)
			action = refundable
				? t('tree.action.refund', { n: data.refundCost })
				: t('tree.action.locked');
		else
			action =
				path.length > data.points
					? t('tree.action.short', { n: path.length })
					: t('tree.action.allocate', { n: path.length });
	}

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
			<div className="grid h-full min-h-0 w-full flex-1 grid-cols-1 gap-3 min-[1100px]:grid-cols-[1fr_22rem] [@media(max-height:500px)]:grid-cols-[1fr_14rem] [@media(max-height:500px)]:gap-1.5">
				<Panel className="h-full min-h-[50vh] [@media(max-height:500px)]:min-h-0">
					<div className="flex flex-wrap items-center gap-2 [@media(max-height:500px)]:flex-nowrap [@media(max-height:500px)]:gap-1">
						<AdjustRow
							label={`${t(`hero.${data.hero}` as I18nKey)} · ${t('select.level', { n: data.level })}`}
							onPrev={() => actions.selectHero(other(-1))}
							onNext={() => actions.selectHero(other(1))}
							disabled={data.heroes.length < 2}
						/>
						<div className="font-bold whitespace-nowrap text-crit [@media(max-height:500px)]:text-[0.8em]">
							{t('tree.points', { n: data.points })}
						</div>
						<div className="font-bold whitespace-nowrap text-fish [@media(max-height:500px)]:text-[0.8em]">
							{t('tree.pearls', { n: data.pearls })}
						</div>
						<input
							type="search"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder={t('tree.search')}
							aria-label={t('tree.search')}
							className="min-h-11 flex-1 rounded border border-snow bg-night px-2 text-text-light [font-family:inherit] [@media(max-height:500px)]:hidden"
						/>
						<Btn
							onActivate={() => setZoomIndex((z) => Math.max(0, z - 1))}
							label={t('tree.zoomOut')}
						>
							−
						</Btn>
						<Btn
							onActivate={() =>
								setZoomIndex((z) => Math.min(ZOOMS.length - 1, z + 1))
							}
							label={t('tree.zoomIn')}
						>
							+
						</Btn>
					</div>
					<div
						ref={viewport}
						onPointerDown={onPointerDown}
						onPointerMove={onPointerMove}
						onPointerUp={stopDrag}
						onPointerCancel={stopDrag}
						onWheel={onWheel}
						// Focusing a node must not scroll the clipped viewport: the camera moves instead.
						onScroll={(e) => {
							e.currentTarget.scrollLeft = 0;
							e.currentTarget.scrollTop = 0;
						}}
						className="relative min-h-0 flex-1 cursor-grab touch-none overflow-hidden rounded bg-panel-bottom active:cursor-grabbing"
					>
						<div
							className="absolute top-0 left-0"
							style={{
								width: bounds.w * scale,
								height: bounds.h * scale,
								transform: `translate(${cam.x}px, ${cam.y}px)`,
								transition: cam.smooth ? 'transform 260ms ease-out' : 'none',
							}}
						>
							<svg
								aria-hidden="true"
								className="pointer-events-none absolute inset-0"
								width={bounds.w * scale}
						onClickCapture={(e) => {
							// A drag or a pinch ending over a node must not allocate it.
							if (moved.current) {
								e.stopPropagation();
								moved.current = false;
							}
						}}
								height={bounds.h * scale}
							>
								{nodes.flatMap((a) =>
									a.links
										.filter((id) => id > a.id)
										.map((id) => {
											const b = tree.nodes[id];
											if (!b) return null;
											const pa = px(a);
											const pb = px(b);
											const lit =
												(allocated.has(a.id) || a.id === tree.start) &&
												(allocated.has(b.id) || b.id === tree.start);
											const preview =
												(onPath.has(a.id) || onPath.has(b.id)) &&
												(onPath.has(a.id) ||
													allocated.has(a.id) ||
													a.id === tree.start) &&
												(onPath.has(b.id) ||
													allocated.has(b.id) ||
													b.id === tree.start);
											return (
												<line
													key={`${a.id}-${id}`}
													x1={pa.x}
													y1={pa.y}
													x2={pb.x}
													y2={pb.y}
													stroke={
														lit || preview
															? GOLD
															: 'var(--color-snow-dark)'
													}
													strokeWidth={lit ? 4 : 2}
													strokeDasharray={
														preview && !lit ? '6 5' : undefined
													}
												/>
											);
										}),
								)}
							</svg>
							{nodes.map((n) => {
								const p = px(n);
								return (
									<NodeBtn
										key={n.id}
										node={n}
										x={p.x}
										y={p.y}
										allocated={allocated.has(n.id) || n.id === tree.start}
										onPath={onPath.has(n.id)}
										match={matches.has(n.id)}
										onActivate={() => activate(n)}
										onFocus={() => setSelected(n.id)}
									/>
								);
							})}
						</div>
					</div>
					<div className="[@media(max-height:500px)]:hidden">
						<Hint>{t('tree.hint')}</Hint>
					</div>
				</Panel>
				<Panel title={t('tree.details')}>
					{node && (
						<>
							<div className="text-[1.3em] font-black tracking-wider text-gold-bright uppercase">
								{nodeTitle(node)}
							</div>
							<div className="text-text-dim">
								{node.branch >= 0
									? t(`tree.b.${tree.branches[node.branch]}` as I18nKey)
									: t('tree.kind.shared')}
								{' · '}
								{t(`tree.kindName.${node.kind}` as I18nKey)}
							</div>
							{statLines(node.stats).map((line) => (
								<div key={line} className="font-bold">
									{line}
								</div>
							))}
							{node.kind === 'keystone' && <Hint>{t('tree.keystoneHint')}</Hint>}
							<div className="mt-1 font-bold text-crit">{action}</div>
						</>
					)}
					<div className="mt-3 font-bold tracking-[0.14em] text-gold-bright uppercase">
						{t('tree.totals')}
					</div>
					{totals.length === 0 ? (
						<Hint>{t('tree.empty')}</Hint>
					) : (
						totals.map((line) => <StatRow key={line} label={line} value="" />)
					)}
				</Panel>
			</div>
		</MenuScreen>
	);
}
