import * as THREE from "three";
export declare class EntityRenderer {
    private debug;
    private loader;
    private modelCache;
    constructor();
    /**
     * Create a THREE.js mesh for the given entity
     */
    createEntityMesh(entityName: string): Promise<THREE.Object3D | null>;
    /**
     * Preload specific models for better performance
     */
    preloadModels(entityNames: string[]): Promise<void>;
    /**
     * Set debug mode
     */
    setDebug(debug: boolean): void;
}
//# sourceMappingURL=EntityRenderer.d.ts.map