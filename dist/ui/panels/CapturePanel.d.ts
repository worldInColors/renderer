import { BasePanel, BasePanelOptions } from "./BasePanel";
export interface ScreenshotSettings {
    width: number;
    height: number;
    quality: number;
    format: "image/png" | "image/jpeg";
}
export interface RecordingSettings {
    width: number;
    height: number;
    frameRate: number;
    duration: number;
    encodingPreset: "ultrafast" | "superfast" | "veryfast" | "faster" | "fast" | "medium";
    quality: "low" | "medium" | "high";
}
/**
 * Capture panel for screenshots and video recording.
 */
export declare class CapturePanel extends BasePanel {
    private screenshotSettings;
    private recordingSettings;
    private pathVisible;
    private isRecording;
    private customSizeContainer;
    private recordingStatus;
    private progressBar;
    private progressText;
    constructor(options: BasePanelOptions);
    protected buildContent(): void;
    private createScreenshotSection;
    private createCameraPathSection;
    private createRecordingSection;
    private updatePathParameter;
    private refreshPathVisualization;
    private previewPath;
    takeScreenshot(): Promise<Blob | null>;
    startRecording(): Promise<void>;
    getScreenshotSettings(): ScreenshotSettings;
    getRecordingSettings(): RecordingSettings;
}
//# sourceMappingURL=CapturePanel.d.ts.map