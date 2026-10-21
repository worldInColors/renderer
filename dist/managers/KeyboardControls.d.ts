import * as THREE from "three";
import { KeyboardControlsOptions } from "../SchematicRendererOptions";
/**
 * Keybind configuration for keyboard controls
 */
export interface KeybindConfig {
    forward: string;
    backward: string;
    left: string;
    right: string;
    up: string;
    down: string;
    sprint: string;
}
export declare class KeyboardControls {
    private enabled;
    private flySpeed;
    private sprintMultiplier;
    private keybinds;
    private pressedKeys;
    private isRightMouseDown;
    private camera;
    private canvas;
    private velocity;
    private direction;
    constructor(camera: THREE.Camera, canvas: HTMLCanvasElement, options?: KeyboardControlsOptions);
    /**
     * Update fly speed at runtime
     */
    setFlySpeed(speed: number): void;
    /**
     * Get current fly speed
     */
    getFlySpeed(): number;
    /**
     * Update sprint multiplier at runtime
     */
    setSprintMultiplier(multiplier: number): void;
    /**
     * Get current sprint multiplier
     */
    getSprintMultiplier(): number;
    /**
     * Get current keybind configuration
     */
    getKeybinds(): KeybindConfig;
    /**
     * Update keybinds at runtime
     * @param newKeybinds Partial keybind configuration to merge
     */
    setKeybinds(newKeybinds: Partial<KeybindConfig>): void;
    /**
     * Reset keybinds to defaults
     */
    resetKeybinds(): void;
    /**
     * Enable or disable keyboard controls
     */
    setEnabled(enabled: boolean): void;
    /**
     * Check if keyboard controls are enabled
     */
    isEnabled(): boolean;
    private bindEvents;
    private onKeyDown;
    private onKeyUp;
    private onMouseDown;
    private onMouseUp;
    private onContextMenu;
    private onBlur;
    /**
     * Check if a specific key is pressed
     */
    private isKeyPressed;
    /**
     * Update camera position based on keyboard input
     * Should be called every frame with deltaTime
     */
    update(deltaTime: number): void;
    /**
     * Clean up event listeners
     */
    dispose(): void;
}
//# sourceMappingURL=KeyboardControls.d.ts.map