import { BasePanel, BasePanelOptions } from "./BasePanel";
interface PerformanceMetrics {
    fps: number;
    frameTime: number;
    drawCalls: number;
    triangles: number;
    geometries: number;
    textures: number;
    memory: number;
}
/**
 * Performance panel for monitoring render performance.
 */
export declare class PerformancePanel extends BasePanel {
    private updateInterval;
    private metricsContainer;
    private metricElements;
    private autoUpdate;
    constructor(options: BasePanelOptions);
    protected buildContent(): void;
    private createMetricsSection;
    private createMetricCard;
    private createSettingsSection;
    protected onActivate(): void;
    protected onDeactivate(): void;
    private startUpdating;
    private stopUpdating;
    private updateMetrics;
    private getMemoryUsage;
    private displayMetrics;
    getMetrics(): PerformanceMetrics;
    setAutoUpdate(enabled: boolean): void;
    dispose(): void;
}
export {};
//# sourceMappingURL=PerformancePanel.d.ts.map