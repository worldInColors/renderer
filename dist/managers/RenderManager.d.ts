import * as THREE from "three";
import { SchematicRenderer } from "../SchematicRenderer";
type AnyRenderer = THREE.WebGLRenderer | any;
export declare class RenderManager {
    private schematicRenderer;
    renderer: AnyRenderer;
    private composer;
    private _postProcessing;
    private passes;
    private eventEmitter;
    private pmremGenerator;
    private isRendering;
    private hdriPath;
    private hdriBackgroundOnly;
    private currentEnvMap;
    private disposed;
    private contextLost;
    private initialSizeSet;
    /**
     * Device pixel ratio used to size every framebuffer, clamped (default 2) to keep
     * GPU memory bounded on high-DPR mobile screens and avoid context-loss crashes.
     */
    private get pixelRatio();
    private resizeTimeout;
    private usesSharedRenderer;
    private blitCtx;
    private renderRequested;
    private _isWebGPU;
    private _webgpuInitialized;
    private inspector;
    private originalBackground;
    private isometricBackground;
    private _alphaMode;
    private _opaqueComposer;
    private _alphaComposer;
    private _backgroundMode;
    private _forceBackground;
    private _imageBackground;
    private ssaoPresets;
    constructor(schematicRenderer: SchematicRenderer);
    /**
     * Async initialization - must be called after constructor
     */
    initialize(): Promise<void>;
    /**
     * Check if WebGPU is supported in the current browser
     */
    private checkWebGPUSupport;
    /**
     * Check if currently using WebGPU renderer
     */
    get isWebGPU(): boolean;
    /**
     * Get the Three.js Inspector (WebGPU only)
     */
    getInspector(): any;
    /**
     * Setup simple environment lighting for WebGPU mode
     * Since HDRI/PMREMGenerator isn't compatible with WebGPU, we enhance
     * the scene lighting to compensate for the lack of environment maps.
     */
    private setupWebGPUEnvironment;
    private setInitialSize;
    /**
     * Initialize WebGPU Renderer
     */
    private initWebGPURenderer;
    /**
     * Initialize WebGL Renderer (original code)
     */
    private initWebGLRenderer;
    private initComposer;
    /**
     * Handle camera type changes to manage HDRI background and SSAO appropriately
     */
    private handleCameraChange;
    /**
     * Check if current camera is orthographic (isometric)
     */
    private isOrthographicCamera;
    setupHDRIBackground(hdriPath: string, backgroundOnly?: boolean): void;
    private isPMREMGeneratorDisposed;
    private loadHDRI;
    private loadHDRIWithCache;
    private applyHDRITexture;
    /**
     * Set the background color for isometric view
     */
    setIsometricBackgroundColor(color: THREE.ColorRepresentation): void;
    /**
     * Get the current isometric background color
     */
    getIsometricBackgroundColor(): THREE.Color;
    private handleContextLost;
    private handleContextRestored;
    private initDefaultPasses;
    private setupEventListeners;
    updateCanvasSize(): void;
    enableEffect(effectName: string): void;
    disableEffect(effectName: string): void;
    setGamma(value: number): void;
    /**
     * Update the tilt-shift strength at runtime. `amount` is 0..1 where 0
     * leaves nearly the whole frame in focus and 1 is a thin focus band with
     * dramatic blur outside.
     */
    /**
     * Pending amount for tilt-shift when the effect doesn't exist yet (the
     * user moved the slider before turning the effect on).
     */
    private _pendingTiltShiftAmount;
    setTiltShiftAmount(amount: number): void;
    /**
     * Read focus params back off the effect's uniforms and push them into the
     * gizmo so the visual stays in sync with the shader.
     */
    private updateTiltShiftGizmo;
    /** Show or hide the tilt-shift focus-plane gizmo. */
    setTiltShiftGizmoVisible(visible: boolean): void;
    /**
     * Move the tilt-shift focus point to a specific world-space position.
     * Used by the click-to-focus picker after a raycast hit.
     */
    setTiltShiftFocusPoint(point: THREE.Vector3): void;
    /**
     * Tilt the focus plane by `pitchDeg` (around camera right) and
     * `yawDeg` (around camera up). Pitch is the actual Scheimpflug tilt;
     * a non-zero value is what makes this different from regular DOF.
     */
    setTiltShiftTilt(pitchDeg: number, yawDeg: number): void;
    private _pendingTiltPitch;
    private _pendingTiltYaw;
    private tiltShiftGizmo;
    private tiltShiftGizmoVisible;
    private _focusPickRaycaster;
    /**
     * Arm a one-shot click handler that raycasts the next canvas click into
     * the schematic, computes the world distance from camera to the hit
     * point, and sets that as the tilt-shift focus plane. Escape cancels.
     */
    pickTiltShiftFocus(): void;
    /**
     * Raycast through the screen point into all loaded schematics; if any
     * geometry is hit, set the tilt-shift focus distance to the hit's
     * camera-space depth.
     */
    private focusTiltShiftOnScreenPoint;
    /**
     * Compute a sensible initial focus point in world space — the centre of
     * the first loaded schematic when available, falling back to the camera's
     * lookAt target or origin.
     */
    private computeSubjectWorldPosition;
    /**
     * Enable or disable the depth-of-field/tilt-shift pass. The first call
     * with `true` lazily constructs the effect + pass (DepthOfFieldEffect is
     * expensive and needs a depth texture, so we only allocate it when
     * actually used). Subsequent toggles just flip `pass.enabled` and move
     * `renderToScreen` to whichever pass is the final visible one.
     */
    setTiltShiftEnabled(enabled: boolean): void;
    /**
     * Build the focus-plane gizmo and attach it to the scene the first time
     * tilt-shift is enabled. Subsequent calls are no-ops.
     */
    private ensureTiltShiftGizmo;
    /**
     * Enable or disable SSAO at runtime
     * Useful for auto-disabling on small schematics or performance optimization
     */
    setSSAOEnabled(enabled: boolean): void;
    /**
     * Check if SSAO is currently enabled
     */
    isSSAOEnabled(): boolean;
    setSSAOParameters(params: {
        aoRadius?: number;
        distanceFalloff?: number;
        intensity?: number;
        qualityMode?: "Performance" | "Low" | "Medium" | "High" | "Ultra";
    }): void;
    /**
     * Customize SSAO presets for different camera modes
     * @param mode - Camera mode ('perspective' or 'isometric')
     * @param params - SSAO parameters to apply for this mode
     */
    setSSAOPreset(mode: "perspective" | "isometric", params: {
        aoRadius?: number;
        distanceFalloff?: number;
        intensity?: number;
    }): void;
    /**
     * Get current SSAO presets
     */
    getSSAOPresets(): {
        perspective: {
            aoRadius: number;
            distanceFalloff: number;
            intensity: number;
        };
        isometric: {
            aoRadius: number;
            distanceFalloff: number;
            intensity: number;
        };
    };
    renderSingleFrameAndGetStats(): {
        renderTimeMs: number;
        rendererInfo: THREE.WebGLInfo | null;
    };
    /**
     * Render-and-blit: size the shared WebGL renderer to this view, render this
     * view's scene (through its own composer, so post-processing/gamma is preserved),
     * then copy the GL canvas onto this view's visible 2D canvas.
     */
    private renderSharedAndBlit;
    render(): void;
    requestRender(): void;
    resize(width: number, height: number): void;
    updateCamera(camera: THREE.Camera): void;
    getRenderer(): AnyRenderer;
    getEffect(effectName: string): any;
    dispose(): void;
    /**
     * Enable or disable alpha-aware rendering for transparent backgrounds.
     * When enabled, creates an EffectComposer with { alpha: true } that preserves
     * the alpha channel through the post-processing pipeline (gamma, SMAA, etc.).
     */
    setAlphaMode(enabled: boolean): Promise<void>;
    /** Returns whether alpha mode is currently active */
    isAlphaMode(): boolean;
    /**
     * Set the background rendering mode.
     * @param mode - The background mode
     * @param options - Mode-specific options
     */
    setBackgroundMode(mode: "hdri" | "solid" | "transparent" | "image", options?: {
        /** HDRI file path (for "hdri" mode) */
        hdriPath?: string;
        /** Whether HDRI is background-only vs environment+background (default true) */
        hdriBackgroundOnly?: boolean;
        /** Solid color (for "solid" mode) */
        color?: THREE.ColorRepresentation;
        /** Image texture (for "image" mode) */
        imageTexture?: THREE.Texture;
        /** Force this background even in isometric mode (default false) */
        force?: boolean;
    }): Promise<void>;
    /** Get current background mode */
    getBackgroundMode(): string;
}
export {};
//# sourceMappingURL=RenderManager.d.ts.map