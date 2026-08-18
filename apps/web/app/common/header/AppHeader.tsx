import {EndringsloggHeader} from "@bidrag/admin-app";
import { LeaveIcon } from "@navikt/aksel-icons";
import { ActionMenu, InternalHeader, Spacer } from "@navikt/ds-react";
import { ClientOnly } from "~/common/ClientOnly.tsx";
import { AppSwitcher } from "~/common/header/AppSwitcher.tsx";
import BisysHeaderLink from "~/common/header/BisysHeaderLink.tsx";
import type { NavUser } from "~/common/NavUser.ts";

interface AppHeaderProps {
    bruker?: NavUser;
    bisysUrl?: string;
}

export function AppHeader({ bruker, bisysUrl }: AppHeaderProps) {
    return (
        <InternalHeader>
            <InternalHeader.Title href="/">Bidrag</InternalHeader.Title>
            <Spacer />
            <ClientOnly>
                <BisysHeaderLink />
            </ClientOnly>
            <AppSwitcher bisysUrl={bisysUrl} />
            <ClientOnly>
                <EndringsloggHeader />
            </ClientOnly>
            <ActionMenu>
                <ActionMenu.Trigger>
                    <InternalHeader.UserButton name={bruker?.name ?? "Ukjent bruker"} description={bruker?.NAVident} />
                </ActionMenu.Trigger>
                <ActionMenu.Content align="end">
                    <ActionMenu.Group aria-label="Handlinger">
                        <ActionMenu.Item as="a" href="/oauth2/logout" style={{ cursor: "pointer" }}>
                            Logg ut <LeaveIcon aria-hidden />
                        </ActionMenu.Item>
                    </ActionMenu.Group>
                </ActionMenu.Content>
            </ActionMenu>
        </InternalHeader>
    );
}
