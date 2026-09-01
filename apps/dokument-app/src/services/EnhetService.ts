import { DefaultRestService } from "@navikt/bidrag-ui-common";

import { isEmpty } from "../common/utils/ObjectUtils";
import SecuritySessionUtils from "../common/utils/SecuritySessionUtils";
import environment from "../environment";
import type { EnhetDto } from "../types/api/EnhetTypes";
import type { Enhet } from "../types/enhet";
import { HTTPStatus } from "../types/enum/HttpStatus";

export default class EnhetService extends DefaultRestService {
    constructor() {
        super("bidrag-organisasjon", environment.url.bidragOrganisasjon + "/bidrag-organisasjon");
    }
    async hentEnhetInfo(enhetNr: string): Promise<Enhet> {
        if (isEmpty(enhetNr)) {
            return { enhetIdent: enhetNr };
        }
        try {
            const response = await this.get<EnhetDto>(`/enhet/info/${enhetNr}`);
            const data = response.data;
            return {
                enhetNavn: data.enhetNavn,
                enhetIdent: data.enhetIdent,
            };
        } catch (e) {
            console.warn(`Det skjedde en feil ved henting av enhet ${enhetNr}`);
            return { enhetIdent: enhetNr };
        }
    }

    async hentEnhetlist() {
        const saksbehandlerId = await SecuritySessionUtils.hentSaksbehandlerId();
        const response = await this.get<Enhet[]>(`/saksbehandler/enhetsliste/${saksbehandlerId}`);
        return response.data;
    }

    async hentJournalFoerendeEnheter(): Promise<Enhet[]> {
        const response = await this.get<Enhet[]>(`/arbeidsfordeling/enhetsliste/journalforende`);
        if (!response.ok) {
            return [];
        }
        return response.data;
    }

    async hentPersonGeografiskEnhet(personNummer: string): Promise<Enhet> {
        if (isEmpty(personNummer)) {
            return { enhetNavn: "Ukjent", enhetIdent: "" };
        }

        const response = await this.get<Enhet>(`/arbeidsfordeling/enhetsliste/geografisktilknytning/${personNummer}`);

        if (response.status === HTTPStatus.NO_CONTENT) {
            return { enhetNavn: "Ukjent", enhetIdent: "" };
        }
        return response.data;
    }
}
