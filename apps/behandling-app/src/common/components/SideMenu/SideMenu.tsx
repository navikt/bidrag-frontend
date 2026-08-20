import "./sideMenu.css";

import {
    ArrowsCirclepathIcon,
    BellDotIcon,
    ChevronDownIcon,
    ChevronLeftCircleIcon,
    ExclamationmarkTriangleIcon,
} from "@navikt/aksel-icons";
import { BodyShort, Button, VStack } from "@navikt/ds-react";
import React, { type ReactElement, type ReactNode, useEffect, useState } from "react";
import { scrollToHash } from "../../../utils/window-utils";

export const MenuButton = ({
    step,
    title,
    onStepChange,
    subMenu,
    hideSubMenu = false,
    size,
    active,
    valideringsfeil,
    unconfirmedUpdates,
    loading,
    interactive = true,
}: {
    step?: string;
    title: string | ReactElement;
    onStepChange: () => void;
    interactive?: boolean;
    subMenu?: ReactNode;
    hideSubMenu?: boolean;
    size?: "small" | "medium" | "xsmall";
    active: boolean;
    valideringsfeil?: boolean;
    unconfirmedUpdates?: boolean;
    loading?: boolean;
}) => {
    const [openSubMenu, setOpenSubMenu] = useState<boolean>(active);
    const onClick = () => {
        onStepChange();
        scrollToHash();
        setOpenSubMenu(!openSubMenu);
    };

    useEffect(() => {
        setOpenSubMenu(active);
    }, [active]);

    const displayBellIcon = step && (unconfirmedUpdates || valideringsfeil);
    const displayUpdateIcon = (unconfirmedUpdates && !openSubMenu) || (unconfirmedUpdates && !subMenu && !hideSubMenu);
    const displayWarningIcon = (valideringsfeil && !openSubMenu) || (valideringsfeil && !subMenu && !hideSubMenu);

    return (
        <>
            <Button
                variant="tertiary-neutral"
                data-color="neutral"
                className={`grid-item w-full grid justify-stretch rounded-none py-3 px-5 ${
                    active ? "bg-[var(--ax-accent-100)]" : ""
                }`}
                onClick={onClick}
                disabled={!interactive}
                size={size ?? "medium"}
            >
                <span className="grid items-center gap-1 grid-cols-[20px_20px_auto_20px]">
                    <span>
                        {displayBellIcon && <BellDotIcon title="Info" style={{ color: "var(--ax-text-neutral)" }} />}
                    </span>
                    {!step && (
                        <span>
                            {displayWarningIcon && (
                                <ExclamationmarkTriangleIcon
                                    title="Advarsel"
                                    style={{ color: "var(--ax-text-neutral)" }}
                                />
                            )}
                            {!displayWarningIcon && displayUpdateIcon && (
                                <ArrowsCirclepathIcon title="Info" style={{ color: "var(--ax-text-neutral)" }} />
                            )}
                        </span>
                    )}
                    {step && <span>{step}</span>}
                    <span className={`text-left ${!subMenu && !hideSubMenu && size === "small" ? "font-normal" : ""} `}>
                        {title}
                        {loading && (
                            <BodyShort
                                size="small"
                                className="ml-2 inline-block italic text-[var(--ax-accent-500)] align-middle"
                                aria-label="Laster"
                            >
                                Laster
                            </BodyShort>
                        )}
                    </span>
                    <span>
                        {subMenu && !hideSubMenu && (
                            <ChevronDownIcon
                                title="submenu"
                                className={`duration-500 ${openSubMenu ? "rotate-180" : "rotate-0"}`}
                            />
                        )}
                    </span>
                </span>
            </Button>
            {active && openSubMenu && !hideSubMenu && subMenu}
        </>
    );
};

interface SideMenuProps {
    children: ReactNode;
    otherChildren?: ReactNode;
}
export const SideMenu = ({ children, otherChildren }: SideMenuProps) => {
    const [menuOpen, setMenuOpen] = useState<boolean>(true);
    const closedMenuCss = "p-0 w-6 min-w-0";
    const openMenuCss = "p-6 w-[298px] min-w-[298px] min-[1440px]:w-[412px]";

    return (
        <div
            className={`top-0 z-10 h-screen sticky border-solid border-0 border-r-2 border-r-ax-accent-500 max-w-103 w-max ${
                menuOpen ? openMenuCss : closedMenuCss
            }`}
        >
            {menuOpen && (
                <VStack gap="space-0" className="grid overflow-hidden  border-(--ax-border-neutral-subtle)">
                    {children}
                </VStack>
            )}
            <Button
                className={`absolute -right-4 top-[40%] p-0 rounded-full bg-[white] z-10 duration-500 ${
                    !menuOpen ? "rotate-180" : "rotate-0"
                }`}
                variant="tertiary"
                icon={<ChevronLeftCircleIcon title="sidebar-button" fontSize="2rem" />}
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
            />
            {menuOpen && otherChildren}
        </div>
    );
};
