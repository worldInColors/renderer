import type { SchematicWrapper } from "../nucleationExports";
import type { GetBlock } from "./WaterMesher";
interface PaletteEntry {
    name?: string;
    Name?: string;
    properties?: Record<string, string>;
    Properties?: Record<string, string>;
}
export interface FluidStateFilter {
    bounds?: {
        enabled?: boolean;
        min: {
            x: number;
            y: number;
            z: number;
        };
        max: {
            x: number;
            y: number;
            z: number;
        };
    };
    hiddenCells?: ReadonlySet<string>;
}
/** Serialize each palette entry once, including fluid levels and waterlogged state. */
export declare function fluidPaletteStates(palette: readonly PaletteEntry[]): string[];
/** Build the fluid scan's lookup with chunk-level WASM calls, never per-cell wrappers. */
export declare function createFluidStateLookup(schematic: Pick<SchematicWrapper, "create_lazy_chunk_iterator">, states: readonly string[], sx: number, sy: number, sz: number, { bounds, hiddenCells }?: FluidStateFilter): GetBlock;
export {};
//# sourceMappingURL=FluidStateLookup.d.ts.map