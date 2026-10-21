import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { buildChestBlockMesh, buildChestInstancedMeshes } from "./ChestModels";

describe("chest blockstates", () => {
	it.each([
		["north", 1, 0],
		["east", 0, 1],
		["south", -1, 0],
		["west", 0, -1],
	] as const)("joins both halves facing %s with no gap", async (facing, dx, dz) => {
		const paths: string[] = [];
		const loader = {
			getTexture: async (path: string) => {
				paths.push(path);
				return new THREE.Texture();
			},
		};
		const left = (await buildChestBlockMesh(
			`minecraft:chest[facing=${facing},type=left]`,
			loader
		))!;
		const right = (await buildChestBlockMesh(
			`minecraft:chest[facing=${facing},type=right]`,
			loader
		))!;
		right.geometry.translate(dx, 0, dz);
		left.geometry.computeBoundingBox();
		right.geometry.computeBoundingBox();
		const a = left.geometry.boundingBox!,
			b = right.geometry.boundingBox!;
		const axis = dx === 0 ? "z" : "x";
		if (dx + dz > 0) expect(a.max[axis]).toBeCloseTo(b.min[axis]);
		else expect(a.min[axis]).toBeCloseTo(b.max[axis]);
		expect(a.clone().union(b).getSize(new THREE.Vector3())[axis]).toBeCloseTo(30 / 16);
		expect(paths).toEqual(["entity/chest/normal_left", "entity/chest/normal_right"]);
	});

	it("uses identical geometry placement in the CPU and GPU instance paths", async () => {
		const state = "minecraft:chest[facing=east,type=left]";
		const loader = { getTexture: async () => new THREE.Texture() };
		const cpu = (await buildChestBlockMesh(state, loader))!;
		const { meshes } = await buildChestInstancedMeshes(
			[{ state, positions: [{ x: 0, y: 0, z: 0 }] }],
			loader,
			1,
			1,
			1
		);
		const matrix = new THREE.Matrix4();
		meshes[0].getMatrixAt(0, matrix);
		const gpu = meshes[0].geometry.clone().applyMatrix4(matrix);
		const a = cpu.geometry.getAttribute("position"),
			b = gpu.getAttribute("position");
		for (let i = 0; i < a.array.length; i++) expect(a.array[i]).toBeCloseTo(b.array[i]);
	});
});
