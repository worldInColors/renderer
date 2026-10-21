import type { Cubane } from "../cubane/Cubane";
import type { DefaultPackCallback, ResourcePackManager } from "../managers/ResourcePackManager";
/** Reconcile persisted packs without rebuilding an already matching cached atlas. */
export declare function initializeResourcePacks(cubane: Cubane, manager: ResourcePackManager, defaults?: Record<string, DefaultPackCallback>): Promise<Blob[]>;
//# sourceMappingURL=initializeResourcePacks.d.ts.map