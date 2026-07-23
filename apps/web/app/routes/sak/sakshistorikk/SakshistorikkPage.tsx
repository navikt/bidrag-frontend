import { Heading, VStack } from "@navikt/ds-react";
import { useFinnHendelserForSak, useHentJournalposter } from "~/api/useApi.ts";
import PageLoadingSpinner from "~/common/components/loadingspinner/PageLoadingSpinner";
import type { Route } from "./+types/SakshistorikkPage";
import HendelseTabell from "./components/hendelse/HendelseTabell";
import JournalpostTabell from "./components/journalpost/JournalpostTabell";

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
        <VStack gap={"space-24"}>
            <title>{tabTitle}</title>
            <Heading size={"large"}>Sakshistorikk</Heading>
            <HendelseTabell saksnummer={saksnummer} hendelser={hendelser ?? []} />
            <JournalpostTabell saksnummer={saksnummer} journalposter={journalposter ?? []} />
        </VStack>
    );
}
