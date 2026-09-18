import { getDocumentOpenOptions } from "../utils/documentRouteParamsUtils";
import type { Route } from "./+types/JournalpostPage";
import JournalpostFremviser from "./JournalpostFremviser";

export async function loader({ request }: Route.LoaderArgs) {
    const url = new URL(request.url);
    const { openInNewTab } = getDocumentOpenOptions(url.searchParams);
    return { openInNewTab };
}

export default function JournalpostPage({ params, loaderData }: Route.ComponentProps) {
    const { journalpostId, dokumentreferanse } = params;
    const { openInNewTab } = loaderData;
    const documentTitle = `Journalpost - ${journalpostId}`;

    return (
        <>
            <title>{documentTitle}</title>
            <JournalpostFremviser
                journalpostId={journalpostId}
                dokumentreferanse={dokumentreferanse}
                openInNewTab={openInNewTab}
            />
        </>
    );
}
