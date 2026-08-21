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

    static getÅpneDokumentLenke(
        journalpostid: string,
        dokumentreferanse?: string,
        optimizeForPrint?: boolean,
        openInNewWindow = false,
    ): string {
        const opimizeForPrintQuery = optimizeForPrint != null ? `&optimizeForPrint=${optimizeForPrint}` : "";
        const openInNewWindowQuery = `openInNewWindow=${openInNewWindow ? "true" : "false"}`;
        const dokumentReferanseParam = dokumentreferanse ? "/" + dokumentreferanse : "";
        return `/aapnedokument/${journalpostid}${dokumentReferanseParam}?${openInNewWindowQuery}${opimizeForPrintQuery}`;
    }

    static åpneDokumenter(dokumenter: string[], openInNewWindow = false) {
        window.open(OpenDocumentUtils.getÅpneDokumenterLenke(dokumenter, openInNewWindow));
    }

    static getÅpneDokumenterLenke(dokumenter: string[], openInNewWindow = false) {
        const openInNewWindowQuery = `openInNewWindow=${openInNewWindow ? "true" : "false"}`;
        return `/aapnedokument?${dokumenter.map((d) => `dokument=${d}`).join("&")}&${openInNewWindowQuery}`;
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
            `Åpner dokument med format ${dokumentMetadata?.format}: ${JSON.stringify(dokumentMetadata)}`,
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
                .then((src) => this.openDocumentExternal(src))
                .catch(this.handleOpenDocumentError)
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
            const dokumentreferanse = await this.getDokumentReferanse(journalpostId, dokumentId);
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
            const updatedUrl = authUrl.origin + authUrl.pathname + "?" + searchParams.toString();
            window.open(updatedUrl);
        }
    }
}
