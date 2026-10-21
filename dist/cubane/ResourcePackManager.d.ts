import JSZip from "jszip";
import { ResourcePackInfo, PackFetchOptions, PackValidationResult, AssetConflict, PackAssetList, PackCacheInfo, MemoryStats, PackConfiguration, PackEventType, PackEventCallback } from "./types";
/**
 * ResourcePackManager - Complete resource pack management with events, caching, and priority support
 */
export declare class ResourcePackManager {
    private packs;
    private packOrder;
    private listeners;
    private db;
    private dbName;
    private dbVersion;
    private autoRebuild;
    private batchUpdateDepth;
    private pendingRebuild;
    private initialized;
    private initPromise;
    private onAtlasRebuildNeeded;
    private onMeshRebuildNeeded;
    constructor();
    private initDatabase;
    private ensureInitialized;
    /**
     * Subscribe to an event
     */
    on<T extends PackEventType>(event: T, callback: PackEventCallback<T>): void;
    /**
     * Unsubscribe from an event
     */
    off<T extends PackEventType>(event: T, callback: PackEventCallback<T>): void;
    /**
     * Subscribe to an event once
     */
    once<T extends PackEventType>(event: T, callback: PackEventCallback<T>): void;
    /**
     * Emit an event to all listeners
     */
    private emit;
    /**
     * Set callback for when atlas needs rebuilding
     */
    setAtlasRebuildCallback(callback: () => Promise<void>): void;
    /**
     * Set callback for when meshes need rebuilding
     */
    setMeshRebuildCallback(callback: () => void): void;
    /**
     * Load a resource pack from a URL
     */
    loadPackFromUrl(url: string, options?: PackFetchOptions): Promise<string>;
    /**
     * Load a resource pack from a Blob
     */
    loadPackFromBlob(blob: Blob, name?: string): Promise<string>;
    /**
     * Load a resource pack from a File (drag-drop, file input)
     */
    loadPackFromFile(file: File): Promise<string>;
    /**
     * Internal pack loading logic
     */
    private loadPackInternal;
    /**
     * Fetch with progress tracking
     */
    private fetchWithProgress;
    /**
     * Remove a resource pack
     */
    removePack(packId: string): Promise<void>;
    /**
     * Remove all resource packs
     */
    removeAllPacks(): Promise<void>;
    /**
     * Enable a resource pack
     */
    enablePack(packId: string): Promise<void>;
    /**
     * Disable a resource pack
     */
    disablePack(packId: string): Promise<void>;
    /**
     * Toggle a resource pack's enabled state
     */
    togglePack(packId: string): Promise<boolean>;
    /**
     * Set a pack's enabled state
     */
    setPackEnabled(packId: string, enabled: boolean): Promise<void>;
    /**
     * Set a pack's priority
     */
    setPackPriority(packId: string, priority: number): Promise<void>;
    /**
     * Move a pack up in priority (increase priority)
     */
    movePackUp(packId: string): Promise<void>;
    /**
     * Move a pack down in priority (decrease priority)
     */
    movePackDown(packId: string): Promise<void>;
    /**
     * Reorder packs by providing the full order array
     */
    reorderPacks(packIds: string[]): Promise<void>;
    /**
     * Get info for a specific pack
     */
    getPack(packId: string): ResourcePackInfo | null;
    /**
     * Get all packs sorted by priority (lowest to highest)
     */
    getAllPacks(): ResourcePackInfo[];
    /**
     * Get only enabled packs sorted by priority
     */
    getEnabledPacks(): ResourcePackInfo[];
    /**
     * Get total pack count
     */
    getPackCount(): number;
    /**
     * Get the ZIP for a pack (for AssetLoader integration)
     */
    getPackZip(packId: string): JSZip | null;
    /**
     * Get enabled packs in priority order (for AssetLoader)
     */
    getEnabledPacksInOrder(): Array<{
        id: string;
        zip: JSZip;
    }>;
    /**
     * Get assets provided by a specific pack
     */
    getPackAssets(packId: string): Promise<PackAssetList>;
    /**
     * Get which pack provides a specific asset
     */
    getAssetSource(assetPath: string, type: "texture" | "blockstate" | "model"): string | null;
    /**
     * Get all asset conflicts (assets provided by multiple packs)
     */
    getAssetConflicts(): Promise<AssetConflict[]>;
    /**
     * Preview a texture from a specific pack
     */
    previewTexture(packId: string, texturePath: string): Promise<string | null>;
    /**
     * Begin a batch update (pauses auto-rebuild)
     */
    beginBatchUpdate(): void;
    /**
     * End a batch update (commits changes, triggers rebuild if needed)
     */
    endBatchUpdate(): Promise<void>;
    /**
     * Set auto-rebuild mode
     */
    setAutoRebuild(enabled: boolean): void;
    /**
     * Manually trigger atlas rebuild
     */
    rebuildAtlas(): Promise<void>;
    /**
     * Trigger rebuild if appropriate
     */
    private triggerRebuildIfNeeded;
    /**
     * Actually trigger the rebuild
     */
    private triggerRebuild;
    /**
     * Save current state to IndexedDB
     */
    saveState(): Promise<void>;
    /**
     * Load state from IndexedDB
     */
    loadState(): Promise<boolean>;
    /**
     * Export configuration
     */
    exportConfig(): PackConfiguration;
    /**
     * Import configuration (requires packs to be loaded separately)
     */
    importConfig(config: PackConfiguration): Promise<void>;
    /**
     * Get total cache size
     */
    getCacheSize(): Promise<number>;
    /**
     * Get cache info for a specific pack
     */
    getPackCacheInfo(packId: string): Promise<PackCacheInfo>;
    /**
     * Clear cache for a specific pack
     */
    clearPackCache(packId: string): Promise<void>;
    /**
     * Clear all cache
     */
    clearAllCache(): Promise<void>;
    /**
     * Check if a pack is cached
     */
    isPackCached(sourceUrl: string): Promise<boolean>;
    /**
     * Validate a pack without loading it
     */
    validatePack(blob: Blob): Promise<PackValidationResult>;
    /**
     * Get memory usage statistics
     */
    getMemoryUsage(): MemoryStats;
    /**
     * Unload pack data from memory (keeps metadata)
     */
    unloadPackData(_packId: string): void;
    /**
     * Dispose of all resources
     */
    dispose(): void;
    private generatePackId;
    private calculateHash;
    private getNextPriority;
    private insertPackByPriority;
    private extractPackMetadata;
    private blobToDataUrl;
    private dbPut;
    private dbGet;
    private dbDelete;
    private cachePackBlob;
    private getPackFromCache;
}
//# sourceMappingURL=ResourcePackManager.d.ts.map