import { Alert, Box, Loader, VStack } from "@navikt/ds-react";
import type { ReactNode } from "react";
import { useFinnHendelserForSak, useHentFarskapUtelukkedeJournalposter, useHentJournalposter } from "~/api/useApi.ts";
import PageLoadingSpinner from "~/common/components/loadingspinner/PageLoadingSpinner";
import type { SakSideTittelHandle } from "~/routes/sak/sakSideTittel";
import type { Route } from "./+types/SakshistorikkPage";
import SaksLogg from "./components/hendelse/SaksLogg.tsx";
import JournalpostTabell from "./components/journalpost/JournalpostTabell";

export const handle: SakSideTittelHandle = { sakSideTittel: "Sakshistorikk" };

export default function SakshistorikkPage({ params }: Route.ComponentProps) {
    const { saksnummer } = params;
    const tabTitle = `Sakshistorikk - ${saksnummer}`;
    const { data: hendelser, error: hendelserError, isLoading: hendelserLoading } = useFinnHendelserForSak(saksnummer);

    if (hendelserLoading) {
        return <PageLoadingSpinner />;
    }

    if (hendelserError) {
        throw hendelserError;
    }

    return (
        <VStack gap="space-32">
            <title>{tabTitle}</title>
            <TabellKort>
                <SaksLogg saksnummer={saksnummer} hendelser={hendelser ?? []} />
            </TabellKort>
            <TabellKort>
                <JournalpostSeksjon saksnummer={saksnummer} />
            </TabellKort>
        </VStack>
    );
}

/** Journalposter lastes separat, slik at en feil her ikke tar ned resten av sakshistorikken. */
function JournalpostSeksjon({ saksnummer }: { saksnummer: string }) {
    const { data: journalposter, error, isLoading } = useHentJournalposter(saksnummer);
    const { data: farskapUtelukkedeJournalposter } = useHentFarskapUtelukkedeJournalposter(saksnummer);

    if (isLoading) {
        return <Loader size="medium" title="Henter journalposter" />;
    }

    if (error) {
        return (
            <Alert variant="error" size="small">
                Kunne ikke hente journalposter.
            </Alert>
        );
    }

    return (
        <JournalpostTabell
            saksnummer={saksnummer}
            journalposter={journalposter ?? []}
            farskapUtelukkedeJournalposter={farskapUtelukkedeJournalposter ?? []}
        />
    );
}

/** Gir tabellene en tydelig flate som skiller dem fra sidebakgrunnen. */
function TabellKort({ children }: { children: ReactNode }) {
    return (
        <Box background="neutral-soft" padding="space-16">
            {children}
        </Box>
    );
}
