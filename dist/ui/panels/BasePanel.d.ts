import { SchematicRenderer } from "../../SchematicRenderer";
export interface BasePanelOptions {
    /** Reference to the renderer */
    renderer: SchematicRenderer;
    /** Callback when settings change */
    onSettingsChange?: (settings: unknown) => void;
}
/**
 * Abstract base class for sidebar panels.
 * Provides common structure and lifecycle methods for panel implementations.
 */
export declare abstract class BasePanel {
    protected renderer: SchematicRenderer;
    protected container: HTMLDivElement;
    protected isActive: boolean;
    protected onSettingsChange?: (settings: unknown) => void;
    constructor(options: BasePanelOptions);
    /**
     * Initialize the panel content. Must be called by subclasses at the end of their constructor.
     */
    protected init(): void;
    /**
     * Create the panel's container element
     */
    protected createContainer(): HTMLDivElement;
    /**
     * Build the panel's internal content.
     * Subclasses must implement this to create their UI.
     */
    protected abstract buildContent(): void;
    /**
     * Called when the panel becomes visible/active.
     * Subclasses can override for activation logic.
     */
    protected onActivate(): void;
    /**
     * Called when the panel becomes hidden/inactive.
     * Subclasses can override for deactivation logic.
     */
    protected onDeactivate(): void;
    /**
     * Activate the panel (make it visible)
     */
    activate(): void;
    /**
     * Deactivate the panel (hide it)
     */
    deactivate(): void;
    /**
     * Check if the panel is currently active
     */
    isActivePanel(): boolean;
    /**
     * Get the panel's DOM element
     */
    getElement(): HTMLDivElement;
    /**
     * Emit a settings change event
     */
    protected emitChange(settings: unknown): void;
    /**
     * Create a section container with title
     */
    protected createSection(title: string, isLast?: boolean): HTMLDivElement;
    /**
     * Create a content wrapper with padding
     */
    protected createContent(): HTMLDivElement;
    /**
     * Create an info/help text element
     */
    protected createInfoText(text: string): HTMLDivElement;
    /**
     * Clean up resources
     */
    dispose(): void;
}
//# sourceMappingURL=BasePanel.d.ts.map