import { Page } from "@navikt/ds-react";
import type { NavUser } from "~/common/NavUser.ts";
import { AppHeader } from "./AppHeader.tsx";

interface AppLayoutProps {
    children: React.ReactNode;
    bruker?: NavUser | null ;
}

export function AppLayout({ children, bruker }: AppLayoutProps) {
    return (
        <Page>
            <AppHeader bruker={bruker?? undefined}  />
            <Page.Block as="main" gutters>
                {children}
            </Page.Block>
        </Page>
    );
}
