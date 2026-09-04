import type { DokumentDto, DokumentTilgangResponse, JournalpostDto } from "@bidrag/api/BidragDokumentApi";
import {
    type BestemKanalResponse,
    BestemKanalResponseDistribusjonskanalEnum,
} from "@bidrag/api/BidragDokumentArkivApi";
import type { HentDokumentValgRequest } from "@bidrag/api/BidragForsendelseApi";
import { type UseSuspenseQueryResult, useSuspenseQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useBidragDokumentApi, useBidragDokumentArkivApi, useBidragForsendelseApi } from "../api/api";
import { useSession } from "../pages/forsendelse/context/SessionContext";
import type { AvvikType } from "../types/AvvikTypes";
import type { IDokumentJournalDto, IJournalpost } from "../types/Journalpost";
import { useHentNavSkjemaer } from "./kodeverkQueries";
import { useHentForsendelseQuery, useHentStørrelseIMb } from "./useForsendelseApi";

const DokumentQueryKeys = {
    dokument: "dokument",
    hentJournal: (saksnummer: string) => [DokumentQueryKeys.dokument, "journal", saksnummer],
    hentJournalpost: (jpId: string) => [DokumentQueryKeys.dokument, "hentJournalpost", jpId],
    tilgangDokument: (jpId: string, dokref: string) => [DokumentQueryKeys.dokument, "tilgang", jpId, dokref],
    hentAvvikListe: (jpId: string) => [DokumentQueryKeys.dokument, "hentAvvikListe", jpId],
    hentAvvik: (jpId: string) => [DokumentQueryKeys.dokument, "hentAvvik", jpId],
    hentDistribusjonKanal: (mottakerId: string, gjelderId: string) => [
        DokumentQueryKeys.dokument,
        "hentDistribusjonKanal",
        gjelderId,
        mottakerId,
    ],
};

export const useDokumentMalDetaljerForsendelseV2 = () => {
    const { forsendelseId } = useSession();
    const bidragForsendelseApi = useBidragForsendelseApi();
    return useSuspenseQuery({
        queryKey: ["dokumentMalDetaljerV2", forsendelseId],
        queryFn: () => bidragForsendelseApi.api.hentDokumentValgForForsendelseV2(forsendelseId),
        select: (data) => data.data,
    });
};

export const useDokumentMalDetaljer2 = (request: HentDokumentValgRequest) => {
    const { enhet } = useSession();
    const bidragForsendelseApi = useBidragForsendelseApi();
    return useSuspenseQuery({
        queryKey: [
            "dokumentMalDetaljerV2",
            request.behandlingType,
            request.vedtakType,
            request.soknadFra,
            request.erFattetBeregnet,
            enhet,
        ],
        queryFn: () => bidragForsendelseApi.api.hentDokumentValgV2({ ...request, enhet }),
        select: (data) => data.data,
        retry: (failureCount, error: AxiosError) => {
            if (error.response.status === 400) return false;
            return failureCount < 3;
        },
    });
};

export const useHentNotatMalDetaljer = (request: HentDokumentValgRequest) => {
    const { enhet } = useSession();
    const bidragForsendelseApi = useBidragForsendelseApi();
    return useSuspenseQuery({
        queryKey: ["notatDetaljer", request?.vedtakType],
        queryFn: () => bidragForsendelseApi.api.hentDokumentValgNotater({ ...request, enhet }),
        select: (data) => data.data,
    });
};

export const useHentJournalpost = (journalpostId: string) => {
    const bidragDokumentApi = useBidragDokumentApi();
    return useSuspenseQuery({
        queryKey: DokumentQueryKeys.hentJournalpost(journalpostId),
        queryFn: () => bidragDokumentApi.journal.hentJournalpost(journalpostId),
        select: (data): IJournalpost => journalpostMapper(data.data.journalpost, data.data.sakstilknytninger),
    });
};

export const useHentDokumentUrl = (
    journalpostId: string,
    dokumentreferanse?: string,
): UseSuspenseQueryResult<DokumentTilgangResponse> => {
    const { enhet } = useSession();
    const bidragDokumentApi = useBidragDokumentApi();
    return useSuspenseQuery({
        queryKey: DokumentQueryKeys.tilgangDokument(journalpostId, dokumentreferanse),
        queryFn: () =>
            bidragDokumentApi.tilgang.giTilgangTilDokument(journalpostId, dokumentreferanse, {
                headers: {
                    "X-enhet": enhet,
                },
            }),
        select: (data) => {
            return data.data as DokumentTilgangResponse;
        },
    });
};

