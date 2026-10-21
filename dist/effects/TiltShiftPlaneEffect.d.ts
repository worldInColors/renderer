import { Effect } from "postprocessing";
import { Vector3, type Camera } from "three";
export interface TiltShiftPlaneOptions {
    /** Focus point in world space. Defaults to the origin. */
    focusPoint?: Vector3;
    /** Plane normal in world space. Defaults to camera-forward when omitted. */
    focusNormal?: Vector3;
    /** Half-width of the in-focus slab in world units. Default 2. */
    focusRange?: number;
    /** Max sample radius in UV units (so 0.02 ≈ 2% of screen). Default 0.01. */
    blurStrength?: number;
}
export declare class TiltShiftPlaneEffect extends Effect {
    private camera;
    constructor(camera: Camera, options?: TiltShiftPlaneOptions);
    /**
     * Recompute the inverse view-projection matrix each frame. The shader
     * uses it to convert sampled depths into world positions.
     */
    update(_renderer: unknown, _inputBuffer: unknown, _deltaTime: number): void;
    setFocusPoint(p: Vector3): void;
    setFocusNormal(n: Vector3): void;
    setFocusRange(r: number): void;
    setBlurStrength(s: number): void;
    /**
     * Convenience: tilt the focus plane by `pitchDeg`/`yawDeg` relative to the
     * current camera frame. Pitch rotates around the camera's local right
     * axis, yaw rotates around the camera's local up axis. Pitch ≠ 0 is the
     * actual Scheimpflug "tilt" that produces the diagonal focus plane.
     */
    setTiltAngles(pitchDeg: number, yawDeg: number): void;
}
//# sourceMappingURL=TiltShiftPlaneEffect.d.ts.map