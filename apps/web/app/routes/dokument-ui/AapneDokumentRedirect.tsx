import { FileUtils, SecureLoggerService } from "@bidrag/common";
import { useEffect, useRef, useState } from "react";
import { redirect } from "react-router";
import { useHentDokumenter } from "~/api/useApi.ts";
import PageLoadingSpinner from "~/common/components/loadingspinner/PageLoadingSpinner";
import { isDocumentViewerEnabled } from "~/server/documentViewerFeatureFlag.server.ts";
import { redirectToBidragUi } from "../shared/redirectToBidragUi.ts";
import type { Route } from "./+types/AapneDokumentRedirect";
import { getDocumentOpenOptions, parseDokumentReference } from "./documentRouteParams";

export async function loader({ request }: Route.LoaderArgs) {
    if (!(await isDocumentViewerEnabled())) {
        return redirectToBidragUi(request);
    }

    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const dokumenter = searchParams.getAll("dokument");
    const { resizeToA4, optimizeForPrint, openInNewTab } = getDocumentOpenOptions(searchParams);
    const parsedDokumenter = dokumenter
        .map(parseDokumentReference)
        .filter((value): value is NonNullable<typeof value> => Boolean(value));

    if (parsedDokumenter.length > 0) {
        const [firstDokument, ...rest] = parsedDokumenter;
        if (firstDokument) {
            const sameJournalpost = rest.every((dokument) => dokument.journalpostId === firstDokument.journalpostId);

            if (sameJournalpost) {
                const tabQuery = new URLSearchParams();
                tabQuery.set("resizeToA4", String(resizeToA4));
                tabQuery.set("optimizeForPrint", String(optimizeForPrint));
                tabQuery.set("openInNewTab", String(openInNewTab));
                parsedDokumenter.forEach((dokument) => {
                    tabQuery.append("dokument", `${dokument.journalpostId}:${dokument.dokumentreferanse}`);
                });

                return redirect(
                    `/aapnedokument-tabs/${firstDokument.journalpostId}/${firstDokument.dokumentreferanse}?${tabQuery.toString()}`,
                );
            }
        }
    }

    return {
        dokumenter,
        resizeToA4,
        optimizeForPrint,
        openInNewTab,
    };
}

export default function AapneDokumentRedirect({ loaderData }: Route.ComponentProps) {
    const { dokumenter, resizeToA4, optimizeForPrint, openInNewTab } = loaderData;
    const [error, setError] = useState<Error>();
    const hasOpenedRef = useRef(false);
    const hasAttemptedRef = useRef(false);
    const hentDokumenter = useHentDokumenter();

    useEffect(() => {
        if (hasOpenedRef.current || hasAttemptedRef.current) {
            return;
        }

        if (dokumenter.length === 0) {
            setError(new Error("Mangler dokumentparametre"));
            hasAttemptedRef.current = true;
            return;
        }

        hasAttemptedRef.current = true;
        hentDokumenter
            .mutateAsync({
                dokumenter,
                resizeToA4,
                optimizeForPrint,
            })
            .then((response) => {
                FileUtils.openFile(response, openInNewTab);
                hasOpenedRef.current = true;
            })
            .catch((error: unknown) => {
                const resolvedError = error instanceof Error ? error : new Error(String(error));
                console.error("Feil ved åpning av dokumenter fra /aapnedokument", resolvedError);
                void SecureLoggerService.error("Feil ved åpning av dokumenter fra /aapnedokument", resolvedError);
                setError(resolvedError);
            });
    }, [dokumenter, hentDokumenter, openInNewTab, optimizeForPrint, resizeToA4]);

    if (error) {
        throw error;
    }

    return <PageLoadingSpinner text="Laster dokument..." />;
}
