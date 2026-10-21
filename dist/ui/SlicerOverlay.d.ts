import type { SchematicRenderer } from "../SchematicRenderer";
export type SlicerOverlayCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";
export interface SlicerOverlayOptions {
    visible?: boolean;
    debounceMs?: number;
    corner?: SlicerOverlayCorner;
    offset?: {
        x: number;
        y: number;
    };
    showHelperByDefault?: boolean;
}
export declare class SlicerOverlay {
    private renderer;
    private opts;
    private container;
    private destroyed;
    private currentSchematic;
    private rebuildDebounced;
    private axisRows;
    private liveDelay;
    private helperVisible;
    private rebuildInFlight;
    private rebuildDirty;
    private schematicSelect;
    private schematicPickerRow;
    private helperToggleEl;
    private sidebarShift;
    private boundOnSchematicAdded;
    private boundOnSchematicLoaded;
    private boundOnSchematicRemoved;
    private boundOnSidebarVisibilityChanged;
    constructor(renderer: SchematicRenderer, options?: SlicerOverlayOptions);
    show(): void;
    hide(): void;
    toggle(): void;
    isVisible(): boolean;
    setDebounceMs(ms: number): void;
    dispose(): void;
    private buildContainer;
    /**
     * Park the overlay on the canvas's parent so it positions relative to the
     * canvas rather than the document viewport. If the parent is statically
     * positioned we flip it to `relative` so `position: absolute` resolves
     * against it instead of the page.
     */
    private attachToCanvas;
    private applyCornerPosition;
    /**
     * If the sidebar shares a side with the slicer (e.g. both on the right),
     * push the slicer aside by the sidebar's width when it opens so the two
     * stop fighting for the same corner. Left/right mismatches need no shift.
     */
    private handleSidebarVisibilityChanged;
    /**
     * On construction, the sidebar may already be visible (hidden-by-default
     * is false, or a saved layout). Read its current state via the renderer
     * so we start in the right position instead of overlapping.
     */
    private syncToSidebarState;
    private buildSchematicPicker;
    private buildAxisRow;
    private buildHelperToggle;
    private setHelperToggleUI;
    private buildResetLink;
    private refreshSchematicList;
    private onSchematicLoaded;
    private setActiveSchematic;
    private ensureCurrentSchematic;
    private applyAxisRanges;
    private syncSlidersFromBounds;
    private updateFillVisual;
    private onAxisInput;
    private applyAllBoundsToActiveSchematic;
    private resetAll;
}
//# sourceMappingURL=SlicerOverlay.d.ts.map