import { SidebarPosition, SidebarTabId, SidebarTabConfig } from "./types";
import { BasePanel } from "../panels/BasePanel";
export interface UnifiedSidebarOptions {
    /** Canvas element to attach sidebar to */
    canvas: HTMLCanvasElement;
    /** Position of the sidebar */
    position: SidebarPosition;
    /** Width of the content area */
    width: number;
    /** Whether to start collapsed */
    collapsed: boolean;
    /** Ordered list of tab configurations */
    tabs: SidebarTabConfig[];
    /** Background color of the sidebar */
    backgroundColor?: string;
    /** Callback when a tab is clicked */
    onTabClick?: (tabId: SidebarTabId) => void;
    /** Callback when collapse/expand button is clicked */
    onToggle?: () => void;
}
/**
 * The main sidebar container that holds the tab bar and content area.
 */
export declare class UnifiedSidebar {
    private container;
    private tabBar;
    private contentArea;
    private headerArea;
    private collapsed;
    private position;
    private width;
    private tabs;
    private tabElements;
    private activeTabId;
    private panels;
    private onTabClick?;
    private onToggle?;
    private backgroundColor;
    private readonly TAB_BAR_WIDTH;
    private readonly ANIMATION_DURATION;
    constructor(options: UnifiedSidebarOptions);
    /**
     * Create the main container
     */
    private createContainer;
    /**
     * Create the vertical tab bar
     */
    private createTabBar;
    /**
     * Create the header area with title and close button
     */
    private createHeaderArea;
    /**
     * Create the content area where panels are displayed
     */
    private createContentArea;
    /**
     * Build tab buttons from configuration
     */
    private buildTabs;
    /**
     * Create a tab button
     */
    private createTabButton;
    /**
     * Create the collapse/expand toggle button
     */
    private createToggleButton;
    /**
     * Get the appropriate toggle icon based on position and state
     */
    private getToggleIcon;
    /**
     * Set the active tab
     */
    setActiveTab(tabId: SidebarTabId | null): void;
    /**
     * Register a panel for a tab
     */
    registerPanel(tabId: SidebarTabId, panel: BasePanel): void;
    /**
     * Set collapsed state
     */
    setCollapsed(collapsed: boolean, animate?: boolean): void;
    /**
     * Check if sidebar is collapsed
     */
    isCollapsed(): boolean;
    /**
     * Toggle collapsed state
     */
    toggle(): void;
    /**
     * Show the sidebar (expand if collapsed)
     */
    show(): void;
    /**
     * Hide the sidebar (collapse)
     */
    hide(): void;
    /**
     * Set whether the entire sidebar is hidden (display: none)
     */
    setHidden(hidden: boolean): void;
    /**
     * Check if the sidebar is hidden entirely
     */
    isHiddenEntirely(): boolean;
    /**
     * Get the DOM element
     */
    getElement(): HTMLDivElement;
    /**
     * Update tab configuration
     */
    updateTabs(tabs: SidebarTabConfig[]): void;
    /**
     * Update tooltip for a tab (to show shortcut)
     */
    setTabTooltip(tabId: SidebarTabId, tooltip: string): void;
    /**
     * Clean up resources
     */
    dispose(): void;
}
//# sourceMappingURL=UnifiedSidebar.d.ts.map