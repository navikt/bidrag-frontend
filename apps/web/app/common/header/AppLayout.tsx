import { Page } from "@navikt/ds-react";
import type { NavUser } from "~/common/NavUser.ts";
import { AppHeader } from "./AppHeader.tsx";

interface AppLayoutProps {
    children: React.ReactNode;
    bruker?: NavUser | null;
    bisysUrl?: string;
}

export function AppLayout({ children, bruker, bisysUrl }: AppLayoutProps) {
    return (
        <Page>
            <AppHeader bruker={bruker ?? undefined} bisysUrl={bisysUrl} />
            <Page.Block as="main" gutters>
                {children}
            </Page.Block>
        </Page>
    );
}
