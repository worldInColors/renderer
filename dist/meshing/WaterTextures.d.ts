import * as THREE from "three";
export declare const WATER_OPACITY = 0.6;
/** Tint vanilla grayscale masks without changing resource-pack alpha or colored water. */
export declare function tintWaterPixels(pixels: Uint8ClampedArray): void;
/** One repeatable layer per square animation frame, including single-frame packs. */
export declare function createWaterFrameTexture(pixels: Uint8ClampedArray, width: number, height: number): THREE.DataArrayTexture;
//# sourceMappingURL=WaterTextures.d.ts.map