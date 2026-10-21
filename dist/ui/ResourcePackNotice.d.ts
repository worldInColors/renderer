import type { SchematicRenderer } from "../SchematicRenderer";
export type ResourcePackNoticeCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";
export interface ResourcePackNoticeOptions {
    corner?: ResourcePackNoticeCorner;
    offset?: {
        x: number;
        y: number;
    };
    /** Link shown in the expanded details. Empty hides the link. */
    docsUrl?: string;
}
export declare class ResourcePackNotice {
    private renderer;
    private opts;
    private container;
    private detailsEl;
    private toggleEl;
    private fileInput;
    private dismissed;
    private destroyed;
    private expanded;
    constructor(renderer: SchematicRenderer, options?: ResourcePackNoticeOptions);
    show(): void;
    hide(): void;
    dismiss(): void;
    isDismissed(): boolean;
    dispose(): void;
    private build;
    private buildDetails;
    private setExpanded;
    private onFileChosen;
    private applyCorner;
    /** Park the notice on the canvas's parent so it positions over the viewport. */
    private attachToCanvas;
}
//# sourceMappingURL=ResourcePackNotice.d.ts.map