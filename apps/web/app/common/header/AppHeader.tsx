import { LeaveIcon } from "@navikt/aksel-icons";
import { ActionMenu, InternalHeader, Spacer } from "@navikt/ds-react";
import {NavUser} from "~/server/auth/NavUser.ts";
import {BisysLink} from "@bidrag/common";

interface AppHeaderProps {
    bruker?: NavUser;
}

export function AppHeader({ bruker }: AppHeaderProps) {
    return (
        <InternalHeader>
            <InternalHeader.Title href="/">Bidrag</InternalHeader.Title>
            <Spacer />
            {/*<BisysLink bisysUrl={ ""} page="sakshistorikk" />*/}
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
