import { describe, expect, it, vi } from "vitest";
import * as THREE from "three";
import { SchematicObject } from "../managers/SchematicObject";
import { SurfaceIndex } from "./SurfaceIndex";
vi.mock("nucleation", () => ({ default: vi.fn(), SchematicWrapper: class {} }));
vi.mock("../workers/MeshBuilder.worker?worker&inline", () => ({ default: class {} }));
vi.mock("../workers/MeshBuilderWasm.worker?worker&inline", () => ({ default: class {} }));

function schematic() {
	const object: any = Object.create(SchematicObject.prototype);
	const cells = new Map<string, string>();
	const texture = new THREE.Texture();
	const loader = {
		getMaterial: vi.fn(async () => new THREE.MeshStandardMaterial({ map: texture })),
		getTexture: vi.fn(async () => texture),
	};
	Object.assign(object, {
		eventEmitter: { emit: vi.fn() },
		visible: true,
		opacity: 1,
		group: new THREE.Group(),
		meshes: [],
		animatedSurfaces: [],
		surfaceViewBox: new THREE.Box3(),
		surfaceIndex: new SurfaceIndex(),
		surfaceTemplates: new Map(),
		surfaceMaterials: new Map(),
		surfaceClip: { value: new THREE.Vector2(0, 1e9) },
		hiddenCells: new Set(),
		renderingBounds: {
			enabled: false,
			min: new THREE.Vector3(),
			max: new THREE.Vector3(128, 16, 16),
		},
		editQueue: Promise.resolve(),
		meshesReady: Promise.resolve(),
		gpuBuilt: false,
		schematicWrapper: {
			get_block_string: (x: number, y: number, z: number) =>
				cells.get(`${x},${y},${z}`) || "minecraft:air",
			set_block: (x: number, y: number, z: number, state: string) =>
				cells.set(`${x},${y},${z}`, state),
		},
		schematicRenderer: {
			options: { meshBuildingMode: "gpu-pull", enableAnimatedTextures: true },
			invalidate: vi.fn(),
			cubane: {
				getAssetLoader: () => loader,
				getBlockMesh: vi.fn(async (state: string) => {
					const material = new THREE.MeshBasicMaterial();
					material.userData.texturePath = `block/${state}`;
					return [{ geometry: new THREE.BoxGeometry(), material }];
				}),
			},
		},
		worldMeshBuilder: { extractAllMeshData: (parts: unknown) => parts },
		rebuildMeshNow: vi.fn(async () => {}),
	});
	return { object, loader };
}
const surfaces = (s: any) => s.meshes.filter((m: THREE.Mesh) => m.userData.surfaceMesh);
const triangles = (meshes: THREE.Mesh[]) =>
	meshes.reduce(
		(n, m) => n + (m.geometry.index?.count ?? m.geometry.getAttribute("position").count),
		0
	);

