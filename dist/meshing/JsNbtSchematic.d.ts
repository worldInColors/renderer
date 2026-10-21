/**
 * Duck-typed SchematicWrapper replacement (the manager accepts anything whose
 * constructor name contains "SchematicWrapper"). Parses ONLY what meshing needs:
 * Regions→<first>→Size/Position/BlockStatePalette/BlockStates.
 */
export declare class SchematicWrapper {
    private grid;
    private sx;
    private sy;
    private sz;
    private palette;
    private longs;
    constructor(rawNbt: ArrayBuffer);
    free(): void;
    /** Rebuild an instance from plain worker-posted data (see nbtParseWorker): parsing
     * runs off the main thread, so the boss-sized NBT read no longer freezes the tab. */
    static fromParsed(data: {
        grid: Uint32Array;
        palette: any[];
        sx: number;
        sy: number;
        sz: number;
        name?: string;
    }): SchematicWrapper;
    get_dimensions(): [number, number, number];
    get_block_count(): number;
    get_block(x: number, y: number, z: number): string | undefined;
    get_block_with_properties(x: number, y: number, z: number): {
        properties: () => Record<string, string>;
        name: () => string;
    } | null;
    get_all_palettes(): {
        default: {
            name: string;
            Name?: string;
            properties?: any;
            stateString: string;
            props: Record<string, string>;
        }[];
    };
    get_palette(): {
        name: string;
        Name?: string;
        properties?: any;
        stateString: string;
        props: Record<string, string>;
    }[];
    get_all_block_entities(): never[];
    getDefinitionRegionNames(): never[];
    get_all_entities(): never[];
    create_simulation_world(): {
        get_redstone_power: () => number;
        free(): void;
    };
    get_tight_dimensions(): [number, number, number];
    get_tight_bounds_min(): [number, number, number];
    get_tight_bounds_max(): [number, number, number];
    get_enclosing_size(): [number, number, number];
    get_name(): string;
    get_region_count(): number;
    private _tight;
    private tightBounds;
    to_litematic(): void;
    create_lazy_chunk_iterator(cw: number, ch: number, cl: number, _mode: string, _ox: number, _oy: number, _oz: number): {
        total_chunks: () => number;
        has_next: () => boolean;
        next: () => {
            chunkX: number;
            chunkY: number;
            chunkZ: number;
            blocks: Int32Array<ArrayBuffer>;
        };
    };
}
//# sourceMappingURL=JsNbtSchematic.d.ts.map