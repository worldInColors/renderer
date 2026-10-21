import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { buildBubbleMesh, MAX_BUBBLES } from "./BubbleColumns";
import { buildFluidMeshes } from "./WaterMesher";
import { SchematicObject } from "../managers/SchematicObject";
import { vi } from "vitest";
vi.mock("nucleation", () => ({ default: vi.fn(), SchematicWrapper: class {} }));
vi.mock("../workers/MeshBuilder.worker?worker&inline", () => ({ default: class {} }));
vi.mock("../workers/MeshBuilderWasm.worker?worker&inline", () => ({ default: class {} }));

describe("bubble column particles", () => {
	it("collects only bubble cells during the existing fluid scan", () => {
		const states = ["water", "bubble_column[drag=false]", "bubble_column[drag=true]", "stone"];
		const result = buildFluidMeshes((x) => states[x], 4, 1, 1);
		expect(result.bubbleCells).toEqual([
			{ x: 1, y: 0, z: 0, downward: false },
			{ x: 2, y: 0, z: 0, downward: true },
		]);
	});
	it("joins adjacent cells but stops at holes and changes in direction", () => {
		const cells = [0, 1, 3, 4].map((y) => ({ x: 2, y, z: 3, downward: y === 4 }));
		const mesh = buildBubbleMesh(cells, new THREE.Texture())!;
		const columns = mesh.geometry.getAttribute("aColumn");
		const seeds = mesh.geometry.getAttribute("aSeed");
		expect((mesh.geometry as THREE.InstancedBufferGeometry).instanceCount).toBe(12);
		expect(columns.getW(0)).toBeCloseTo(1.7);
		expect(columns.getY(6)).toBeCloseTo(2.6);
		expect(columns.getW(6)).toBeCloseTo(0.7);
		expect(seeds.getW(6)).toBeGreaterThan(0);
		expect(seeds.getW(9)).toBeLessThan(0);
		expect(mesh.material).toMatchObject({ depthTest: true, depthWrite: false, transparent: true });
	});
	it("bounds instance count and covers the full height of large columns", () => {
		const mesh = buildBubbleMesh(
			Array.from({ length: 10000 }, (_, y) => ({ x: 0, y, z: 0, downward: false })),
			new THREE.Texture()
		)!;
		expect((mesh.geometry as THREE.InstancedBufferGeometry).instanceCount).toBe(MAX_BUBBLES);
		expect(mesh.geometry.boundingBox!.max.y).toBe(9999.5);
		expect(buildBubbleMesh([], new THREE.Texture())).toBeNull();
	});
	it("stops requesting frames when the schematic is hidden or its mesh is removed", () => {
		const schematic = Object.create(SchematicObject.prototype);
		schematic.visible = true;
		schematic.group = new THREE.Group();
		schematic.bubbleMesh = buildBubbleMesh(
			[{ x: 0, y: 0, z: 0, downward: false }],
			new THREE.Texture()
		);
		schematic.group.add(schematic.bubbleMesh);
		expect(schematic.hasAnimatedParticles).toBe(true);
		const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 10);
		camera.position.z = 3;
		camera.updateMatrixWorld();
		const frustum = new THREE.Frustum().setFromProjectionMatrix(
			new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
		);
		expect(schematic.hasParticlesInView(frustum)).toBe(true);
		schematic.group.position.x = 100;
		schematic.group.updateMatrixWorld(true);
		expect(schematic.hasParticlesInView(frustum)).toBe(false);
		schematic.visible = false;
		expect(schematic.hasAnimatedParticles).toBe(false);
		schematic.visible = true;
		schematic.group.remove(schematic.bubbleMesh);
		expect(schematic.hasAnimatedParticles).toBe(false);
	});
});
