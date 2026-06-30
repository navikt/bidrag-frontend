import {Page} from "@navikt/ds-react";
import {AppHeader} from "./AppHeader.tsx";
import {NavMenu, type NavMenuItem} from "./NavMenu.tsx";
import {NavUser} from "~/server/auth/NavUser.ts";


interface AppLayoutProps {
    children: React.ReactNode;
    bruker?: NavUser | null;
    navItems?: NavMenuItem[];
}

export function AppLayout({children, bruker, navItems}: AppLayoutProps) {
    return (
        <Page>
            <AppHeader bruker={bruker ?? undefined}/>
            {navItems && navItems.length > 0 && <NavMenu items={navItems}/>}
            <Page.Block as="main" gutters>
                {children}
            </Page.Block>
        </Page>
    );
}
