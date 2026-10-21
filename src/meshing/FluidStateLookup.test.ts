import { describe, expect, it, vi } from "vitest";
import type { SchematicWrapper } from "../nucleationExports";
import { createFluidStateLookup, fluidPaletteStates } from "./FluidStateLookup";
import { buildFluidMeshes, disposeFluidMeshes } from "./WaterMesher";

function schematic(chunks: Array<{ blocks?: Int32Array | Uint32Array | number[][] } | null>) {
	let next = 0;
	const iterator = {
		has_next: vi.fn(() => next < chunks.length),
		next: vi.fn(() => chunks[next++]),
		free: vi.fn(),
	};
	const source = {
		create_lazy_chunk_iterator: vi.fn(() => iterator),
		get_block: vi.fn(() => {
			throw new Error("Unexpected per-cell WASM call");
		}),
		get_block_with_properties: vi.fn(() => {
			throw new Error("Unexpected BlockStateWrapper allocation");
		}),
	};
	return { source, iterator, wrapper: source as unknown as SchematicWrapper };
}

const palette: Parameters<typeof fluidPaletteStates>[0] = [
	{ name: "minecraft:water", properties: { level: "3" } },
	{
		name: "minecraft:scaffolding",
		properties: { waterlogged: "true", distance: "1", bottom: "true" },
	},
	{ name: "minecraft:air" },
	{
		name: "minecraft:polished_andesite_stairs",
		properties: { waterlogged: "true", facing: "north", half: "bottom", shape: "inner_right" },
	},
	{ name: "minecraft:bubble_column", properties: { drag: "true" } },
	{ name: "minecraft:stone" },
	{ name: "minecraft:water", properties: { level: "8" } },
	{ name: "minecraft:lava", properties: { level: "0" } },
];
const states = fluidPaletteStates(palette);

