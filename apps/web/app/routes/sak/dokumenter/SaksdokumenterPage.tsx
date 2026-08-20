import { useHentJournalposter } from "~/api/useApi.ts";
import PageLoadingSpinner from "~/common/components/loadingspinner/PageLoadingSpinner";
import type { SakSideTittelHandle } from "~/routes/sak/sakSideTittel";
import type { Route } from "./+types/SaksdokumenterPage";
import { SaksdokumenterVisning } from "./components/SaksdokumenterVisning";

export const handle: SakSideTittelHandle = { sakSideTittel: "Dokumenter" };

export default function SaksdokumenterPage({ params }: Route.ComponentProps) {
    const { saksnummer } = params;
    const { data: journalposter, error, isLoading } = useHentJournalposter(saksnummer);

    if (isLoading || journalposter === undefined) {
        return <PageLoadingSpinner />;
    }

    if (error) {
        throw error;
    }

    return <SaksdokumenterVisning saksnummer={saksnummer} journalposter={journalposter ?? []} />;
}
