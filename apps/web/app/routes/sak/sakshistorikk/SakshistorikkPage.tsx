import { Box, VStack } from "@navikt/ds-react";
import { useFinnHendelserForSak, useHentJournalposter } from "~/api/useApi.ts";
import PageLoadingSpinner from "~/common/components/loadingspinner/PageLoadingSpinner";
import type { SakSideTittelHandle } from "~/routes/sak/sakSideTittel";
import type { Route } from "./+types/SakshistorikkPage";
import HendelseTabell from "./components/hendelse/HendelseTabell";
import JournalpostTabell from "./components/journalpost/JournalpostTabell";

export const handle: SakSideTittelHandle = { sakSideTittel: "Sakshistorikk" };

export default function SakshistorikkPage({ params }: Route.ComponentProps) {
    const { saksnummer } = params;
    const tabTitle = `Sakshistorikk - ${saksnummer}`;
    const {
        data: journalposter,
        error: journalposterError,
        isLoading: journalposterLoading,
    } = useHentJournalposter(saksnummer);
    const { data: hendelser, error: hendelserError, isLoading: hendelserLoading } = useFinnHendelserForSak(saksnummer);

    if (journalposterLoading || hendelserLoading) {
        return <PageLoadingSpinner />;
    }

    if (hendelserError) {
        throw hendelserError;
    }

    if (journalposterError) {
        throw journalposterError;
    }

    return (
        <VStack gap={"space-32"}>
            <title>{tabTitle}</title>
            <TabellKort>
                <HendelseTabell saksnummer={saksnummer} hendelser={hendelser ?? []} />
            </TabellKort>
            <TabellKort>
                <JournalpostTabell saksnummer={saksnummer} journalposter={journalposter ?? []} />
            </TabellKort>
        </VStack>
    );
}

/** Gir tabellene en tydelig flate som skiller dem fra sidebakgrunnen. */
function TabellKort({ children }: { children: React.ReactNode }) {
    return (
        <Box
            background="raised"
            borderColor="neutral-subtle"
            borderWidth="1"
            borderRadius="4"
            padding="space-16"
            shadow="dialog"
        >
            {children}
        </Box>
    );
}
