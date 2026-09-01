import {
    type EditDocumentBroadcastMessage,
    EditorConfigStorage,
    FileUtils,
    LoggerService,
    SecureLoggerService,
} from "@navikt/bidrag-ui-common";

import type { ApiError } from "../../../../bidrag-ui-common/src";
import DokumentService from "../../services/DokumentService";
import JournalpostService from "../../services/JournalpostService";
import { DokumentFormat } from "../../types/api/DokumentTypes";
import { JournalStatus } from "../../types/api/JournalpostTypes";

export interface OpenDocumentProps {
    journalpostId: string;
    dokumentreferanse?: string;
    dokumenter?: string[];
    documentByte?: ArrayBuffer | string;
    closeTabAfterOpen?: boolean;
    openInNewTab?: boolean;
    openInBrowser?: boolean;
    resizeToA4?: boolean;
    optimizeForPrint?: boolean;
    retryCount?: number;
}

export class OpenDocumentUtils {
    static openDocumentEditorWithDocuments(
        dokumenter: string[],
        editedDocument?: EditDocumentBroadcastMessage,
        id?: string,
    ) {
        LoggerService.info(`Åpner dokumenter ${dokumenter} på nettleser`);
        const dokumenterPath = dokumenter.map((dokument) => `dokument=${dokument}`).join("&");
        id && editedDocument && EditorConfigStorage.save(id, editedDocument?.config);
        window.open(`/rediger/?${dokumenterPath}&id=${id}`);
    }

    static openDocumentEditor(
        journalpostId: string,
        dokumentReferanse?: string,
        editedDocument?: EditDocumentBroadcastMessage,
        id?: string,
    ) {
        LoggerService.info(`Åpner dokument ${journalpostId} på nettleser`);
        id && editedDocument && EditorConfigStorage.save(id, editedDocument?.config);
        window.open(`/rediger/${journalpostId}${dokumentReferanse ? "/" + dokumentReferanse : ""}?id=${id}`);
    }

    static openDocumentsInBrowser(
        dokumenter: string[],
        openInNewTab: boolean,
        resizeToA4: boolean,
        optimizeForPrint: boolean,
    ) {
        LoggerService.info(`Åpner dokumenter ${dokumenter} på nettleser med optimizeForPrint=${optimizeForPrint}`);
        new DokumentService()
            .getDokumenter(dokumenter, resizeToA4, optimizeForPrint)
            .then((response) => FileUtils.openFile(response, openInNewTab))
            .catch(OpenDocumentUtils.handleOpenDocumentError);
    }

    static openBidragJournalpostInBrowser(
        journalpostId: string,
        dokumentId: string,
        openInNewTab: boolean,
        resizeToA4: boolean,
    ): Promise<string | null> {
        LoggerService.info(
            `Prøver å åpne dokument med journalpostId ${journalpostId} og dokumentId ${dokumentId} på nettleser`,
        );
        const journalpostIdWithPrefix = journalpostId.includes("-") ? journalpostId : `BID-${journalpostId}`;
        return new JournalpostService().hentJournalpost(journalpostIdWithPrefix).then((journalpost) => {
            const isUnderProduksjon = journalpost.journalstatus === JournalStatus.UNDER_PRODUKSJON;
            if (isUnderProduksjon) {
                return OpenDocumentUtils.launchDokumentReaderWithIframe(journalpostId, dokumentId);
            } else {
                OpenDocumentUtils.openDocumentInBrowser(journalpostId, dokumentId, openInNewTab, resizeToA4, true);
            }
            return null;
        });
    }

    static openDocumentInBrowser(
        journalpostId: string,
        dokumentId: string,
        openInNewTab: boolean,
        resizeToA4: boolean,
        optimizeForPrint: boolean,
    ) {
        SecureLoggerService.info(
            `Åpner dokument med journalpostid ${journalpostId} og dokumentreferanse ${dokumentId} på nettleser med parameter optimizeForPrint=${optimizeForPrint}`,
        );
        const journalpostIdWithPrefix = journalpostId.includes("-") ? journalpostId : `BID-${journalpostId}`;
        return new DokumentService()
            .getDokument(journalpostIdWithPrefix, dokumentId, resizeToA4, optimizeForPrint)
            .then((response) => FileUtils.openFile(response, openInNewTab))
            .catch(OpenDocumentUtils.handleOpenDocumentError);
    }

