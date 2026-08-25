import { useEffect } from "react";

import type { FloatingBottomToolbarTab } from "../components/FloatingBottomToolbar";
import { useBehandlingProvider } from "../context/BehandlingContext";
import useFeatureToggle from "./useFeatureToggle";

interface UsePageTabsOptions<T> {
    /**
     * Array of items to create tabs from
     */
    items: T[];
    /**
     * Function to map items to tab objects
     */
    mapToTab: (item: T) => FloatingBottomToolbarTab;
    /**
     * Currently selected tab ID
     */
    selectedTabId?: string;
    /**
     * Condition to enable tabs (e.g., vurderSeparat, items.length > 1)
     * When false, tabs are cleared
     */
    enabled?: boolean;
}

/**
 * Reusable hook for managing page tabs in forms with multiple items/persons.
 * Handles setting pageTabs and currentTab in BehandlingContext.
 *
 * @example
 * ```tsx
 * // In Inntekt component
 * usePageTabs({
 *   items: inntektRoller,
 *   mapToTab: (rolle) => ({
 *     id: rolle.gjelder.id.toString(),
 *     label: rolle.gjelder.rolletype,
 *   }),
 *   selectedTabId: selectedTab,
 * });
 * ```
 *
 * @example
 * ```tsx
 * // In Samvær with conditional enable
 * usePageTabs({
 *   items: samvær.barn,
 *   mapToTab: (barn) => ({
 *     id: barn.id.toString(),
 *     label: barn.barn.rolletype,
 *   }),
 *   selectedTabId: selectedTab,
 *   enabled: vurderSeparat && samvær.barn.length > 1,
 * });
 * ```
 */
export function usePageTabs<T>({ items, mapToTab, selectedTabId, enabled = true }: UsePageTabsOptions<T>) {
    const { setPageTabs, setCurrentTab, pageTabs } = useBehandlingProvider();
    const { nyToolbar } = useFeatureToggle();

    useEffect(() => {
        if (!nyToolbar) return;
        if (enabled && items.length > 0) {
            const tabs = items.map(mapToTab);

            // Only update if tabs have changed (different length or different content)
            const tabsChanged = tabs.length !== pageTabs?.length;

            if (tabsChanged) {
                setPageTabs(tabs);

                // Set current tab if selectedTabId is provided
                if (selectedTabId) {
                    const currentTab = tabs.find((tab) => tab.id === selectedTabId);
                    if (currentTab) {
                        setCurrentTab(currentTab);
                    }
                }
            }
        } else if (!enabled && pageTabs?.length > 0) {
            // Clear tabs when disabled
            setPageTabs([]);
            setCurrentTab(undefined);
        }
    }, [items, selectedTabId, enabled, pageTabs?.length, setPageTabs, setCurrentTab, nyToolbar]);
}
