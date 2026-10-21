import { AssetLoader } from "./AssetLoader";
import { ModelData, Block } from "./types";
export declare class ModelResolver {
    private assetLoader;
    constructor(assetLoader: AssetLoader);
    /**
     * Resolve a block to its models
     */
    resolveBlockModel(block: Block): Promise<ModelData[]>;
    private createLiquidModelData;
    private createModelData;
    private matchesCondition;
}
//# sourceMappingURL=ModelResolver.d.ts.map