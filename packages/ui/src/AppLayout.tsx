import { Box } from "@navikt/ds-react";
import type { ReactNode } from "react";
import { AppHeader } from "./AppHeader.tsx";
import { NavMenu, type NavMenuItem } from "./NavMenu.tsx";

interface AppLayoutProps {
    children: ReactNode;
    brukerNavn?: string;
    navItems?: NavMenuItem[];
}

export function AppLayout({ children, brukerNavn, navItems }: AppLayoutProps) {
    const handleLoggUt = () => {
        window.location.href = "/oauth2/logout";
    };

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <AppHeader brukerNavn={brukerNavn} onLoggUt={handleLoggUt} />
            {navItems && navItems.length > 0 && <NavMenu items={navItems} />}
            <Box
                as="main"
                paddingBlock={{ xs: "space-16", md: "space-24" }}
                paddingInline={{ xs: "space-16", md: "space-40" }}
                style={{ flex: 1 }}
            >
                {children}
            </Box>
        </div>
    );
}
