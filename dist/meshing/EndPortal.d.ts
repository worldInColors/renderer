import * as THREE from "three";
import type { SurfaceCell } from "./SurfaceIndex";
/** End portal block models contain no elements: the block entity supplies this surface. */
export declare function buildEndPortalMesh(cells: Iterable<SurfaceCell>, material: THREE.ShaderMaterial, animate: boolean): THREE.Mesh | null;
export declare function makeEndPortalMaterial(sky: THREE.Texture, portal: THREE.Texture, clip?: {
    value: THREE.Vector2;
}): THREE.ShaderMaterial;
//# sourceMappingURL=EndPortal.d.ts.map