import { useHentJournalpost } from "~/api/useApi.ts";
import type { Route } from "./+types/DokumenterPage";
import { DokumenterFremviser } from "./DokumenterFremviser";

export async function loader({ request }: Route.LoaderArgs) {
    const url = new URL(request.url);
    const dokumenter = url.searchParams.getAll("dokument").filter(Boolean);
    return { dokumenter };
}

function useDokumenterTittel(dokumenter: string[]): string {
    const enkeltDokument = dokumenter.length === 1 ? dokumenter[0] : undefined;
    // Formatet er `<Kilde>-<journalpostId>[:<dokumentreferanse>]`
    const [journalpostId = "", dokumentreferanse] = enkeltDokument?.split(":") ?? [];
    const { data } = useHentJournalpost(journalpostId, Boolean(enkeltDokument));

    if (!enkeltDokument) return dokumenter.join(", ") || "Dokumenter";

    const dokumentTittel = dokumentreferanse
        ? data?.journalpost?.dokumenter?.find((dok) => dok.dokumentreferanse === dokumentreferanse)?.tittel
        : undefined;
    return dokumentTittel ?? data?.journalpost?.innhold ?? enkeltDokument;
}

export default function DokumenterPage({ loaderData }: Route.ComponentProps) {
    const { dokumenter } = loaderData;
    const tittel = useDokumenterTittel(dokumenter);

    return (
        <>
            <title>{tittel}</title>
            <DokumenterFremviser dokumenter={dokumenter} />
        </>
    );
}
