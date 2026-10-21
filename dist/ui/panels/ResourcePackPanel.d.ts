import { BasePanel, BasePanelOptions } from "./BasePanel";
interface PackInfo {
    id: string;
    name: string;
    enabled: boolean;
    textureCount: number;
    priority: number;
    icon: string | null;
}
/**
 * Resource pack panel for managing texture packs.
 */
export declare class ResourcePackPanel extends BasePanel {
    private packList;
    private draggedItem;
    constructor(options: BasePanelOptions);
    protected buildContent(): void;
    protected onActivate(): void;
    private createPackListSection;
    private createActionsSection;
    private refreshPackList;
    /** Opens a file picker and loads the chosen pack via the renderer. */
    private promptLoadPack;
    private getPacksInfo;
    private createPackItem;
    private reorderPacks;
    getPackList(): PackInfo[];
    refresh(): void;
}
export {};
//# sourceMappingURL=ResourcePackPanel.d.ts.map