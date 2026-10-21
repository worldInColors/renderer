import * as THREE from "three";
import { EventEmitter } from "events";
export interface ShulkrControlsOptions {
    baseSpeed?: number;
    smoothing?: number;
}
export declare class ShulkrControls extends EventEmitter {
    /** Returns the camera that is currently rendering (may change with presets) */
    private getCamera;
    /** Returns the active orbit controls (target must move with the camera), or null */
    private getActiveControls;
    private keys;
    private velocity;
    private enabled;
    private disposed;
    speedMultiplier: number;
    baseSpeed: number;
    smoothing: number;
    constructor(getCamera: () => THREE.Camera, getActiveControls: () => any, options?: ShulkrControlsOptions);
    setEnabled(on: boolean): void;
    isEnabled(): boolean;
    /** Blocks/sec at multiplier 1 (slider binding) */
    setSpeed(mult: number): void;
    private onKeyDown;
    private onKeyUp;
    private onBlur;
    attach(): void;
    /** Per-frame update — call from the camera update loop. dt in seconds. */
    update(dt: number): void;
    dispose(): void;
}
//# sourceMappingURL=ShulkrControls.d.ts.map