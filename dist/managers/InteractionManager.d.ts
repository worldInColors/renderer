import { SchematicRenderer } from "../SchematicRenderer";
export interface InteractionManagerOptions {
    enableSelection?: boolean;
    enableMovingSchematics?: boolean;
    enableBlockSelection?: boolean;
}
export declare class InteractionManager {
    private schematicRenderer;
    private options;
    private raycaster;
    private mouse;
    private camera;
    private hoveredObject;
    private canvas;
    private selectedObject;
    constructor(schematicRenderer: SchematicRenderer, options: InteractionManagerOptions);
    private addEventListeners;
    private onMouseMove;
    private onMouseDown;
    private onKeyDown;
    private updateMousePosition;
    private checkHover;
    private findSelectableParent;
    private visualizeBoundingBoxes;
    private checkSelection;
    private selectObject;
    private deselectObject;
    update(): void;
    dispose(): void;
}
//# sourceMappingURL=InteractionManager.d.ts.map