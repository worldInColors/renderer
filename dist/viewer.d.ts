import { SchematicRenderer } from "./SchematicRenderer";
export type ViewerMode = "auto" | "gpu" | "cpu";
export type ViewerControls = "orbit" | "shulkr" | "fps";
export interface SchematicViewerOptions {
    /** Build mode. "auto" (default): gpu-pull on WebGPU, batched CPU otherwise. */
    mode?: ViewerMode;
    /** Camera controls flavor (default "shulkr" — smooth orbit + WASD). */
    controls?: ViewerControls;
    /** Optional URL of a vanilla resource pack zip; without it blocks use placeholder textures. */
    vanillaPackUrl?: string;
    /** Scene background color (default 0x0f1117). */
    background?: string | number;
    onStatus?: (status: {
        phase: string;
        message?: string;
    }) => void;
    onError?: (error: unknown) => void;
    /** Passthrough of renderer options (see SchematicRendererOptions). */
    rendererOptions?: Record<string, unknown>;
}
export declare class SchematicViewer {
    private container;
    private options;
    private renderer;
    private canvas;
    private ro;
    private mode;
    private currentUrl;
    private loadGen;
    private loadChain;
    constructor(container: HTMLElement, options?: SchematicViewerOptions);
    private resolveMode;
    /** Create the canvas + renderer. Resolves when ready to load. */
    init(): Promise<SchematicViewer>;
    /** Fetch (and gunzip if needed) a schematic URL and build it.
     * Loads are SERIALIZED and latest-wins: the page's default autoload can still be
     * mid-flight when the user drag-drops — unserialized, the slower default finished
     * last and silently replaced the dropped file. */
    load(url: string, name?: string): Promise<void>;
    private doLoad;
    /** Switch build mode (rebuilds the current schematic). */
    setMode(mode: ViewerMode): Promise<void>;
    get activeMode(): string;
    get raw(): SchematicRenderer | null;
    dispose(): void;
}
export declare function createSchematicViewer(container: HTMLElement, options?: SchematicViewerOptions): SchematicViewer;
//# sourceMappingURL=viewer.d.ts.map