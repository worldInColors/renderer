import type { SchematicWrapper } from "../nucleationExports";
import type { FluidStateFilter } from "./FluidStateLookup";
import { isSurfaceBlock } from "./ConnectedGlass";

export interface SurfaceCell {
	x: number;
	y: number;
	z: number;
	state: string;
}
export const surfaceSectionKey = (x: number, y: number, z: number) =>
	`${Math.floor(x / 16)},${Math.floor(y / 16)},${Math.floor(z / 16)}`;

/** Only glass and portal cells are retained. Empty space never allocates a dense grid. */
export class SurfaceIndex {
	readonly sections = new Map<string, Map<number, SurfaceCell>>();
	private lastKey = "";
	private lastSection: Map<number, SurfaceCell> | undefined;

	set(x: number, y: number, z: number, state: string): void {
		const key = surfaceSectionKey(x, y, z);
		const local = (x & 15) | ((z & 15) << 4) | ((y & 15) << 8);
		let section = this.sections.get(key);
		if (!isSurfaceBlock(state)) {
			section?.delete(local);
			if (section?.size === 0) this.sections.delete(key);
		} else {
			if (!section) this.sections.set(key, (section = new Map()));
			section.set(local, { x, y, z, state });
		}
		this.lastKey = "";
	}

	readonly getBlock = (x: number, y: number, z: number): string => {
		const key = surfaceSectionKey(x, y, z);
		if (key !== this.lastKey) {
			this.lastKey = key;
			this.lastSection = this.sections.get(key);
		}
		return this.lastSection?.get((x & 15) | ((z & 15) << 4) | ((y & 15) << 8))?.state || "";
	};
}

export function surfaceCellVisible(
	x: number,
	y: number,
	z: number,
	{ bounds, hiddenCells }: FluidStateFilter
): boolean {
	return (
		!(
			bounds?.enabled &&
			(x < bounds.min.x ||
				y < bounds.min.y ||
				z < bounds.min.z ||
				x >= bounds.max.x ||
				y >= bounds.max.y ||
				z >= bounds.max.z)
		) && !hiddenCells?.has(`${x},${y},${z}`)
	);
}

export function affectedSurfaceSections(
	positions: Iterable<{ x: number; y: number; z: number }>
): Set<string> {
	const keys = new Set<string>();
	for (const { x, y, z } of positions)
		for (let cy = Math.floor((y - 1) / 16); cy <= Math.floor((y + 1) / 16); cy++)
			for (let cz = Math.floor((z - 1) / 16); cz <= Math.floor((z + 1) / 16); cz++)
				for (let cx = Math.floor((x - 1) / 16); cx <= Math.floor((x + 1) / 16); cx++)
					keys.add(`${cx},${cy},${cz}`);
	return keys;
}

export async function readSurfaceIndex(
	schematic: Pick<SchematicWrapper, "create_lazy_chunk_iterator">,
	states: readonly string[],
	filter: FluidStateFilter
): Promise<SurfaceIndex> {
	const index = new SurfaceIndex();
	const relevant = states.map(isSurfaceBlock);
	if (!relevant.some(Boolean)) return index;
	const iterator = schematic.create_lazy_chunk_iterator(16, 16, 16, "bottom_up", 0, 0, 0);
	let deadline = performance.now() + 8;
	const put = (x: number, y: number, z: number, palette: number) => {
		if (relevant[palette] && surfaceCellVisible(x, y, z, filter))
			index.set(x, y, z, states[palette]);
	};
	try {
		while (iterator.has_next()) {
			const blocks = iterator.next()?.blocks as Int32Array | Uint32Array | number[][] | undefined;
			if (blocks instanceof Int32Array || blocks instanceof Uint32Array) {
				for (let i = 0; i + 3 < blocks.length; i += 4)
					put(blocks[i], blocks[i + 1], blocks[i + 2], blocks[i + 3]);
			} else if (blocks) {
				for (const [x, y, z, palette] of blocks) put(x, y, z, palette);
			}
			if (performance.now() >= deadline) {
				await new Promise<void>((resolve) => setTimeout(resolve, 0));
				deadline = performance.now() + 8;
			}
		}
	} finally {
		iterator.free();
	}
	return index;
}
