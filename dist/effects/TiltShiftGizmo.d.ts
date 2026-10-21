import * as THREE from "three";
export declare class TiltShiftGizmo {
    private group;
    private plane;
    private nearEdge;
    private farEdge;
    private center;
    private parent;
    private disposed;
    constructor(parent: THREE.Object3D, size?: number);
    /**
     * Sync the gizmo to the current focus parameters.
     * @param focusPoint world-space anchor of the focus plane
     * @param focusNormal unit vector orienting the plane
     * @param focusRange half-width of the in-focus slab (world units)
     */
    update(focusPoint: THREE.Vector3, focusNormal: THREE.Vector3, focusRange: number): void;
    setVisible(visible: boolean): void;
    isVisible(): boolean;
    dispose(): void;
}
//# sourceMappingURL=TiltShiftGizmo.d.ts.map