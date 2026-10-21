import { SchematicRenderer } from "../../SchematicRenderer";
import { SidebarOptions, SidebarTabId, SidebarTabConfig, SidebarState, SidebarAction, KeyboardShortcut, KeyboardShortcutMap } from "./types";
import { ControlsPanel } from "../panels/ControlsPanel";
import { RenderSettingsPanel } from "../panels/RenderSettingsPanel";
import { CapturePanel } from "../panels/CapturePanel";
import { ExportPanel } from "../panels/ExportPanel";
import { ResourcePackPanel } from "../panels/ResourcePackPanel";
import { PerformancePanel } from "../panels/PerformancePanel";
/**
 * Manages the unified sidebar UI system.
 * Coordinates the sidebar, tabs, panels, and keyboard shortcuts.
 */
export declare class SidebarManager {
    private renderer;
    private options;
    private sidebar;
    private shortcutManager;
    private tabConfigs;
    private activeTab;
    private visible;
    /** Whether the entire sidebar (including tab bar) is hidden */
    private hidden;
    /** Direct access to panels */
    readonly panels: {
        controls: ControlsPanel | null;
        renderSettings: RenderSettingsPanel | null;
        capture: CapturePanel | null;
        export: ExportPanel | null;
        resourcePacks: ResourcePackPanel | null;
        performance: PerformancePanel | null;
    };
    constructor(renderer: SchematicRenderer, options?: SidebarOptions);
    /**
     * Merge user options with defaults
     */
    private mergeOptions;
    /**
     * Initialize the sidebar system
     */
    private initialize;
    /**
     * Create all panel instances
     */
    private createPanels;
    /**
     * Set up keyboard shortcut handlers
     */
    private setupKeyboardShortcuts;
    /**
     * Get the action name for a given tab ID
     */
    private getActionForTab;
    /**
     * Update tab tooltips to include keyboard shortcuts
     */
    private updateTabTooltips;
    /**
     * Handle tab click
     */
    private handleTabClick;
    /**
     * Navigate to next/previous tab
     */
    private navigateTab;
    /**
     * Show the sidebar, optionally to a specific tab
     */
    show(tab?: SidebarTabId): void;
    /**
     * Hide the sidebar
     */
    hide(): void;
    /**
     * Broadcast visibility changes through the renderer's event bus so other
     * UI elements (e.g. SlicerOverlay) can reposition themselves around the
     * sidebar without owning a direct reference to it.
     */
    private emitVisibilityChanged;
    /**
     * Toggle sidebar visibility
     */
    toggle(): void;
    /**
     * Switch to a specific tab
     */
    showTab(tabId: SidebarTabId): void;
    /**
     * Enable the sidebar
     */
    enable(): void;
    /**
     * Disable the sidebar
     */
    disable(): void;
    /**
     * Enable keyboard shortcuts
     */
    setKeyboardShortcutsEnabled(enabled: boolean): void;
    /**
     * Set a keyboard shortcut for an action
     */
    setShortcut(action: SidebarAction, shortcut: KeyboardShortcut | null): void;
    /**
     * Get all keyboard shortcuts
     */
    getShortcuts(): KeyboardShortcutMap;
    /**
     * Enable a specific tab
     */
    enableTab(tabId: SidebarTabId): void;
    /**
     * Disable a specific tab
     */
    disableTab(tabId: SidebarTabId): void;
    /**
     * Configure a specific tab with custom settings
     * Allows setting custom shortcuts, callbacks, label, icon, etc.
     */
    configureTab(tabId: SidebarTabId, config: Partial<SidebarTabConfig>): void;
    /**
     * Get the configuration for a specific tab
     */
    getTabConfig(tabId: SidebarTabId): SidebarTabConfig | undefined;
    /**
     * Get current sidebar state
     */
    getState(): SidebarState;
    /**
     * Check if sidebar is visible (expanded)
     */
    isVisible(): boolean;
    /**
     * Check if sidebar is collapsed
     */
    isCollapsed(): boolean;
    /**
     * Check if sidebar is hidden entirely
     */
    isHidden(): boolean;
    /**
     * Show the entire sidebar (make it visible)
     */
    showSidebar(): void;
    /**
     * Hide the entire sidebar (including tab bar)
     */
    hideSidebar(): void;
    /**
     * Toggle sidebar visibility (show/hide entirely)
     */
    toggleVisibility(): void;
    /**
     * Get the active tab ID
     */
    getActiveTab(): SidebarTabId | null;
    /**
     * Enable keyboard shortcuts
     */
    enableShortcuts(): void;
    /**
     * Disable keyboard shortcuts
     */
    disableShortcuts(): void;
    /**
     * Clean up resources
     */
    dispose(): void;
}
//# sourceMappingURL=SidebarManager.d.ts.map