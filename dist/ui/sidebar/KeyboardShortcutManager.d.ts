import { KeyboardShortcut, KeyboardShortcutMap, SidebarAction } from "./types";
/**
 * Manages keyboard shortcuts for the sidebar UI.
 * Handles modifier keys (Ctrl, Shift, Alt) and prevents conflicts with input elements.
 */
export declare class KeyboardShortcutManager {
    private shortcuts;
    private handlers;
    private enabled;
    private boundKeydownHandler;
    constructor(shortcuts?: KeyboardShortcutMap);
    /**
     * Update multiple shortcut mappings at once
     */
    setShortcuts(shortcuts: KeyboardShortcutMap): void;
    /**
     * Set or remove a single shortcut
     */
    setShortcut(action: SidebarAction, shortcut: KeyboardShortcut | null): void;
    /**
     * Get a shortcut for an action
     */
    getShortcut(action: SidebarAction): KeyboardShortcut | undefined;
    /**
     * Get all shortcuts as a map
     */
    getShortcuts(): KeyboardShortcutMap;
    /**
     * Register a handler for an action
     */
    onAction(action: SidebarAction, handler: () => void): void;
    /**
     * Remove a handler for an action
     */
    offAction(action: SidebarAction): void;
    /**
     * Enable or disable all shortcuts
     */
    setEnabled(enabled: boolean): void;
    /**
     * Check if shortcuts are enabled
     */
    isEnabled(): boolean;
    /**
     * Get human-readable shortcut string for display
     */
    formatShortcut(shortcut: KeyboardShortcut): string;
    /**
     * Format a key code for display
     */
    private formatKey;
    /**
     * Handle keydown events
     */
    private handleKeydown;
    /**
     * Check if a keyboard event matches a shortcut
     */
    private matchesShortcut;
    /**
     * Check if an input element is currently focused
     */
    private isInputFocused;
    /**
     * Parse a shortcut string like "Ctrl+Shift+1" into a KeyboardShortcut object
     */
    static parseShortcut(str: string): KeyboardShortcut | null;
    /**
     * Clean up event listeners
     */
    dispose(): void;
}
//# sourceMappingURL=KeyboardShortcutManager.d.ts.map