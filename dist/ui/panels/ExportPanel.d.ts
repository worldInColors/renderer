import { BasePanel, BasePanelOptions } from "./BasePanel";
import { ExportFormat, ExportQuality, NormalMode } from "../../types/export";
export interface ExportSettings {
    filename: string;
    format: ExportFormat;
    quality: ExportQuality;
    normalMode: NormalMode;
    centerAtOrigin: boolean;
    optimizeMesh: boolean;
    embedTextures: boolean;
    forceOpaque: boolean;
}
/**
 * Export panel for exporting schematics to 3D formats.
 */
export declare class ExportPanel extends BasePanel {
    private exporter;
    private settings;
    private isExporting;
    private filenameInput;
    private progressSection;
    private progressBar;
    private progressText;
    private exportButton;
    constructor(options: BasePanelOptions);
    protected buildContent(): void;
    private createFilenameSection;
    private createFormatSection;
    private createQualitySection;
    private createOptionsSection;
    private createProgressSection;
    private createFooter;
    startExport(): Promise<void>;
    getSettings(): ExportSettings;
    setFormat(format: ExportFormat): void;
    setQuality(quality: ExportQuality): void;
}
//# sourceMappingURL=ExportPanel.d.ts.map