import { BodyShort, Box, Heading, Page } from "@navikt/ds-react";
import type { PropsWithChildren, ReactElement } from "react";

import RegistrereJournalpostHeader from "../../../pages/registrereJournalpost/components/RegistrereJournalpostHeader";
import { useAppContext } from "../../../store/AppContext";
import BisysLink from "../bisys/BisysLink";

export default function FeilmeldingVeilederPanel({ children }: PropsWithChildren<unknown>): ReactElement {
    const { error } = useAppContext();

    if (!error) {
        return <>{children}</>;
    }

    return (
        <Page>
            <RegistrereJournalpostHeader />

            <Page.Block width="xl">
                <Box paddingBlock="space-20 space-16" data-aksel-template="404-v2">
                    <div>
                        <Heading level="1" size="large" spacing>
                            {error.title ?? "Beklager, det skjedde en feil"}
                        </Heading>
                        <BodyShort spacing>{error.message}</BodyShort>
                        <BisysLink />
                    </div>
                </Box>
            </Page.Block>
        </Page>
    );
}
