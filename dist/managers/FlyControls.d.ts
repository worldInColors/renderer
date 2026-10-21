import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import { EventEmitter } from "events";
export interface FlyControlsOptions {
    /** Movement speed in units per second */
    moveSpeed?: number;
    /** Sprint multiplier when holding shift */
    sprintMultiplier?: number;
    /** Look sensitivity (mouse movement) */
    lookSensitivity?: number;
    /** Keybinds for movement */
    keybinds?: Partial<FlyControlsKeybinds>;
}
export interface FlyControlsKeybinds {
    forward: string;
    backward: string;
    left: string;
    right: string;
    up: string;
    down: string;
    sprint: string;
}
/**
 * First-person fly controls for navigating 3D scenes.
 * Click to enter fly mode, ESC to exit.
 * WASD to move, Space/C for up/down, Shift to sprint.
 */
export declare class FlyControls extends EventEmitter {
    enabled: boolean;
    isLocked: boolean;
    private pointerLockControls;
    private camera;
    private domElement;
    private moveSpeed;
    private sprintMultiplier;
    private keybinds;
    private pressedKeys;
    private velocity;
    private direction;
    private overlayElement;
    constructor(camera: THREE.Camera, domElement: HTMLElement, options?: FlyControlsOptions);
    private setupEventListeners;
    private onCanvasClick;
    private onKeyDown;
    private onKeyUp;
    private onOverlayClick;
    private createOverlay;
    private showOverlay;
    /**
     * Show or hide the fly controls overlay
     * @param visible Whether the overlay should be visible
     */
    setOverlayVisible(visible: boolean): void;
    /**
     * Lock the pointer and enter fly mode
     */
    lock(): void;
    /**
     * Unlock the pointer and exit fly mode
     */
    unlock(): void;
    /**
     * Toggle pointer lock
     */
    toggle(): void;
    /**
     * Update movement - call this every frame
     */
    update(deltaTime: number): void;
    getMoveSpeed(): number;
    setMoveSpeed(speed: number): void;
    getSprintMultiplier(): number;
    setSprintMultiplier(multiplier: number): void;
    getKeybinds(): FlyControlsKeybinds;
    setKeybinds(keybinds: Partial<FlyControlsKeybinds>): void;
    /**
     * Get the underlying PointerLockControls for advanced usage
     */
    getPointerLockControls(): PointerLockControls;
    /**
     * Clean up resources
     */
    dispose(): void;
}
//# sourceMappingURL=FlyControls.d.ts.map