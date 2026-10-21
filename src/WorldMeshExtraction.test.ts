import { describe, expect, it, vi } from "vitest";
import * as THREE from "three";
vi.mock("nucleation", () => ({ default: vi.fn(), SchematicWrapper: class {} }));
vi.mock("./workers/MeshBuilder.worker?worker&inline", () => ({ default: class {} }));
vi.mock("./workers/MeshBuilderWasm.worker?worker&inline", () => ({ default: class {} }));
import { WorldMeshBuilder } from "./WorldMeshBuilder";
import { buildChestBlockMesh } from "./meshing/ChestModels";

const extract = (root: THREE.Object3D): Array<{ geometry: THREE.BufferGeometry }> =>
	(WorldMeshBuilder.prototype as any).extractAllMeshData(root);

describe("palette mesh extraction", () => {
	it("separates a waterlogged host from its fluid in the palette sent to mesh builders", async () => {
		const host = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
		const waterMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.6 });
		waterMaterial.userData.isWater = true;
		const root = new THREE.Group();
		root.add(host, new THREE.Mesh(new THREE.BoxGeometry(), waterMaterial));
		const builder = Object.assign(Object.create(WorldMeshBuilder.prototype), {
			schematicRenderer: { options: {} },
			cubane: { getBlockMesh: async () => root },
			initializeWorkers: () => {},
			workers: [],
		});
		await builder.precomputePaletteGeometries([
			{ name: "minecraft:scaffolding", properties: { waterlogged: "true" } },
		], true);
		const [block] = builder.paletteCache.paletteGeometryData;
		expect(block.category).toBe("solid");
		expect(block.geometries).toHaveLength(1);
		expect(block.geometries[0].fluid).toBeUndefined();
		expect(block.occlusionFlags).toBe(0);
	});
	it.each(["scaffolding", "polished_andesite_stairs", "kelp"])(
		"draws the %s host before its shared water surface",
		(name) => {
			const builder = WorldMeshBuilder.prototype as any;
			const props = { waterlogged: "true" };
			const category = builder.getBlockCategory(`minecraft:${name}`, props, false);
			expect(category).toBe("solid");
			const host = new THREE.Mesh();
			builder.configureMeshForCategory(host, category);
			expect(host.renderOrder).toBeLessThan(3);
			expect(builder.getBlockCategory(`minecraft:${name}`, props, true)).toBe("water");
		}
	);
	it("preserves transparent host classification when water is separated", () => {
		expect(
			(WorldMeshBuilder.prototype as any).getBlockCategory(
				"minecraft:glass_pane",
				{ waterlogged: "true" },
				false
			)
		).toBe("transparent");
	});
	it("retains a chest returned as a root mesh", async () => {
		const chest = (await buildChestBlockMesh("minecraft:chest[type=left,facing=south]", {
			getTexture: async () => new THREE.Texture(),
		}))!;
		const result = extract(chest);
		expect(result).toHaveLength(1);
		expect(result[0].geometry.getAttribute("position").array).toEqual(
			chest.geometry.getAttribute("position").array
		);
	});
	it("preserves child transforms relative to a rotated root", () => {
		const root = new THREE.Group();
		root.position.set(5, 2, 1);
		root.rotation.y = Math.PI / 2;
		const child = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
		child.position.set(2, 0, 0);
		root.add(child);
		const result = extract(root)[0].geometry;
		result.computeBoundingBox();
		const center = result.boundingBox!.getCenter(new THREE.Vector3());
		expect(center.x).toBeCloseTo(2);
		expect(center.y).toBeCloseTo(0);
		expect(center.z).toBeCloseTo(0);
	});
});
