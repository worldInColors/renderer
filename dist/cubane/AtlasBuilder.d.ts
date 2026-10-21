import { PackedTexture } from "./types";
export interface AtlasCacheData {
    cacheKey: string;
    imageData: Uint8ClampedArray;
    width: number;
    height: number;
    uvMap: Record<string, {
        u: number;
        v: number;
        width: number;
        height: number;
    }>;
    packingEfficiency: number;
    timestamp: number;
    textureCount: number;
}
export interface AtlasCache {
    atlasImageData: string;
    uvMap: Record<string, {
        u: number;
        v: number;
        width: number;
        height: number;
    }>;
    packingEfficiency: number;
    timestamp: number;
    resourcePackHash: string;
    textureCount: number;
}
export declare class AtlasBuilder {
    private atlasSize;
    private padding;
    constructor(atlasSize?: number, padding?: number);
    /**
     * Build texture atlas with caching support
     */
    buildAtlas(textures: {
        path: string;
        image: HTMLImageElement | ImageBitmap;
    }[], cacheKey?: string): Promise<{
        atlas: HTMLCanvasElement;
        uvMap: Map<string, {
            u: number;
            v: number;
            width: number;
            height: number;
        }>;
        packingEfficiency: number;
        fromCache: boolean;
    }>;
    /**
     * Try to load atlas from IndexedDB cache (fast path)
     */
    private loadFromCache;
    /**
     * Legacy localStorage loader (for migration)
     */
    private loadFromLocalStorage;
    /**
     * Migrate legacy localStorage cache to IndexedDB
     */
    private migrateToIndexedDB;
    /**
     * Save atlas to IndexedDB cache (fast)
     */
    private saveToCache;
    /**
     * Delete from IndexedDB cache
     */
    private deleteFromCache;
    /**
     * Build a new atlas (original logic)
     * Supports both HTMLImageElement and ImageBitmap for flexibility
     */
    private buildNewAtlas;
    /**
     * Clear all atlas caches (both IndexedDB and localStorage)
     */
    static clearAllCaches(): Promise<void>;
    /**
     * Get cache info for debugging
     */
    static getCacheInfo(): Promise<{
        key: string;
        size: string;
        age: string;
        textureCount: number;
        storage: string;
    }[]>;
    private sortTexturesForPacking;
    private packWithStrategy;
    private packTextures;
    private findNode;
    private splitNode;
    private calculatePackingEfficiency;
    private createAtlasCanvas;
    visualizePacking(packedTextures: PackedTexture[]): HTMLCanvasElement;
}
//# sourceMappingURL=AtlasBuilder.d.ts.map