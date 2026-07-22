import { redirect } from "react-router";
import { isDocumentViewerEnabled } from "~/server/documentViewerFeatureFlag.server.ts";
import type { Route } from "./+types/AapneDokumentTabs";
import { getDocumentOpenOptions, parseDokumentReference } from "./documentRouteParams";
import PdfTabsViewer from "./PdfTabsViewer.tsx";

export async function loader({ request, params }: Route.LoaderArgs) {
    if (!(await isDocumentViewerEnabled())) {
        const url = new URL(request.url);
        const query = new URLSearchParams(url.searchParams);
        query.set("visningstype", "tabs");
        return redirect(`/aapnedokument/${params.journalpostId}/${params.dokumentreferanse}?${query.toString()}`);
    }

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

export default function AapneDokumentTabs({ params, loaderData }: Route.ComponentProps) {
    const { resizeToA4, optimizeForPrint, openInNewTab, dokumentreferanser } = loaderData;

    return (
        <PdfTabsViewer
            journalpostId={params.journalpostId}
            dokumentreferanse={params.dokumentreferanse}
            resizeToA4={resizeToA4}
            optimizeForPrint={optimizeForPrint}
            openInNewTab={openInNewTab}
            fallbackDokumentreferanser={dokumentreferanser}
        />
    );
}
