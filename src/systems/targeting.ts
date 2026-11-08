import type { Enemy } from '../entities/Enemy';
import type { SpatialGrid } from '../logic/spatial-grid';

const alive = (e: Enemy): boolean => e.alive;
const priority = (e: Enemy): boolean => e.alive && (e.elite !== null || e.def.behavior === 'boss');

/**
 * Nearest enemy in `range`, bosses and elites first so they do not hide behind the horde
 * (SDD-002 RF-08).
 */
export function pickTarget(
	grid: SpatialGrid<Enemy>,
	x: number,
	y: number,
	range: number,
): Enemy | undefined {
	return grid.nearest(x, y, range, priority) ?? grid.nearest(x, y, range, alive);
}
