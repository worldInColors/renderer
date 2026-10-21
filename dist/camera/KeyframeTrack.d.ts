import * as THREE from "three";
export type InterpolationMode = "linear" | "smoothstep" | "ease-in" | "ease-out" | "ease-in-out" | "catmull-rom";
export interface CameraKeyframe {
    /** Position on the timeline (0-100) */
    position: number;
    /** Camera position */
    cameraPos: THREE.Vector3;
    /** Camera look-at target */
    cameraTarget: THREE.Vector3;
    /** Optional label */
    label?: string;
}
export interface KeyframeResult {
    position: THREE.Vector3;
    target: THREE.Vector3;
}
/**
 * KeyframeTrack provides camera interpolation through a sequence of keyframes.
 * Supports multiple interpolation modes including Catmull-Rom splines.
 *
 * Usage:
 * ```ts
 * const track = new KeyframeTrack("catmull-rom");
 * track.addKeyframe(0, cameraPos1, target1);
 * track.addKeyframe(50, cameraPos2, target2);
 * track.addKeyframe(100, cameraPos3, target3);
 *
 * const { position, target } = track.getAt(25); // interpolated at 25%
 * ```
 */
export declare class KeyframeTrack {
    private keyframes;
    private _interpolation;
    constructor(interpolation?: InterpolationMode);
    /** Get/set interpolation mode */
    get interpolation(): InterpolationMode;
    set interpolation(mode: InterpolationMode);
    /** Number of keyframes */
    get length(): number;
    /** Add a keyframe. Automatically sorts by position. */
    addKeyframe(position: number, cameraPos: THREE.Vector3, cameraTarget: THREE.Vector3, label?: string): void;
    /** Remove keyframe at index */
    removeKeyframe(index: number): void;
    /** Clear all keyframes */
    clear(): void;
    /** Get all keyframes (read-only copy) */
    getKeyframes(): readonly CameraKeyframe[];
    /** Get a keyframe by index */
    getKeyframe(index: number): CameraKeyframe | undefined;
    /** Update a keyframe's camera data without changing its position */
    updateKeyframe(index: number, cameraPos: THREE.Vector3, cameraTarget: THREE.Vector3): void;
    /** Move a keyframe to a new timeline position */
    setKeyframePosition(index: number, position: number): void;
    /** Lock first keyframe to 0 and last to 100 */
    enforceFirstLast(): void;
    /**
     * Interpolate camera state at a given percentage (0-100).
     * Returns null if fewer than 2 keyframes exist.
     */
    getAt(pct: number): KeyframeResult | null;
    /** Apply easing to a 0-1 value */
    private applyEasing;
    /** Segment-based interpolation with easing */
    private segmentInterpolateAt;
    /** Catmull-Rom spline interpolation through all keyframes */
    private catmullRomAt;
    /**
     * Sample the track at regular intervals.
     * Useful for building path visualizations.
     * @param samples - Number of sample points
     * @returns Array of interpolated positions
     */
    sample(samples?: number): KeyframeResult[];
    /**
     * Serialize the track to a plain object for storage/transfer.
     */
    toJSON(): {
        interpolation: string;
        keyframes: Array<{
            position: number;
            cameraPos: number[];
            cameraTarget: number[];
            label?: string;
        }>;
    };
    /**
     * Load from a serialized object.
     */
    static fromJSON(data: {
        interpolation?: string;
        keyframes: Array<{
            position: number;
            cameraPos: number[];
            cameraTarget: number[];
            label?: string;
        }>;
    }): KeyframeTrack;
}
//# sourceMappingURL=KeyframeTrack.d.ts.map