    static async getDokumentReferanse(journalpostId: string, dokumentId: string): Promise<string> {
        if (dokumentId) {
            return dokumentId;
        }
        const journalpostIdWithPrefix = journalpostId.includes("-") ? journalpostId : `BID-${journalpostId}`;
        return new JournalpostService()
            .hentJournalpost(journalpostIdWithPrefix)
            .then((journalpost) => journalpost.dokumenter[0].dokumentreferanse);
    }

    static async launchDokumentReaderWithIframe(journalpostId: string, dokumentId: string) {
        LoggerService.info(
            `Åpner dokument med journalpostid ${journalpostId} og dokumentreferanse ${dokumentId} i brevklient`,
        );
        try {
            const dokumentreferanse = await OpenDocumentUtils.getDokumentReferanse(journalpostId, dokumentId);
            return await new DokumentService().getDokumentUrl(dokumentreferanse, journalpostId);
        } catch (error) {
            LoggerService.error("Feilet under henting av dokument addresse: ", error);
            window.alert("Feilet under henting av dokument addresse");
            return Promise.reject(error);
        }
    }

    static async openDocument(props: OpenDocumentProps) {
        const {
            journalpostId,
            dokumentreferanse,
            dokumenter,
            documentByte,
            openInNewTab,
            closeTabAfterOpen,
            resizeToA4,
            openInBrowser,
            optimizeForPrint,
            retryCount,
        } = props;
        if (documentByte) {
            FileUtils.openFile(documentByte, true);
            return;
        }

        if (dokumenter && dokumenter.length > 0) {
            return OpenDocumentUtils.openDocumentsInBrowser(dokumenter, openInNewTab, resizeToA4, optimizeForPrint);
        }

        const dokumentMetadataList = await new DokumentService().getDokumentMetadata(journalpostId, dokumentreferanse);
        if (dokumentMetadataList.length == 0 || dokumentMetadataList.length > 1) {
            return OpenDocumentUtils.openDocumentInBrowser(
                journalpostId,
                dokumentreferanse,
                openInNewTab,
                resizeToA4,
                optimizeForPrint,
            );
        }

        const dokumentMetadata = dokumentMetadataList[0];
        const dokumentJournalpostId = dokumentMetadata.journalpostId ?? journalpostId;

        if (dokumentMetadata.status == "UNDER_PRODUKSJON") {
            const currentRetryCount = retryCount ?? 0;
            if (retryCount >= 3) {
                throw Error(
                    "Kan ikke åpne dokument under produksjon. Vennligst vent til dokumentet er ferdigprodusert.",
                );
            }
            return new Promise((resolve, reject) =>
                setTimeout(
                    () =>
                        OpenDocumentUtils.openDocument({ ...props, retryCount: currentRetryCount + 1 })
                            .then(resolve)
                            .catch(reject),
                    1000 * (currentRetryCount + 1),
                ),
            );
        }

        LoggerService.info(`Åpner dokument med format ${dokumentMetadata.format}: ${JSON.stringify(dokumentMetadata)}`);
        if (dokumentMetadata.status == "FERDIGSTILT" && openInBrowser) {
            return OpenDocumentUtils.openDocumentInBrowser(
                dokumentJournalpostId,
                dokumentMetadata.dokumentreferanse,
                openInNewTab,
                resizeToA4,
                optimizeForPrint,
            );
        } else if (dokumentMetadata.format == DokumentFormat.MBDOK) {
            return OpenDocumentUtils.launchDokumentReaderWithIframe(
                dokumentJournalpostId,
                dokumentMetadata.dokumentreferanse,
            )
                .then((src) => OpenDocumentUtils.openDocumentExternal(src))
                .catch(OpenDocumentUtils.handleOpenDocumentError)
                .then(() => {
                    if (closeTabAfterOpen) {
                        setTimeout(() => window.close(), 400);
                    }
                });
        }

        return OpenDocumentUtils.openDocumentInBrowser(
            dokumentJournalpostId,
            dokumentMetadata.dokumentreferanse,
            openInNewTab,
            resizeToA4,
            optimizeForPrint,
        );
    }

    private static handleOpenDocumentError(err: ApiError) {
        if (err.status === 401) {
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

    static openDocumentExternal(src: string) {
        const iframeElement = document.createElement("iframe");
        iframeElement.src = src;
        document.body.appendChild(iframeElement);
        setTimeout(() => iframeElement.remove(), 400);
    }
}
