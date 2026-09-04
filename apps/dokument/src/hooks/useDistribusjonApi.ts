import type { DistribuerJournalpostRequest, DistribuerTilAdresse } from "@bidrag/api/BidragDokumentApi";
import { LoggerService, SecureLoggerService } from "@bidrag/common";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { BIDRAG_DOKUMENT_API, BIDRAG_DOKUMENT_ARKIVERING_API } from "../api/api";
import { useHentJournalpost } from "./useDokumentApi";

export const useKanDistribuereJournalpost = () => {
    const journalpost = useHentJournalpost();

    return useSuspenseQuery({
        queryKey: ["kanDistribuereJournalpost"],
        queryFn: async () => {
            try {
                const response = await BIDRAG_DOKUMENT_API.journal.kanDistribuerJournalpost(journalpost.journalpostId);
                return response.status === 200;
            } catch (e) {
                LoggerService.warn(`Kan ikke distribuere journalpost ${e}`);
                return false;
            }
        },
    }).data;
};
export const useDistribuerJournalpost = () => {
    return useMutation({
        mutationFn: async ({
            journalpostId,
            paloggetenhet,
            lokalUtskrift,
            distribuerTilAdresse,
        }: {
            journalpostId: string;
            paloggetenhet: string;
            lokalUtskrift?: boolean;
            distribuerTilAdresse?: DistribuerTilAdresse;
        }) => {
            const distribuerRequest = { adresse: distribuerTilAdresse, lokalUtskrift: false };
            SecureLoggerService.info(
                `Distribuerer journalpost ${journalpostId} med lokalUtskrift=${lokalUtskrift} til adresse ${JSON.stringify(
                    distribuerTilAdresse,
                )}`,
            );
            if (lokalUtskrift) {
                return markerSendtLokalt(journalpostId, paloggetenhet);
            } else {
                return bestillDistribusjon(journalpostId, paloggetenhet, distribuerRequest);
            }
        },
    });
};

async function markerSendtLokalt(bidJournalpost: string, paaloggetEnhet: string) {
    return await BIDRAG_DOKUMENT_API.journal.distribuerJournalpost(bidJournalpost, { lokalUtskrift: true }, null, {
        headers: {
            "X-Enhet": paaloggetEnhet,
        },
    });
}

async function bestillDistribusjon(
    journalpostId: string,
    paaloggetEnhet: string,
    distribuerJournalpostRequest?: DistribuerJournalpostRequest,
) {
    let distribuerJournalpostId = journalpostId;
    if (journalpostId.startsWith("BID")) {
        // TODO: `bidrag-dokument-arkiv`-klienten (@bidrag/api) genererer for tiden ikke et
        // "arkivere journalpost i Joark"-endepunkt tilsvarende det gamle `api.arkivereJournalpost`.
        // Kastes eksplisitt her i stedet for å late som kallet er trygt, inntil endepunktet
        // finnes i det genererte API-et.
        const response = await (
            BIDRAG_DOKUMENT_ARKIVERING_API as unknown as {
                api: {
                    arkivereJournalpost: (
                        journalpostId: string,
                        params: { headers: Record<string, string> },
                    ) => Promise<{
                        data: { journalstatus: string; journalpostFerdigstilt: boolean; jpIdJoark: string };
                    }>;
                };
            }
        ).api.arkivereJournalpost(journalpostId, {
            headers: {
                "X-Enhet": paaloggetEnhet,
            },
        });
        const data = response.data;
        LoggerService.info(
            `Arkivert journalpost ${journalpostId} i Joark med status=${data.journalstatus} og ferdigstillt=${data.journalpostFerdigstilt}`,
        );
        const joarkJpId = data.jpIdJoark.replace("JOARK-", "");
        distribuerJournalpostId = `JOARK-${joarkJpId}`;
    }

    const response = await BIDRAG_DOKUMENT_API.journal.distribuerJournalpost(
        distribuerJournalpostId,
        distribuerJournalpostRequest,
    );
    LoggerService.info(`Journalpost distribusjon bestillt med bestillingsId=${response.data?.bestillingsId}`);
    return response;
}
