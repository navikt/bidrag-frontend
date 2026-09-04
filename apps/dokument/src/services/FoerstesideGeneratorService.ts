import { BIDRAG_FORSTESIDE_API } from "@bidrag/api";
import type { PostFoerstesideRequest } from "@bidrag/api/BidragForstesideApi";

import { fagomradeOptions } from "../common/components/avvik/components/types/AvvikTypes";
import type { Journalpost } from "../types/journalpost";

interface FoerstesideResponse {
    foersteside: string;
    loepenummer: string;
}

export type OpprettFoerstesideRequest = PostFoerstesideRequest;

export default class FoerstesideGeneratorService {
    async opprettFoersteside(request: OpprettFoerstesideRequest): Promise<FoerstesideResponse> {
        try {
            const { data } = await BIDRAG_FORSTESIDE_API.api.postNew(request, {
                headers: { "Nav-Consumer-Id": "bidrag-frontend" },
            });
            // `foersteside` er en base64-enkodet PDF (OpenAPI `format: byte`), som
            // konsumentene dekoder videre med FileUtils._base64ToArrayBuffer.
            return {
                foersteside: (data.foersteside ?? "") as unknown as string,
                loepenummer: data.loepenummer ?? "",
            };
        } catch (e) {
            console.warn(`Det skjedde en feil ved opprettelse av førsteside`, e);
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
