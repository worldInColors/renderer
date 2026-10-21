import { BasePanel, BasePanelOptions } from "./BasePanel";
export interface RenderSettings {
    backgroundEnabled: boolean;
    hdriEnabled: boolean;
    backgroundColor: string;
    cameraMode: "perspective" | "isometric" | "perspective_fpv";
    isometricPitch: number;
    isometricYaw: number;
    ssaoEnabled: boolean;
    ssaoIntensity: number;
    ssaoRadius: number;
    smaaEnabled: boolean;
    gammaEnabled: boolean;
    gammaValue: number;
    tiltShiftEnabled: boolean;
    tiltShiftAmount: number;
    tiltShiftPitch: number;
    tiltShiftYaw: number;
    tiltShiftGizmoVisible: boolean;
    slicerVisible: boolean;
    showGrid: boolean;
    showAxes: boolean;
    ambientLightIntensity: number;
    directionalLightIntensity: number;
    autoOrbitEnabled: boolean;
    autoOrbitDuration: number;
}
/**
 * Render settings panel for managing visual and camera settings.
 */
export declare class RenderSettingsPanel extends BasePanel {
    private settings;
    private cameraModeSelect;
    private isometricControls;
    private backgroundControls;
    constructor(options: BasePanelOptions);
    private initializeSettingsFromRenderer;
    protected buildContent(): void;
    private createBackgroundSection;
    private createCameraSection;
    private createPostProcessingSection;
    private createSceneSection;
    private createLightingSection;
    private createFooter;
    private updateIsometricControlsVisibility;
    private updateBackgroundControlsVisibility;
    private applyBackgroundEnabled;
    private applyHDRISetting;
    private applyBackgroundColor;
    private applyCameraMode;
    private applyIsometricAngles;
    private applyLightIntensity;
    private resetToDefaults;
    private applyAllSettings;
    private rebuildUI;
    private subscribeToEvents;
    getSettings(): RenderSettings;
    setSettings(settings: Partial<RenderSettings>): void;
    setCameraMode(mode: RenderSettings["cameraMode"]): void;
    setSSAOEnabled(enabled: boolean): void;
    setBackgroundColor(color: string): void;
    setHDRIEnabled(enabled: boolean): void;
    setBackgroundEnabled(enabled: boolean): void;
}
//# sourceMappingURL=RenderSettingsPanel.d.ts.map