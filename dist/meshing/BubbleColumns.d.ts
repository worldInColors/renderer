import * as THREE from "three";
export interface BubbleCell {
    x: number;
    y: number;
    z: number;
    downward: boolean;
}
export declare const MAX_BUBBLES = 8192;
/** One immutable instance buffer; the GPU handles travel, sway and respawning. */
export declare function buildBubbleMesh(cells: BubbleCell[], texture: THREE.Texture): THREE.Mesh | null;
//# sourceMappingURL=BubbleColumns.d.ts.map