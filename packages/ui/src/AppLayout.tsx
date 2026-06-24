import { Page } from "@navikt/ds-react";
import { AppHeader } from "./AppHeader.tsx";
import { NavMenu, type NavMenuItem } from "./NavMenu.tsx";

interface AppLayoutProps {
    children: React.ReactNode;
    brukerNavn?: string;
    navItems?: NavMenuItem[];
}

export function AppLayout({ children, brukerNavn, navItems }: AppLayoutProps) {
    const handleLoggUt = () => {
        window.location.href = "/oauth2/logout";
    };

    return (
        <Page>
            <AppHeader brukerNavn={brukerNavn} onLoggUt={handleLoggUt} />
            {navItems && navItems.length > 0 && <NavMenu items={navItems} />}
            <Page.Block as="main" gutters>
                {children}
            </Page.Block>
        </Page>
    );
}
