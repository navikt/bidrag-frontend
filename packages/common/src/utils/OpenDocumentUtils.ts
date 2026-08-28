import { BIDRAG_DOKUMENT_API } from "@bidrag/api";
import { DokumentFormatDto, DokumentStatusDto } from "@bidrag/api/BidragDokumentApi";
import axios from "axios";
import { LoggerService } from "../logging";
import { type EditDocumentBroadcastMessage, type EditDocumentConfig, EditorConfigStorage } from "../types";

export class OpenDocumentUtils {
    static åpneDokument(
        journalpostid: string,
        dokumentreferanse?: string,
        optimizeForPrint?: boolean,
        openInNewWindow = false,
    ) {
        window.open(
            OpenDocumentUtils.getÅpneDokumentLenke(journalpostid, dokumentreferanse, optimizeForPrint, openInNewWindow),
        );
    }

    /**
     * Bygger lenke til enkeltdokumentvisningen (`JournalpostPage`/`/dokument/...`) i bidrag-frontend,
     * i stedet for den gamle `/aapnedokument`-ruten som viderekoblet til bidrag-ui.
     */
    static getÅpneDokumentLenke(
        journalpostid: string,
        dokumentreferanse?: string,
        optimizeForPrint?: boolean,
        openInNewWindow = false,
    ): string {
        const params = new URLSearchParams();
        params.set("openInNewTab", openInNewWindow ? "true" : "false");
        if (optimizeForPrint != null) {
            params.set("optimizeForPrint", optimizeForPrint ? "true" : "false");
        }
        const dokumentReferansePath = dokumentreferanse ? `/${dokumentreferanse}` : "";
        return `/dokument/${journalpostid}${dokumentReferansePath}?${params.toString()}`;
    }

    /**
     * Åpner flere dokumenter i egne faner, ett og ett, via enkeltdokumentvisningen. Erstatter den
     * gamle `/aapnedokument?dokument=...`-ruten (bidrag-ui) som viste flere dokumenter i én visning.
     * Hvert element i `dokumenter` kan enten være kun en journalpostid, eller
     * `journalpostid:dokumentreferanse`.
     */
    static åpneDokumenter(dokumenter: string[], openInNewWindow = false) {
        for (const lenke of OpenDocumentUtils.getÅpneDokumenterLenker(dokumenter, openInNewWindow)) {
            window.open(lenke);
        }
    }

    static getÅpneDokumenterLenker(dokumenter: string[], openInNewWindow = false): string[] {
        return dokumenter.map((dokument) => {
            const [journalpostid, ...rest] = dokument.split(":");
            const dokumentreferanse = rest.length > 0 ? rest.join(":") : undefined;
            return OpenDocumentUtils.getÅpneDokumentLenke(journalpostid ?? "", dokumentreferanse, undefined, openInNewWindow);
        });
    }

    static openDocumentEditorWithDocuments(dokumenter: string[], editDocumentConfig?: EditDocumentConfig, id?: string) {
        LoggerService.info(`Åpner dokumenter ${dokumenter} på nettleser`);
        const dokumenterPath = dokumenter.map((dokument) => `dokument=${dokument}`).join("&");
        if (id && editDocumentConfig) {
            EditorConfigStorage.save(id, editDocumentConfig);
        }
        window.open(`/rediger/?${dokumenterPath}&id=${id}`);
    }

    static openDocumentEditor(journalpostId: string, editDocumentConfig?: EditDocumentConfig, id?: string) {
        LoggerService.info(`Åpner dokument ${journalpostId} på nettleser`);
        if (id && editDocumentConfig) {
            EditorConfigStorage.save(id, editDocumentConfig);
        }
        window.open(`/rediger/${journalpostId}?id=${id}`);
    }

    /**
     * Åpner dokumentet i redigeringsvisningen (`@bidrag/redigering`) i en ny fane, uten å gå via
     * masking-/skjemaflyten. Brukes som en ekstra måte å åpne et allerede ferdigstilt dokument på,
     * i tillegg til den vanlige visningen.
     */
    static openDocumentRedigering(journalpostId: string, dokumentreferanse?: string) {
        LoggerService.info(`Åpner redigering for journalpost ${journalpostId}/${dokumentreferanse ?? ""}`);
        const dokumentreferansePath = dokumentreferanse ? `/${dokumentreferanse}` : "";
        window.open(`/rediger/${journalpostId}${dokumentreferansePath}`, "_blank");
    }

    static openDocumentMaskingEditor(
        forsendelseId: string,
        dokumentreferanse: string,
        editedDocument?: EditDocumentBroadcastMessage,
        id?: string,
    ) {
        LoggerService.info(
            `Åpner redigering av forsendelse ${forsendelseId} og dokument ${dokumentreferanse} på nettleser`,
        );
        if (id && editedDocument) {
            EditorConfigStorage.save(id, editedDocument?.config);
        }
        window.open(`/rediger/masker/${forsendelseId}/${dokumentreferanse}?id=${id}`);
    }