export const useHentAvvikListe = (
    _journalpostId: string,
    saksnummer?: string,
    enhet?: string,
): UseSuspenseQueryResult<AvvikType[]> => {
    const bidragDokumentApi = useBidragDokumentApi();
    const journalpostId = _journalpostId.startsWith("BIF") ? _journalpostId : `BIF-${_journalpostId}`;
    return useSuspenseQuery({
        queryKey: DokumentQueryKeys.hentAvvikListe(journalpostId),
        queryFn: () => {
            try {
                return bidragDokumentApi.journal.hentAvvik(
                    journalpostId,
                    { saksnummer },
                    {
                        headers: {
                            "X-enhet": enhet,
                        },
                    },
                );
            } catch {
                return { data: [] };
            }
        },

        select: (data) => {
            return data.data as AvvikType[];
        },
    });
};

export const useDistribusjonKanal = (): BestemKanalResponse => {
    const bidragDokumentArkivApi = useBidragDokumentArkivApi();
    const forsendelse = useHentForsendelseQuery();
    const størrelseIMb = useHentStørrelseIMb();
    const gjelderId = forsendelse.gjelderIdent;
    const mottakerId = forsendelse.mottaker?.ident;
    const result = useSuspenseQuery({
        queryKey: DokumentQueryKeys.hentDistribusjonKanal(mottakerId, mottakerId),
        queryFn: async () => {
            if (!mottakerId)
                return {
                    distribusjonskanal: BestemKanalResponseDistribusjonskanalEnum.PRINT,
                    regelBegrunnelse: "Gjelder er ulik mottaker",
                    regel: "",
                };
            try {
                return (
                    await bidragDokumentArkivApi.journal.hentDistribusjonKanal({
                        mottakerId,
                        gjelderId,
                        tema: forsendelse.tema,
                        forsendelseStoerrelse: størrelseIMb,
                    })
                )?.data;
            } catch {
                return {
                    distribusjonskanal: BestemKanalResponseDistribusjonskanalEnum.PRINT,
                    regelBegrunnelse: "Gjelder er ulik mottaker",
                    regel: "",
                };
            }
        },
    });

    return result.data;
};

const useHentJournal = () => {
    const { saksnummer } = useSession();
    const bidragDokumentApi = useBidragDokumentApi();
    return useSuspenseQuery({
        queryKey: DokumentQueryKeys.hentJournal(saksnummer),
        queryFn: async () => {
            return await bidragDokumentApi.sak.hentJournal(
                saksnummer,
                { fagomrade: ["BID", "FAR"] },
                {
                    paramsSerializer: {
                        indexes: null,
                    },
                },
            );
        },
    }).data;
};

export const useHentJournalInngående = () => {
    const forsendelse = useHentForsendelseQuery();
    const navskjemaer = useHentNavSkjemaer();
    const skjemaIder = navskjemaer
        .map((skjema) => skjema.kode)
        .filter((kode) => !kode.toLowerCase().startsWith("nave"));
    const journalposter = useHentJournal();
    return journalposter.data
        .filter((jp) => jp.gjelderAktor?.ident === forsendelse.gjelderIdent)
        .filter((jp) => jp.dokumentType === "I")
        .filter((jp) => jp.dokumenter.some((d) => skjemaIder.includes(d.dokumentmalId)));
};

export enum DistribusjonKanalUkjentEnum {
    UKJENT,
}

export function journalpostMapper(journalpost: JournalpostDto, sakstilknytninger?: string[]): IJournalpost {
    const isForsendelse = () => journalpost.journalpostId?.startsWith("BIF");
    const journalpostIdNoPrefix = () => journalpost.journalpostId?.replace(/\D/g, "");

    return {
        ...journalpost,
        erForsendelse: isForsendelse(),
        sakstilknytninger: journalpost.sakstilknytninger ?? sakstilknytninger,
        journalpostIdNoPrefix: journalpostIdNoPrefix(),
        dokumentDato: journalpost.dokumentDato ?? journalpost.journalfortDato,
        dokumenter: journalpost.dokumenter.map((dokument) => dokumentMapper(journalpost, dokument)),
    };
}
export function dokumentMapper(journalpost: JournalpostDto, dokument: DokumentDto): IDokumentJournalDto {
    return {
        ...dokument,
        journalpostId: journalpost.journalpostId,
        originalJournalpostId: dokument.metadata?.originalJournalpostId,
        originalDokumentreferanse: dokument.metadata?.originalDokumentreferanse,
    };
}
