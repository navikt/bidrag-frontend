import type { Avvikshendelse } from "@bidrag/api/BidragDokumentApi";

import { LoggerService } from "@bidrag/common";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BIDRAG_DOKUMENT_API } from "../api/api";
import { useJournalpost } from "../store/JournalpostContext";
import { AvvikType } from "../types/api/AvvikTypes";
import type { Avvik } from "../types/avvik";
import { DokumentQueryKeys } from "./useDokumentApi";

export const useSendAvvikMutation = () => {
    const queryClient = useQueryClient();
    const { setAvvikState } = useJournalpost();
    return useMutation<boolean, any, any, any>({
        mutationFn: async ({
            avvik,
            journalpostId,
            paloggetEnhet,
            saksnummer,
        }: {
            avvik: Avvik;
            journalpostId: string;
            paloggetEnhet: string;
            saksnummer?: string;
        }) => {
            setAvvikState("pending");
            try {
                LoggerService.info(`Sender avvik ${avvik.type} for journalpostid ${journalpostId}`);
                const body = getBodyForAvvikType(avvik, saksnummer);
                const avvikResponse = await BIDRAG_DOKUMENT_API.journal.behandleAvvik(journalpostId, body, {
                    headers: {
                        "X-Enhet": paloggetEnhet,
                    },
                });
                if (avvikResponse.status !== 200) {
                    setAvvikState("failure");
                    return false;
                }
                if (skalKunneViderebehandleJournalpostEtterUtførtAvvik(avvik.type)) {
                    setAvvikState("success_continue");
                    queryClient.invalidateQueries({ queryKey: DokumentQueryKeys.hentJournalpost(journalpostId) });
                } else {
                    setAvvikState("success_lock");
                }

                return true;
            } catch (e) {
                setAvvikState("failure");
                return false;
            }
        },
    });
};

function skalKunneViderebehandleJournalpostEtterUtførtAvvik(avvik: string) {
    return ![
        AvvikType.OVERFOR_TIL_ANNEN_ENHET,
        AvvikType.TREKK_JOURNALPOST,
        AvvikType.SLETT_JOURNALPOST,
        AvvikType.BESTILL_NY_DISTRIBUSJON,
        AvvikType.MANGLER_ADRESSE,
        AvvikType.BESTILL_SPLITTING,
        AvvikType.BESTILL_RESKANNING,
        AvvikType.KOPIER_FRA_ANNEN_FAGOMRADE,
        AvvikType.ENDRE_FAGOMRADE,
        AvvikType.FARSKAP_UTELUKKET,
        AvvikType.FEILFORE_SAK,
    ].some((avvikType) => avvikType === avvik);
}
const getBodyForAvvikType = (avvik: Avvik, saksnummer: string): Avvikshendelse => {
    const { type: avvikType, ...otherValues } = avvik;
    const baseBody = { avvikType, saksnummer, detaljer: {} };
    switch (avvik.type) {
        case AvvikType.BESTILL_ORIGINAL:
            return { ...baseBody, detaljer: { enhetsnummer: avvik.enhetsnummer } };
        case AvvikType.BESTILL_RESKANNING:
            return { ...baseBody, beskrivelse: avvik.beskrivelse };
        case AvvikType.BESTILL_SPLITTING:
            return { ...baseBody, beskrivelse: avvik.beskrivelse };
        case AvvikType.ENDRE_FAGOMRADE:
            return {
                ...baseBody,
                /// @ts-ignore
                detaljer: { fagomrade: avvik.fagomrade, bekreftetSendtScanning: avvik.bekreftetSendtScanning },
            };
        case AvvikType.SEND_TIL_FAGOMRADE:
            return {
                ...baseBody,
                detaljer: { fagomrade: avvik.fagomrade, dokumenter: avvik.dokumenter },
            };
        case AvvikType.INNG_TIL_UTG_DOKUMENT:
            return baseBody;
        case AvvikType.FEILFORE_SAK:
            return { ...baseBody, saksnummer: avvik.saksnummer ?? saksnummer };
        case AvvikType.SLETT_JOURNALPOST:
            return baseBody;
        case AvvikType.TREKK_JOURNALPOST:
            return { ...baseBody, beskrivelse: avvik.beskrivelse };
        case AvvikType.REGISTRER_RETUR:
            return {
                ...baseBody,
                beskrivelse: avvik.beskrivelse,
                detaljer: { returDato: avvik.returDato },
            };
        case AvvikType.OVERFOR_TIL_ANNEN_ENHET:
            /// @ts-ignore
            return { ...baseBody, detaljer: { ...otherValues } };
        case AvvikType.FARSKAP_UTELUKKET:
            return baseBody;
        case AvvikType.MANGLER_ADRESSE:
            return baseBody;
        case AvvikType.BESTILL_NY_DISTRIBUSJON:
            return { ...baseBody, adresse: avvik.adresse };
        case AvvikType.KOPIER_FRA_ANNEN_FAGOMRADE:
            return {
                ...baseBody,
                /// @ts-ignore

                dokumenter: avvik.relevanteDokumenter,
                detaljer: { knyttTilSaker: avvik.knyttTilSaker.join(",") },
            };
        default:
            throw Error(`Send avvik - unexpected avvikType: ${avvik}`);
    }
};
