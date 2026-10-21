import { describe, expect, it, vi } from "vitest";
import { affectedSurfaceSections, readSurfaceIndex, SurfaceIndex } from "./SurfaceIndex";

describe("sparse surface index", () => {
	it.each(["flat", "tuples"])(
		"retains only occupied surface cells from %s chunks",
		async (format) => {
			const cells = [
				[0, 0, 0, 0],
				[100000, 3, 100000, 1],
				[15, 2, 2, 2],
				[16, 2, 2, 2],
			];
			let done = false;
			const iterator = {
				has_next: () => !done,
				next: () => {
					done = true;
					return { blocks: format === "flat" ? new Int32Array(cells.flat()) : cells };
				},
				free: vi.fn(),
			};
			const index = await readSurfaceIndex(
				{ create_lazy_chunk_iterator: () => iterator } as any,
				["minecraft:stone", "minecraft:end_portal", "minecraft:glass"],
				{ hiddenCells: new Set(["16,2,2"]) }
			);
			expect(index.sections.size).toBe(2);
			expect(index.getBlock(100000, 3, 100000)).toBe("minecraft:end_portal");
			expect(index.getBlock(0, 0, 0)).toBe("");
			expect(index.getBlock(16, 2, 2)).toBe("");
			expect(iterator.free).toHaveBeenCalledOnce();
		}
	);
	it("handles negative coordinates, section-cache invalidation and removing the last cell", () => {
		const index = new SurfaceIndex();
		index.set(-1, 0, 0, "minecraft:glass");
		expect(index.getBlock(-1, 0, 0)).toBe("minecraft:glass");
		expect(index.getBlock(15, 0, 0)).toBe("");
		index.set(-1, 0, 0, "minecraft:air");
		expect(index.getBlock(-1, 0, 0)).toBe("");
		expect(index.sections.size).toBe(0);
	});
	it("includes diagonal neighbors only when an edit reaches a section edge", () => {
		expect([...affectedSurfaceSections([{ x: 5, y: 5, z: 5 }])]).toEqual(["0,0,0"]);
		const corner = affectedSurfaceSections([{ x: 15, y: 15, z: 15 }]);
		expect(corner.size).toBe(8);
		expect(corner.has("1,1,1")).toBe(true);
	});
	it("frees the iterator after a read failure", async () => {
		const iterator = {
			has_next: () => true,
			next: () => {
				throw new Error("read failed");
			},
			free: vi.fn(),
		};
		await expect(
			readSurfaceIndex(
				{ create_lazy_chunk_iterator: () => iterator } as any,
				["minecraft:glass"],
				{}
			)
		).rejects.toThrow("read failed");
		expect(iterator.free).toHaveBeenCalledOnce();
	});
});
