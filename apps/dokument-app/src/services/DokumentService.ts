import { DefaultRestService, type FileData, LoggerService } from "@navikt/bidrag-ui-common";

import { isEmpty } from "../common/utils/ObjectUtils";
import environment from "../environment";
import ApiError from "../types/api/ApiError";
import type { DokumentMetadata, DokumentTilgangResponse, DokumentUrl } from "../types/api/DokumentTypes";

export default class DokumentService extends DefaultRestService {
    constructor() {
        super(
            `bidrag-dokument${environment.system.legacyEnvironment ? `-${environment.system.legacyEnvironment}` : ""}`,
            environment.url.bidragDokument + "/bidrag-dokument",
        );
    }
    async getDokumentUrl(dokumentreferanse: string, journalpostId?: string): Promise<DokumentUrl> {
        if (isEmpty(journalpostId)) {
            return this.getDokumentUrlByDokumentreferanse(dokumentreferanse);
        }
        const response = await this.get<DokumentTilgangResponse>(`/tilgang/${journalpostId}/${dokumentreferanse}`);
        return response.data.dokumentUrl;
    }

    async getDokumentUrlByDokumentreferanse(dokumentreferanse: string): Promise<DokumentUrl> {
        if (isEmpty(dokumentreferanse)) {
            return "";
        }
        const response = await this.get<DokumentTilgangResponse>(`/tilgang/dokumentreferanse/${dokumentreferanse}`);
        return response.data.dokumentUrl;
    }

    async getDokument(
        journalpostId: string,
        dokumentId: string,
        resizeToA4?: boolean,
        _optimizeForPrint?: boolean,
    ): Promise<FileData> {
        const dokumentReferansePath = dokumentId ? `/${dokumentId}` : "";

        const optimizeForPrint = _optimizeForPrint == null ? true : _optimizeForPrint;
        const response = await this.get<ArrayBuffer>(
            `/dokument/${journalpostId}${dokumentReferansePath}?resizeToA4=${resizeToA4}&optimizeForPrint=${optimizeForPrint}`,
        );
        LoggerService.info(
            `Hentet dokument med journalpostId ${journalpostId} og dokumentId ${dokumentId} og resizeToA4=${resizeToA4}.`,
        );
        if (!response.ok) {
            throw new ApiError("Det skjedde en feil ved henting av dokument", "", "", response.status);
        }

        return response.data;
    }

    async getDokumentMetadata(journalpostId: string, dokumentId: string): Promise<DokumentMetadata[]> {
        const dokumentReferansePath = dokumentId ? `/${dokumentId}` : "";

        const response = await this.options<DokumentMetadata[]>(`/dokument/${journalpostId}${dokumentReferansePath}`);
        LoggerService.info(`Hentet dokument metadata for journalpostId ${journalpostId} og dokumentId ${dokumentId}.`);
        if (!response.ok) {
            LoggerService.error(
                `Det skjedde en feil ved henting av dokument metadata for journalpostId ${journalpostId} og dokumentId ${dokumentId}.`,
                new Error(""),
            );
            return [];
        }

        return response.data;
    }

    async getDokumenter(dokumenter: string[], printable: boolean, optimizeForPrint?: boolean): Promise<FileData> {
        const dokumenterPath = dokumenter.map((dokument) => `dokument=${dokument}`).join("&");
        const response = await this.get<ArrayBuffer>(
            `/dokument?${dokumenterPath}&resizeToA4=${printable}&optimizeForPrint=${optimizeForPrint ?? true}`,
        );
        LoggerService.info(`Hentet dokumenter ${dokumenter} og resizeToA4=${printable}.`);
        if (!response.ok) {
            throw new ApiError("Det skjedde en feil ved henting av dokument", "", "", response.status);
        }
        return response.data;
    }
}