describe("surface edit lifecycle", () => {
	it("orders inspector hide after an in-flight edit and treats empty edits as no-ops", async () => {
		const { object } = schematic();
		await object.setBlocks([]);
		expect(object.rebuildMeshNow).not.toHaveBeenCalled();
		let release!: () => void, started!: () => void;
		const gate = new Promise<void>((r) => (release = r));
		const building = new Promise<void>((r) => (started = r));
		const build = object.buildSurfaceSections.bind(object);
		vi.spyOn(object, "buildSurfaceSections").mockImplementationOnce(async (keys) => {
			const meshes = await build(keys);
			started();
			await gate;
			return meshes;
		});
		const edit = object.setBlock([0, 0, 0], "minecraft:glass");
		await building;
		const hide = object.hideBlockAndRebuild(0, 0, 0);
		release();
		await Promise.all([edit, hide]);
		expect(surfaces(object)).toHaveLength(0);
		expect(object.surfaceIndex.getBlock(0, 0, 0)).toBe("");
		await object.unhideAllBlocks();
		expect(triangles(surfaces(object))).toBe(36);
	});

	it("updates section seams without replacing unrelated geometry or materials", async () => {
		const { object, loader } = schematic();
		const opaque = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
		object.meshes.push(opaque);
		object.group.add(opaque);
		await object.setBlocks([
			[[15, 0, 0], "minecraft:glass"],
			[[16, 0, 0], "minecraft:glass"],
			[[64, 0, 0], "minecraft:glass"],
		]);
		const distant = surfaces(object).find((m: THREE.Mesh) => m.userData.surfaceSection === "4,0,0");
		expect(triangles(surfaces(object))).toBe(16 * 6);
		await object.setBlock([15, 0, 0], "minecraft:air");
		expect(triangles(surfaces(object))).toBe(12 * 6);
		expect(object.meshes).toContain(distant);
		expect(object.meshes).toContain(opaque);
		expect(loader.getMaterial).toHaveBeenCalledOnce();
		expect(object.rebuildMeshNow).not.toHaveBeenCalled();
	});
	it("serializes concurrent edits and inherits the current layer clip for new colors", async () => {
		const { object } = schematic();
		await object.setBlock([0, 0, 0], "minecraft:glass");
		object.surfaceClip.value.set(1, 2);
		await Promise.all([
			object.setBlock([0, 0, 0], "minecraft:red_stained_glass"),
			object.setBlock([0, 0, 0], "minecraft:blue_stained_glass"),
		]);
		expect(object.surfaceIndex.getBlock(0, 0, 0)).toBe("minecraft:blue_stained_glass");
		expect(surfaces(object)).toHaveLength(1);
		expect(surfaces(object)[0].material.uniforms.uLayerClip.value.toArray()).toEqual([1, 2]);
	});
	it("replaces inspector hidden surfaces and restores the same geometry without duplicates", async () => {
		const { object } = schematic();
		await object.setBlocks([
			[[0, 0, 0], "minecraft:glass"],
			[[1, 0, 0], "minecraft:glass"],
			[[4, 0, 0], "minecraft:end_portal"],
		]);
		const before = triangles(surfaces(object));
		for (let i = 0; i < 3; i++) {
			await object.hideBlockAndRebuild(1, 0, 0);
			expect(triangles(surfaces(object))).toBe(6 * 6 + 6);
			await object.hideBlockAndRebuild(4, 0, 0);
			expect(object.hasAnimatedSurfaces).toBe(false);
			await object.unhideAllBlocks();
			expect(triangles(surfaces(object))).toBe(before);
			expect(object.group.children.length).toBe(surfaces(object).length);
			expect(object.hasAnimatedSurfaces).toBe(true);
		}
		expect(object.rebuildMeshNow).not.toHaveBeenCalled();
	});
	it("restores current opacity on cached materials and shows sections edited while hidden", async () => {
		const { object } = schematic();
		await object.setBlocks([
			[[0, 0, 0], "minecraft:glass"],
			[[3, 0, 0], "minecraft:end_portal"],
		]);
		object.opacity = 0.5;
		object.updateMeshMaterials("opacity");
		await object.hideBlockAndRebuild(0, 0, 0);
		await object.hideBlockAndRebuild(3, 0, 0);
		object.opacity = 1;
		object.updateMeshMaterials("opacity");
		await object.unhideAllBlocks();
		expect(surfaces(object).map((m: THREE.Mesh) => (m.material as THREE.Material).opacity)).toEqual(
			[1, 1]
		);
		object.visible = false;
		object.updateMeshVisibility();
		await object.setBlock([0, 0, 0], "minecraft:red_stained_glass");
		expect(object.group.visible).toBe(false);
		object.visible = true;
		object.updateMeshVisibility();
		expect(surfaces(object).every((m: THREE.Mesh) => m.visible)).toBe(true);
	});

	it("uses a full rebuild when opaque geometry or waterlogged fluid also changes", async () => {
		const { object } = schematic();
		await object.setBlock([0, 0, 0], "minecraft:glass");
		await object.setBlock([0, 0, 0], "minecraft:stone");
		expect(object.rebuildMeshNow).toHaveBeenCalledOnce();
		await object.setBlock([1, 0, 0], "minecraft:glass_pane[waterlogged=true]");
		expect(object.rebuildMeshNow).toHaveBeenCalledTimes(2);
	});
	it("does not animate clipped, offscreen, removed or invisible End portals", async () => {
		const { object } = schematic();
		await object.setBlock([0, 0, 0], "minecraft:end_portal");
		const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 10);
		camera.position.set(0, 2, 3);
		camera.lookAt(0, 0, 0);
		camera.updateMatrixWorld();
		const frustum = new THREE.Frustum().setFromProjectionMatrix(
			new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
		);
		expect(object.hasSurfacesInView(frustum)).toBe(true);
		object.surfaceClip.value.set(1, -1);
		expect(object.hasSurfacesInView(frustum)).toBe(false);
		object.surfaceClip.value.set(0, 0);
		object.group.position.x = 100;
		expect(object.hasSurfacesInView(frustum)).toBe(false);
		object.group.position.x = 0;
		object.group.visible = false;
		expect(object.hasSurfacesInView(frustum)).toBe(false);
		object.group.visible = true;
		const end = surfaces(object)[0];
		object.opacity = 0;
		object.updateMeshMaterials("opacity");
		end.onBeforeRender();
		expect(end.material.uniforms.uOpacity.value).toBe(0);
		expect(end.material.fragmentShader).toContain("uOpacity <= 0.0");
		expect(object.hasSurfacesInView(frustum)).toBe(false);
		object.group.clear();
		expect(object.hasSurfacesInView(frustum)).toBe(false);
	});
});
