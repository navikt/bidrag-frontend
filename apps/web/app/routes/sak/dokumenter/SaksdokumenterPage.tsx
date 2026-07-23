import { HStack } from "@navikt/ds-react";
import { useHentJournalposter } from "~/api/useApi.ts";
import PageLoadingSpinner from "~/common/components/loadingspinner/PageLoadingSpinner";
import type { Route } from "./+types/SaksdokumenterPage";
import { SaksdokumenterVisning } from "./components/SaksdokumenterVisning";

export default function SaksdokumenterPage({ params }: Route.ComponentProps) {
    const { saksnummer } = params;
    const { data: journalposter, error, isLoading } = useHentJournalposter(saksnummer);

    if (isLoading || journalposter === undefined) {
        return <PageLoadingSpinner />;
    }

    if (error) {
        throw error;
    }

    return (
        <HStack gap="space-4" align="start">
            <SaksdokumenterVisning saksnummer={saksnummer} journalposter={journalposter ?? []} />
        </HStack>
    );
}
