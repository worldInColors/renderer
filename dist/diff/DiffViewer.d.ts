/**
 * DiffViewer shows the difference between two schematics on the REAL textured
 * build, not abstract cubes: it renders the "after" schematic with full block
 * textures via an internal SchematicRenderer, then lays a translucent colour
 * tint over the blocks that changed (added / removed / changed / swapped) and
 * lets you peel the build open with clipping planes to reach edits buried inside.
 *
 * Two viewing modes:
 *   - "cutaway": textured build + tint overlay + single-plane / two-plane-slab
 *     clipping to expose the interior.
 *   - "beforeafter": fade the tint between the before state (removed highlighted)
 *     and the after state (added highlighted) on the same camera.
 *
 * Construct one per canvas; pass a resource pack so the internal renderer can
 * texture blocks. Call dispose() when done.
 */
export type DiffState = "added" | "removed" | "changed" | "swapped" | "unchanged";
export type DiffMode = "single" | "slab";
/** Top-level viewing mode: peel the textured build open, or crossfade the tint. */
export type DiffViewMode = "cutaway" | "beforeafter";
export interface DiffStats {
    distance: number;
    support: number;
    added: number;
    removed: number;
    changed: number;
    swapped: number;
    unchanged: number;
    /** True when the overlay exceeded maxOverlay and some highlights were dropped. */
    truncated: boolean;
}
export interface DiffViewerColors {
    added: string;
    removed: string;
    changed: string;
    swapped: string;
    unchanged: string;
}
export interface DiffViewerOptions {
    colors?: Partial<DiffViewerColors>;
    /** Resource packs for the internal renderer, e.g. { vanilla: () => fetch(...).then(r => r.blob()) }. */
    resourcePacks?: Record<string, () => Promise<Blob>>;
    /** Optional HDRI environment URL passed to the internal renderer. */
    hdri?: string;
    /** Auto-orbit until the user interacts. Default true. */
    autoRotate?: boolean;
    /** Hard cap on tint-overlay cubes. Default 200_000. */
    maxOverlay?: number;
    onStats?: (stats: DiffStats) => void;
    onReady?: () => void;
}
export declare class DiffViewer {
    private colors;
    private maxOverlay;
    private onStats?;
    private renderer;
    private ready;
    private disposed;
    private geometry;
    private overlayMeshes;
    private overlayMaterials;
    private planeLo;
    private planeHi;
    private mode;
    private tiltRad;
    private cutFrac;
    private posFrac;
    private thickFrac;
    private dimUnchanged;
    private viewMode;
    private progress;
    private worldBox;
    private baseGroup;
    private stats;
    constructor(canvas: HTMLCanvasElement, options?: DiffViewerOptions);
    private afterInit;
    /** Render the textured "after" build and tint the blocks that changed. */
    loadDiff(beforeBytes: Uint8Array, afterBytes: Uint8Array, preset?: string): Promise<DiffStats>;
    private positionSet;
    private voxels;
    private paletteName;
    /** Build opaque shaded highlight cubes per change-state, parented to the build group. */
    private buildOverlay;
    private activePlanes;
    private recomputeWorldBox;
    /** Recompute clip planes (world space) and apply to block + overlay materials. */
    private updateClipping;
    /** Apply view-mode + dim + progress to overlay/base opacity. */
    private refreshOpacities;
    setMode(mode: DiffMode): void;
    setViewMode(mode: DiffViewMode): void;
    setProgress(t: number): void;
    setTilt(degrees: number): void;
    setCut(fraction: number): void;
    setSlab(posFraction: number, thicknessFraction: number): void;
    setStateVisible(state: DiffState, visible: boolean): void;
    setDimUnchanged(dim: boolean): void;
    resetView(): void;
    getStats(): DiffStats;
    private disposeOverlay;
    dispose(): void;
}
//# sourceMappingURL=DiffViewer.d.ts.map