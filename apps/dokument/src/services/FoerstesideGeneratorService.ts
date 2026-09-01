import { DefaultRestService } from "@bidrag/common";

import { fagomradeOptions } from "../common/components/avvik/components/types/AvvikTypes";
import type { Journalpost } from "../types/journalpost";

interface FoerstesideResponse {
    foersteside: string;
    loepenummer: string;
}

export interface OpprettFoerstesideRequest {
    spraakkode: string;
    bruker: {
        brukerId: string;
        brukerType: string;
    };
    tema: string;
    enhetsnummer?: string;
    overskriftstittel: string;
    arkivtittel: string;
    foerstesidetype: string;
    netsPostboks: string;
    navSkjemaId: string;
}

export default class FoerstesideGeneratorService extends DefaultRestService {
    constructor() {
        super("self");
    }
    async opprettFoersteside(request: OpprettFoerstesideRequest): Promise<FoerstesideResponse> {
        try {
            const response = await this.post<FoerstesideResponse>(`/api/proxy/foersteside`, JSON.stringify(request));
            if (!response.ok) {
                throw new Error(
                    `Det skjedde en feil ved opprettelse av førsteside med status=${response.status} og innhold=${response.data}`,
                );
            }
            return response.data;
        } catch (e) {
            console.warn(`Det skjedde en feil`, e);
            throw e;
        }
    }

    opprettFoerstesideRequest(
        journalpost: Journalpost,
        saksbehandlerId: string,
        tema: string,
    ): OpprettFoerstesideRequest {
        const fagomradeName =
            fagomradeOptions.find((option) => option.value === journalpost.fagomrade)?.label ?? journalpost.fagomrade;
        const brukerId = journalpost.gjelderAktor?.ident;
        const skjemaId = "VANL";
        const tittel = `Annet skjema (Del av dokument "${journalpost.innhold}" sendt inn ${journalpost.mottattDatoDisplayValue} til tema ${fagomradeName})`;
        const overskriftstittel = `${skjemaId} ${tittel} (${saksbehandlerId})`;
        return {
            spraakkode: "NB",
            foerstesidetype: "NAV_INTERN",
            bruker: {
                brukerId: brukerId,
                brukerType: "PERSON",
            },
            tema: tema,
            overskriftstittel: overskriftstittel,
            arkivtittel: tittel,
            netsPostboks: "1402",
            navSkjemaId: skjemaId,
        };
    }
}
