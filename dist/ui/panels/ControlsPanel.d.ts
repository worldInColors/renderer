import { BasePanel, BasePanelOptions } from "./BasePanel";
import { FlyControlsKeybinds } from "../../managers/FlyControls";
export interface ControlsSettings {
    flyModeEnabled: boolean;
    flySpeed: number;
    sprintMultiplier: number;
    keybinds: FlyControlsKeybinds;
    rotateSpeed: number;
    panSpeed: number;
    zoomSpeed: number;
    dampingFactor: number;
}
/**
 * Controls panel for managing camera and movement settings.
 */
export declare class ControlsPanel extends BasePanel {
    private settings;
    private keybindButtons;
    private rebindingKey;
    private rebindOverlay;
    private rebindKeydownHandler;
    private flyModeToggle;
    private infoText;
    constructor(options: BasePanelOptions);
    private updateSettingsFromRenderer;
    private getActiveOrbitControls;
    protected buildContent(): void;
    private createControlModeSection;
    private createMovementSection;
    private createKeybindingsSection;
    private createKeybindRow;
    private formatKeyDisplay;
    private startRebinding;
    private showRebindOverlay;
    private hideRebindOverlay;
    private cancelRebinding;
    private completeRebinding;
    private setupKeybindCapture;
    private createOrbitSection;
    private applyOrbitSetting;
    private applyControlMode;
    private createFooter;
    private resetToDefaults;
    private rebuildUI;
    getSettings(): ControlsSettings;
    setSettings(settings: Partial<ControlsSettings>): void;
    setFlyModeEnabled(enabled: boolean): void;
    setKeybind(action: keyof FlyControlsKeybinds, key: string): void;
    dispose(): void;
}
//# sourceMappingURL=ControlsPanel.d.ts.map