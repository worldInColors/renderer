import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { installSurfaceSorting } from "./SurfaceSorting";

describe("transparent surface sorting", () => {
	it("sorts exact depths, skips unchanged orders and updates after reversal", () => {
		const centers = new Float32Array(
			Array.from({ length: 500 }, (_, i) => [
				Math.sin(i * 19) * 10,
				Math.cos(i * 7) * 10,
				Math.sin(i * 3) * 10,
			]).flat()
		);
		const geometry = new THREE.BufferGeometry();
		geometry.setIndex(Array.from({ length: 500 * 6 }, (_, i) => i));
		const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
		installSurfaceSorting(mesh, centers);
		const camera = new THREE.PerspectiveCamera();
		const run = () =>
			mesh.onBeforeRender(null as any, null as any, camera, geometry, mesh.material, null as any);
		for (let turn = 0; turn < 20; turn++) {
			camera.position.set(Math.sin(turn) * 30, 20, Math.cos(turn) * 30);
			camera.lookAt(0, 0, 0);
			camera.updateMatrixWorld();
			run();
			const e = camera.matrixWorldInverse.elements;
			const depths = Array.from({ length: 500 }, (_, i) => {
				const f = geometry.index!.getX(i * 6) / 6;
				return Math.fround(
					centers[f * 3] * e[2] + centers[f * 3 + 1] * e[6] + centers[f * 3 + 2] * e[10]
				);
			});
			expect(depths).toEqual([...depths].sort((a, b) => a - b));
			const version = geometry.index!.version;
			run();
			expect(geometry.index!.version).toBe(version);
			// Translation with the same orientation never changes relative depth order.
			camera.position.x += 3;
			camera.updateMatrixWorld();
			run();
			expect(geometry.index!.version).toBe(version);
		}
	});
	it("does not upload when the direction changes but the face order does not", () => {
		const geometry = new THREE.BufferGeometry();
		geometry.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]);
		const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
		installSurfaceSorting(mesh, new Float32Array([0, 0, -2, 0, 0, 2]));
		const camera = new THREE.PerspectiveCamera();
		camera.position.z = 10;
		camera.updateMatrixWorld();
		const run = () =>
			mesh.onBeforeRender(null as any, null as any, camera, geometry, mesh.material, null as any);
		run();
		const version = geometry.index!.version;
		camera.lookAt(1, 0, 0);
		camera.updateMatrixWorld();
		run();
		expect(geometry.index!.version).toBe(version);
	});
});
