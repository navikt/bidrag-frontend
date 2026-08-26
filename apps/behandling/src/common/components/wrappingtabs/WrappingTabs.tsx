import "./WrappingTabs.css";

import { Tabs as AkselTabs, type TabsProps as AkselTabsProps } from "@navikt/ds-react";
import type React from "react";
import { forwardRef, useRef } from "react";

/**
 * Drop-in replacement for Aksel's `Tabs.List` that wraps tabs onto multiple
 * rows instead of scrolling them horizontally when there isn't enough space.
 *
 * Keeps the same accessibility semantics (role="tablist", arrow-key/Home/End
 * navigation between tabs) as the original Aksel implementation.
 */
export interface WrappingTabsListProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

const WrappingTabsList = forwardRef<HTMLDivElement, WrappingTabsListProps>(
    ({ className, onKeyDown, children, ...rest }, ref) => {
        const listRef = useRef<HTMLDivElement>(null);

        const setRefs = (node: HTMLDivElement | null) => {
            listRef.current = node;
            if (typeof ref === "function") {
                ref(node);
            } else if (ref) {
                (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
            }
        };

        const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
            onKeyDown?.(event);
            if (event.defaultPrevented) {
                return;
            }

            const navigationKeys = ["ArrowLeft", "ArrowRight", "Home", "End"];
            if (!navigationKeys.includes(event.key)) {
                return;
            }

            const tabs = Array.from(
                listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)') ?? [],
            );
            if (tabs.length === 0) {
                return;
            }

            const currentIndex = tabs.findIndex((tab) => tab === document.activeElement);
            let nextIndex = currentIndex;

            if (event.key === "ArrowRight") {
                nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % tabs.length;
            } else if (event.key === "ArrowLeft") {
                nextIndex = currentIndex === -1 ? tabs.length - 1 : (currentIndex - 1 + tabs.length) % tabs.length;
            } else if (event.key === "Home") {
                nextIndex = 0;
            } else if (event.key === "End") {
                nextIndex = tabs.length - 1;
            }

            event.preventDefault();
            tabs[nextIndex]?.focus();
        };

        return (
            <div
                ref={setRefs}
                {...rest}
                onKeyDown={handleKeyDown}
                role="tablist"
                aria-orientation="horizontal"
                className={`wrapping-tabs__tablist flex flex-wrap gap-2${className ? ` ${className}` : ""}`}
            >
                {children}
            </div>
        );
    },
);
WrappingTabsList.displayName = "WrappingTabsList";

interface WrappingTabsComponent
    extends React.ForwardRefExoticComponent<AkselTabsProps & React.RefAttributes<HTMLDivElement>> {
    Tab: typeof AkselTabs.Tab;
    List: typeof WrappingTabsList;
    Panel: typeof AkselTabs.Panel;
}

/**
 * Same API as Aksel's `Tabs` (`Tabs`, `Tabs.List`, `Tabs.Tab`, `Tabs.Panel`),
 * but tabs wrap onto new rows instead of being horizontally scrollable when
 * there are too many to fit on one line.
 */
const WrappingTabs = forwardRef<HTMLDivElement, AkselTabsProps>((props, ref) => (
    <AkselTabs ref={ref} {...props} />
)) as unknown as WrappingTabsComponent;

WrappingTabs.displayName = "WrappingTabs";
WrappingTabs.Tab = AkselTabs.Tab;
WrappingTabs.List = WrappingTabsList;
WrappingTabs.Panel = AkselTabs.Panel;

export default WrappingTabs;
