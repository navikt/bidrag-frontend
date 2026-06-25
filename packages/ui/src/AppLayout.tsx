import { Page } from "@navikt/ds-react";
import type { NavUser } from "~/auth/NavUser.ts";
import { AppHeader } from "./AppHeader.tsx";
import { NavMenu, type NavMenuItem } from "./NavMenu.tsx";

interface AppLayoutProps {
    children: React.ReactNode;
    bruker?: NavUser | null;
    navItems?: NavMenuItem[];
}

export function AppLayout({ children, bruker, navItems }: AppLayoutProps) {
    return (
        <Page>
            <AppHeader bruker={bruker ?? undefined} />
            {navItems && navItems.length > 0 && <NavMenu items={navItems} />}
            <Page.Block as="main" gutters>
                {children}
            </Page.Block>
        </Page>
    );
}
