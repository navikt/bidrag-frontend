import { MenuGridIcon } from "@navikt/aksel-icons";
import { ActionMenu, InternalHeader } from "@navikt/ds-react";
import { Link, useParams } from "react-router";

/**
 * App-meny i headeren, basert på Aksel sitt mønster for InternalHeader + ActionMenu
 * (@see https://aksel.nav.no/komponenter/core/i-header?demo=headerdemo-app-switcher).
 *
 * Viser to grupper:
 * - "Sak": kun når man er i en saksnummer-kontekst (`/sak/:saksnummer/...`), med lenker til
 *   sider under gjeldende sak.
 * - "Oppgaver": alltid synlig. Lenkene er placeholdere til de faktiske URL-ene er avklart.
 */
export function AppSwitcher({ bisysUrl }: { bisysUrl?: string }) {
    const { saksnummer } = useParams();

    return (
        <ActionMenu>
            <ActionMenu.Trigger>
                <InternalHeader.Button>
                    <MenuGridIcon style={{ fontSize: "1.5rem" }} title="Systemer og oppslagsverk" />
                </InternalHeader.Button>
            </ActionMenu.Trigger>
            <ActionMenu.Content align="end">
                {saksnummer && (
                    <>
                        <ActionMenu.Group label="Sak">
                            <ActionMenu.Item as={Link} to={`/sak/${saksnummer}/sakshistorikk`}>
                                Sakshistorikk
                            </ActionMenu.Item>
                            <ActionMenu.Item as={Link} to={`/sak/${saksnummer}/belopshistorikk`}>
                                Beløpshistorikk
                            </ActionMenu.Item>
                            <ActionMenu.Item as={Link} to={`/sak/${saksnummer}/fogdhistorikk`}>
                                Fogdhistorikk
                            </ActionMenu.Item>
                            <ActionMenu.Item as={Link} to={`/sak/${saksnummer}/reskontro`}>
                                Saksreskontro
                            </ActionMenu.Item>
                            <ActionMenu.Item as={Link} to={`/sak/${saksnummer}/dokumenter`}>
                                Dokumenter
                            </ActionMenu.Item>
                        </ActionMenu.Group>
                        <ActionMenu.Divider />
                    </>
                )}
                <ActionMenu.Group label="Oppgaver">
                    {/* TODO: bytt ut placeholder-lenkene når faktiske URL-er er avklart. */}
                    <ActionMenu.Item as="a" href={`${bisysUrl}Oppgaveliste.do`}>
                        Oppgaveliste
                    </ActionMenu.Item>
                    <ActionMenu.Item as="a" href={`${bisysUrl}Oppgaverestanser.do`}>
                        Oppgaverestanser
                    </ActionMenu.Item>
                </ActionMenu.Group>
            </ActionMenu.Content>
        </ActionMenu>
    );
}