describe("fluid state lookup", () => {
	it("canonicalizes properties once, including waterlogged and fluid states", () => {
		expect(states[0]).toBe("minecraft:water[level=3]");
		expect(states[1]).toBe("minecraft:scaffolding[bottom=true,distance=1,waterlogged=true]");
		expect(states[2]).toBe("minecraft:air");
		expect(states[3]).toBe(
			"minecraft:polished_andesite_stairs[facing=north,half=bottom,shape=inner_right,waterlogged=true]"
		);
		expect(fluidPaletteStates([{ Name: "minecraft:water", Properties: { level: "2" } }])).toEqual([
			"minecraft:water[level=2]",
		]);
	});

	it.each(["signed", "unsigned", "tuples"])(
		"reads %s chunks with no per-cell WASM calls or air-index assumption",
		(format) => {
			const cells = [
				[0, 0, 0, 0],
				[2, 1, 1, 1],
				[1, 0, 0, 2],
				[1, 1, 1, 3],
			];
			const blocks =
				format === "signed"
					? new Int32Array(cells.flat())
					: format === "unsigned"
						? new Uint32Array(cells.flat())
						: cells;
			const { wrapper, source, iterator } = schematic([null, {}, { blocks: [] }, { blocks }]);
			const getBlock = createFluidStateLookup(wrapper, states, 3, 2, 2);
			expect(getBlock(0, 0, 0)).toBe(states[0]);
			expect(getBlock(2, 1, 1)).toBe(states[1]);
			expect(getBlock(1, 0, 0)).toBe("minecraft:air");
			expect(getBlock(1, 1, 1)).toBe(states[3]);
			expect(getBlock(2, 0, 0)).toBe("");
			expect(getBlock(-1, 0, 0)).toBe("");
			expect(getBlock(3, 0, 0)).toBe("");
			expect(getBlock(0, 2, 0)).toBe("");
			expect(getBlock(0, 0, 2)).toBe("");
			expect(source.create_lazy_chunk_iterator).toHaveBeenCalledOnce();
			expect(iterator.next).toHaveBeenCalledTimes(4);
			expect(iterator.free).toHaveBeenCalledOnce();
			expect(source.get_block).not.toHaveBeenCalled();
			expect(source.get_block_with_properties).not.toHaveBeenCalled();
		}
	);

	it.each([255, 256, 65535, 65536])("preserves indices for palettes of %i entries", (length) => {
		const largePalette = Array<string>(length).fill("minecraft:air");
		largePalette[length - 1] = "minecraft:water[level=8]";
		const { wrapper } = schematic([{ blocks: new Uint32Array([0, 0, 0, length - 1]) }]);
		const getBlock = createFluidStateLookup(wrapper, largePalette, 2, 1, 1);
		expect(getBlock(0, 0, 0)).toBe("minecraft:water[level=8]");
		expect(getBlock(1, 0, 0)).toBe("");
	});

	it("clips all axes with inclusive minima and exclusive maxima and hides cells", () => {
		const blocks = [];
		for (let y = 0; y < 4; y++)
			for (let z = 0; z < 4; z++) for (let x = 0; x < 4; x++) blocks.push([x, y, z, 0]);
		const { wrapper } = schematic([{ blocks }]);
		const getBlock = createFluidStateLookup(wrapper, states, 4, 4, 4, {
			bounds: { enabled: true, min: { x: 1, y: 1, z: 1 }, max: { x: 3, y: 3, z: 3 } },
			hiddenCells: new Set(["2,2,2", "-1,0,0"]),
		});
		for (let y = 0; y < 4; y++)
			for (let z = 0; z < 4; z++)
				for (let x = 0; x < 4; x++) {
					const visible =
						x >= 1 &&
						x < 3 &&
						y >= 1 &&
						y < 3 &&
						z >= 1 &&
						z < 3 &&
						!(x === 2 && y === 2 && z === 2);
					expect(getBlock(x, y, z)).toBe(visible ? states[0] : "");
				}
	});

	it("ignores disabled bounds and does not alias out-of-volume coordinates", () => {
		const { wrapper } = schematic([
			{
				blocks: [
					[0, 0, 0, 0],
					[2, 0, 0, 1],
					[-1, 1, 0, 1],
					[0, 2, 0, 1],
				],
			},
		]);
		const getBlock = createFluidStateLookup(wrapper, states, 2, 2, 1, {
			bounds: { enabled: false, min: { x: 1, y: 1, z: 1 }, max: { x: 1, y: 1, z: 1 } },
		});
		expect(getBlock(0, 0, 0)).toBe(states[0]);
		expect(getBlock(0, 1, 0)).toBe("");
		expect(getBlock(1, 0, 0)).toBe("");
	});

	it("frees the iterator if chunk extraction fails", () => {
		const { wrapper, iterator } = schematic([{}]);
		iterator.next.mockImplementation(() => {
			throw new Error("Chunk failed");
		});
		expect(() => createFluidStateLookup(wrapper, states, 1, 1, 1)).toThrow("Chunk failed");
		expect(iterator.free).toHaveBeenCalledOnce();
	});

	it("produces identical fluid geometry and bubble directions to direct state reads", () => {
		const cells = [
			[0, 0, 0, 0],
			[1, 0, 0, 1],
			[2, 0, 0, 3],
			[0, 1, 0, 4],
			[1, 1, 0, 5],
			[0, 0, 1, 6],
			[3, 0, 2, 7],
		];
		const { wrapper } = schematic([{ blocks: cells }]);
		const direct = new Map(cells.map(([x, y, z, p]) => [`${x},${y},${z}`, states[p]]));
		const expected = buildFluidMeshes((x, y, z) => direct.get(`${x},${y},${z}`), 4, 2, 3);
		const actual = buildFluidMeshes(createFluidStateLookup(wrapper, states, 4, 2, 3), 4, 2, 3);
		try {
			expect(actual.cells).toBe(expected.cells);
			expect(actual.bubbleCells).toEqual(expected.bubbleCells);
			expect(actual.meshes).toHaveLength(expected.meshes.length);
			actual.meshes.forEach((mesh, i) => {
				const reference = expected.meshes[i].geometry;
				expect(mesh.geometry.index!.array).toEqual(reference.index!.array);
				for (const name of Object.keys(reference.attributes)) {
					expect(mesh.geometry.getAttribute(name).array).toEqual(
						reference.getAttribute(name).array
					);
				}
			});
		} finally {
			disposeFluidMeshes([...actual.meshes, ...expected.meshes]);
		}
	});
});
