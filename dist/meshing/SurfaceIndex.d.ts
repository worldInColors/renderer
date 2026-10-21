import type { SchematicWrapper } from "../nucleationExports";
import type { FluidStateFilter } from "./FluidStateLookup";
export interface SurfaceCell {
    x: number;
    y: number;
    z: number;
    state: string;
}
export declare const surfaceSectionKey: (x: number, y: number, z: number) => string;
/** Only glass and portal cells are retained. Empty space never allocates a dense grid. */
export declare class SurfaceIndex {
    readonly sections: Map<string, Map<number, SurfaceCell>>;
    private lastKey;
    private lastSection;
    set(x: number, y: number, z: number, state: string): void;
    readonly getBlock: (x: number, y: number, z: number) => string;
}
export declare function surfaceCellVisible(x: number, y: number, z: number, { bounds, hiddenCells }: FluidStateFilter): boolean;
export declare function affectedSurfaceSections(positions: Iterable<{
    x: number;
    y: number;
    z: number;
}>): Set<string>;
export declare function readSurfaceIndex(schematic: Pick<SchematicWrapper, "create_lazy_chunk_iterator">, states: readonly string[], filter: FluidStateFilter): Promise<SurfaceIndex>;
//# sourceMappingURL=SurfaceIndex.d.ts.map