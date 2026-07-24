import { DokumentFormatDto, DokumentStatusDto } from "@bidrag/api/BidragDokumentApi";
import { FileUtils, SecureLoggerService } from "@bidrag/common";
import { useEffect, useRef, useState } from "react";
import { redirect } from "react-router";
import { useHentDokument, useHentDokumentMetadata, useHentDokumentUrl } from "~/api/useApi.ts";
import PageLoadingSpinner from "~/common/components/loadingspinner/PageLoadingSpinner";
import type { Route } from "./+types/AapneDokumentMedReferanseRedirect";
import { getDocumentOpenOptions } from "./utils/documentRouteParamsUtils.ts";

export async function loader({ request, params }: Route.LoaderArgs) {
    const url = new URL(request.url);
    const searchParams = new URLSearchParams(url.searchParams);
    const visningstype = searchParams.get("visningstype");

    if (visningstype !== "single") {
        if (visningstype === "tabs") {
            searchParams.delete("visningstype");
        }
        const queryString = searchParams.toString();
        const destination = queryString
            ? `/aapnedokument-tabs/${params.journalpostId}/${params.dokumentreferanse}?${queryString}`
            : `/aapnedokument-tabs/${params.journalpostId}/${params.dokumentreferanse}`;

        return redirect(destination);
    }

    const { resizeToA4, optimizeForPrint, openInNewTab } = getDocumentOpenOptions(searchParams);
    return {
        resizeToA4,
        optimizeForPrint,
        openInNewTab,
    };
}

export default function AapneDokumentMedReferanseRedirect({ params, loaderData }: Route.ComponentProps) {
    const { journalpostId, dokumentreferanse } = params;
    const { resizeToA4, optimizeForPrint, openInNewTab } = loaderData;
    const [error, setError] = useState<Error>();
    const [retryCount, setRetryCount] = useState(0);
    const hasScheduledRetryRef = useRef(false);
    const hasOpenedRef = useRef(false);

    const {
        data: metadata = [],
        isLoading: metadataLoading,
        error: metadataError,
        refetch,
    } = useHentDokumentMetadata(journalpostId, dokumentreferanse);
    const { mutateAsync: hentDokumentAsync } = useHentDokument();
    const { mutateAsync: hentDokumentUrlAsync } = useHentDokumentUrl();

    useEffect(() => {
        if (hasOpenedRef.current || metadataLoading) {
            return;
        }

        if (metadataError) {
            setError(metadataError instanceof Error ? metadataError : new Error("Kunne ikke hente dokumentmetadata"));
            return;
        }

        const openPdf = async (jpId: string, dokRef: string) => {
            const dokument = await hentDokumentAsync({
                journalpostId: jpId,
                dokumentreferanse: dokRef,
                resizeToA4,
                optimizeForPrint,
            });
            FileUtils.openFile(dokument, openInNewTab);
            hasOpenedRef.current = true;
        };

        const openDocument = async () => {
            if (metadata.length === 0 || metadata.length > 1) {
                await openPdf(journalpostId, dokumentreferanse);
                return;
            }

            const dokumentMetadata = metadata[0];
            if (!dokumentMetadata) {
                setError(new Error("Fant ikke dokumentmetadata"));
                return;
            }
            const dokumentJournalpostId = dokumentMetadata?.journalpostId ?? journalpostId;
            const metadataDokumentreferanse = dokumentMetadata?.dokumentreferanse ?? dokumentreferanse;

            if (!metadataDokumentreferanse) {
                setError(new Error("Mangler dokumentreferanse"));
                return;
            }

            if (dokumentMetadata.status === DokumentStatusDto.UNDER_PRODUKSJON) {
                if (retryCount >= 3) {
                    setError(
                        new Error(
                            "Kan ikke åpne dokument under produksjon. Vennligst vent til dokumentet er ferdigprodusert.",
                        ),
                    );
                    return;
                }
                if (!hasScheduledRetryRef.current) {
                    hasScheduledRetryRef.current = true;
                    window.setTimeout(
                        () => {
                            setRetryCount((current) => current + 1);
                            void refetch();
                            hasScheduledRetryRef.current = false;
                        },
                        1000 * (retryCount + 1),
                    );
                }
                return;
            }

            if (dokumentMetadata.format === DokumentFormatDto.MBDOK) {
                const dokumentUrl = await hentDokumentUrlAsync({
                    journalpostId: dokumentJournalpostId,
                    dokumentreferanse: metadataDokumentreferanse,
                });
                window.open(dokumentUrl, openInNewTab ? "_blank" : "_self");
                hasOpenedRef.current = true;
                return;
            }

            await openPdf(dokumentJournalpostId, metadataDokumentreferanse);
        };

        openDocument().catch((error: unknown) => {
            const resolvedError = error instanceof Error ? error : new Error(String(error));
            console.error(
                "Feil ved åpning av dokument fra /aapnedokument/:journalpostId/:dokumentreferanse",
                resolvedError,
            );
            void SecureLoggerService.error(
                "Feil ved åpning av dokument fra /aapnedokument/:journalpostId/:dokumentreferanse",
                resolvedError,
            );
            setError(resolvedError);
        });
    }, [
        dokumentreferanse,
        hentDokumentAsync,
        hentDokumentUrlAsync,
        journalpostId,
        metadata,
        metadataError,
        metadataLoading,
        openInNewTab,
        optimizeForPrint,
        refetch,
        resizeToA4,
        retryCount,
    ]);

    if (error) {
        throw error;
    }

    return <PageLoadingSpinner text="Laster dokument..." />;
}
