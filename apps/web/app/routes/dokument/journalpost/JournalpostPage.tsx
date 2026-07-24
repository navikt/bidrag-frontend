import { getDocumentOpenOptions, parseDokumentReference } from "../utils/documentRouteParamsUtils.ts";
import { Route } from "./+types/JournalpostPage.ts";
import JournalpostFremviser from "./JournalpostFremviser.tsx";

export async function loader({ request, params }: Route.LoaderArgs) {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const options = getDocumentOpenOptions(searchParams);
    const dokumentreferanser = searchParams
        .getAll("dokument")
        .map(parseDokumentReference)
        .filter((value): value is NonNullable<typeof value> => value !== null)
        .filter((value) => value.journalpostId === params.journalpostId)
        .map((value) => value.dokumentreferanse);

    return {
        ...options,
        dokumentreferanser,
    };
}

export default function JournalpostPage({ params, loaderData }: Route.ComponentProps) {
    const { resizeToA4, optimizeForPrint, openInNewTab, dokumentreferanser } = loaderData;

    return (
        <JournalpostFremviser
            journalpostId={params.journalpostId}
            dokumentreferanse={params.dokumentreferanse}
            resizeToA4={resizeToA4}
            optimizeForPrint={optimizeForPrint}
            openInNewTab={openInNewTab}
            fallbackDokumentreferanser={dokumentreferanser}
        />
    );
}