    static async openMbdokDocument(
        journalpostId: string,
        dokumentreferanse: string,
        dokumenter?: string[],
        documentByte?: ArrayBuffer | string,
        openInNewTab?: boolean,
        closeTabAfterOpen?: boolean,
        resizeToA4?: boolean,
        openInBrowser?: boolean,
        optimizeForPrint?: boolean,
        retryCount?: number,
    ) {
        const dokumentMetadataResponse = await BIDRAG_DOKUMENT_API.dokument.hentDokumentMetadata1(
            journalpostId,
            dokumentreferanse,
        );
        const dokumentMetadata = dokumentMetadataResponse.data[0];

        LoggerService.info(
            `Åpner dokument ${journalpostId}/${dokumentreferanse} med format ${dokumentMetadata?.format} og status ${dokumentMetadata?.status}`,
        );

        // Dokumenter under produksjon er ikke arkivert enda, og metadata kan derfor komme litt forsinket
        if (dokumentMetadata?.status === DokumentStatusDto.UNDER_PRODUKSJON) {
            const currentRetryCount = retryCount ?? 0;
            if (currentRetryCount >= 3) {
                throw new Error(
                    "Kan ikke åpne dokument under produksjon. Vennligst vent til dokumentet er ferdigprodusert.",
                );
            }
            return new Promise((resolve, reject) =>
                setTimeout(
                    () =>
                        OpenDocumentUtils.openMbdokDocument(
                            journalpostId,
                            dokumentreferanse,
                            dokumenter,
                            documentByte,
                            openInNewTab,
                            closeTabAfterOpen,
                            resizeToA4,
                            openInBrowser,
                            optimizeForPrint,
                            currentRetryCount + 1,
                        )
                            .then(resolve)
                            .catch(reject),
                    1000 * (currentRetryCount + 1),
                ),
            );
        }

        if (dokumentMetadata?.format === DokumentFormatDto.MBDOK) {
            return OpenDocumentUtils.launchDokumentReaderWithIframe(journalpostId, dokumentreferanse)
                .then((src) => OpenDocumentUtils.openDocumentExternal(src))
                .catch(OpenDocumentUtils.handleOpenDocumentError)
                .then(() => {
                    if (closeTabAfterOpen) {
                        setTimeout(() => window.close(), 400);
                    }
                });
        }
    }

    static async launchDokumentReaderWithIframe(journalpostId: string, dokumentId: string) {
        LoggerService.info(
            `Åpner dokument med journalpostid ${journalpostId} og dokumentreferanse ${dokumentId} i brevklient`,
        );
        try {
            const dokumentreferanse = await OpenDocumentUtils.getDokumentReferanse(journalpostId, dokumentId);
            const response = await BIDRAG_DOKUMENT_API.tilgang.giTilgangTilDokument(journalpostId, dokumentreferanse);
            return response.data.dokumentUrl;
        } catch (error) {
            LoggerService.error(
                "Feilet under henting av dokument addresse: ",
                error instanceof Error ? error : new Error(String(error)),
            );
            window.alert("Feilet under henting av dokument addresse");
            return Promise.reject(error);
        }
    }

    static openDocumentExternal(src: string) {
        const iframeElement = document.createElement("iframe");
        iframeElement.src = src;
        document.body.appendChild(iframeElement);
        setTimeout(() => iframeElement.remove(), 400);
    }

    static async getDokumentReferanse(journalpostId: string, dokumentId: string): Promise<string> {
        if (dokumentId) {
            return dokumentId;
        }
        const journalpostIdWithPrefix = journalpostId.includes("-") ? journalpostId : `BID-${journalpostId}`;
        const response = await BIDRAG_DOKUMENT_API.journal.hentJournalpost(journalpostIdWithPrefix);
        return response.data.journalpost?.dokumenter?.[0]?.dokumentreferanse ?? "";
    }

    private static handleOpenDocumentError(err: unknown) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
            OpenDocumentUtils.loginUserBeforeOpen();
        } else {
            throw err;
        }
    }

    public static loginUserBeforeOpen() {
        const currentUrl = window.location.href;
        if (currentUrl.includes("/aapnedokument/")) {
            const authUrl = new URL(currentUrl.replace("/aapnedokument/", "/aapnedokument_auth/"));
            const searchParams = authUrl.searchParams;
            searchParams.set("openInNewWindow", "false");
            const updatedUrl = `${authUrl.origin + authUrl.pathname}?${searchParams.toString()}`;
            window.open(updatedUrl);
        }
    }
}
