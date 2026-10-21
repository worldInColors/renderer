import type { SchematicWrapper } from "../nucleationExports";
import type { GetBlock } from "./WaterMesher";

interface PaletteEntry {
	name?: string;
	Name?: string;
	properties?: Record<string, string>;
	Properties?: Record<string, string>;
}

export interface FluidStateFilter {
	bounds?: {
		enabled?: boolean;
		min: { x: number; y: number; z: number };
		max: { x: number; y: number; z: number };
	};
	hiddenCells?: ReadonlySet<string>;
}

/** Serialize each palette entry once, including fluid levels and waterlogged state. */
export function fluidPaletteStates(palette: readonly PaletteEntry[]): string[] {
	return palette.map((entry) => {
		const name = entry.name || entry.Name || "";
		const props = entry.properties || entry.Properties || {};
		const keys = Object.keys(props).sort();
		return keys.length ? `${name}[${keys.map((key) => `${key}=${props[key]}`).join(",")}]` : name;
	});
}

/** Build the fluid scan's lookup with chunk-level WASM calls, never per-cell wrappers. */
export function createFluidStateLookup(
	schematic: Pick<SchematicWrapper, "create_lazy_chunk_iterator">,
	states: readonly string[],
	sx: number,
	sy: number,
	sz: number,
	{ bounds, hiddenCells }: FluidStateFilter = {}
): GetBlock {
	// Zero means missing/air, independently of where air appears in the palette.
	// Most palettes fit in one or two bytes per cell; large palettes retain full indices.
	const Grid = states.length < 256 ? Uint8Array : states.length < 65536 ? Uint16Array : Uint32Array;
	const grid = new Grid(sx * sy * sz);
	const inside = (x: number, y: number, z: number) =>
		x >= 0 && y >= 0 && z >= 0 && x < sx && y < sy && z < sz;
	const put = (x: number, y: number, z: number, index: number) => {
		if (!inside(x, y, z) || index < 0 || index >= states.length) return;
		if (
			bounds?.enabled &&
			(x < bounds.min.x ||
				y < bounds.min.y ||
				z < bounds.min.z ||
				x >= bounds.max.x ||
				y >= bounds.max.y ||
				z >= bounds.max.z)
		)
			return;
		grid[(y * sz + z) * sx + x] = index + 1;
	};
	const iterator = schematic.create_lazy_chunk_iterator(16, 16, 16, "bottom_up", 0, 0, 0);
	try {
		while (iterator.has_next()) {
			const blocks = iterator.next()?.blocks as Int32Array | Uint32Array | number[][] | undefined;
			if (!blocks) continue;
			if (blocks instanceof Int32Array || blocks instanceof Uint32Array) {
				for (let i = 0; i + 3 < blocks.length; i += 4) {
					put(blocks[i], blocks[i + 1], blocks[i + 2], blocks[i + 3]);
				}
			} else {
				for (const [x, y, z, index] of blocks) put(x, y, z, index);
			}
		}
	} finally {
		iterator.free();
	}
	// Filter hidden cells once, instead of allocating a coordinate string per scanned cell.
	for (const cell of hiddenCells ?? []) {
		const [x, y, z] = cell.split(",").map(Number);
		if (inside(x, y, z)) grid[(y * sz + z) * sx + x] = 0;
	}
	return (x, y, z) => (inside(x, y, z) ? states[grid[(y * sz + z) * sx + x] - 1] || "" : "");
}
