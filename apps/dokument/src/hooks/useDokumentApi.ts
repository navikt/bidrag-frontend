import { HentAvvikEnum, IdentType, type JournalpostDto, type JournalpostResponse } from "@bidrag/api/BidragDokumentApi";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { BIDRAG_DOKUMENT_API } from "../api/api";
import {
    type AvvikViewModel,
    BestillNyDistribusjonViewModel,
    BestillOriginalViewModel,
    BestillReskanningViewModel,
    BestillSplittingViewModel,
    EndreFagomradeJoarkViewModel,
    EndreFagomradeViewModel,
    FarskapUtelukketModel,
    FeilforeSakViewModel,
    InngTilUtgDokumentViewModel,
    KopierFraAnnenFagomradeViewModel,
    ManglerAdresseViewModel,
    OverforTilAnnenEnhetViewModel,
    RegistrerReturViewModel,
    SendTilFagomradeViewModel,
    SlettJournalpostViewModel,
    TrekkJournalpostViewModel,
} from "../common/components/avvik/model/AvvikViewModel";
import { showErrorPage } from "../common/components/errorhandling/ErrorUtils";
import { isEmpty } from "../common/utils/ObjectUtils";
import { RedirectTo } from "../common/utils/RedirectUtils";
import { useAppContext } from "../store/AppContext";
import type { LagreJournalpostRequest, RegistrerJournalpostRequest } from "../types/api/JournalpostTypes";
import { HTTPStatus } from "../types/enum/HttpStatus";
import { type Journalpost, JournalpostMapper } from "../types/journalpost";
import { hentPerson } from "./usePersonApi";
export const DokumentQueryKeys = {
    dokument: "dokument",
    hentJournalpost: (journalpostId: string, _saksummer?: string) => ["hentJournalpost", journalpostId],
    hentJournalpostSak: (saksnummer: string) => ["hentJournalpostSak", saksnummer],
    tilgangDokument: (jpId: string, dokref: string) => ["tilgang", jpId, dokref],
    hentAvvikListe: (journalpostId: string, saksnummer?: string) => ["hentAvvikListe", journalpostId, saksnummer],
    hentAvvik: (jpId: string) => [DokumentQueryKeys.dokument, "hentAvvik", jpId],
    hentDistribusjonKanal: (mottakerId: string, gjelderId: string) => ["hentDistribusjonKanal", gjelderId, mottakerId],
};

export function useGetAvvik() {
    const {
        appState: { journalpostId, saksnummer, påloggetEnhet },
    } = useAppContext();
    const { data: jp } = useSuspenseQuery({
        queryKey: DokumentQueryKeys.hentAvvikListe(journalpostId, saksnummer),
        queryFn: async () => {
            if (isEmpty(journalpostId) || isEmpty(påloggetEnhet)) {
                return [];
            }

            const response = await BIDRAG_DOKUMENT_API.journal.hentAvvik(journalpostId, { saksnummer });
            if (response.status > 400) {
                return [];
            }
            if (!saksnummer && response.status === 204) {
                return [];
            }
            return response.data
                .map((avvikType) =>
                    mapAvvik(avvikType, journalpostId?.includes("JOARK-") || journalpostId?.includes("BIF-")),
                )
                .filter((v) => v !== null);
        },
    });
    return jp;
}

export function useResetJournalpost() {
    const queryClient = useQueryClient();
    const {
        appState: { journalpostId },
    } = useAppContext();

    return () => {
        queryClient.invalidateQueries({ queryKey: DokumentQueryKeys.hentJournalpost(journalpostId) });
    };
}
export function useHentJournalpost() {
    const {
        appState: { journalpostId, saksnummer },
        setError,
    } = useAppContext();

    return useSuspenseQuery({
        retry: 2,
        queryKey: DokumentQueryKeys.hentJournalpost(journalpostId),
        queryFn: async () => {
            if (isEmpty(journalpostId)) {
                return {} as Journalpost;
            }
            try {
                const response = await BIDRAG_DOKUMENT_API.journal.hentJournalpost(journalpostId, { saksnummer });
                const jp = await toJournalpost(response.data, saksnummer);
                return jp;
            } catch (error) {
                if (error instanceof AxiosError) {
                    switch (error.response.status) {
                        case HTTPStatus.UNAUTHORIZED:
                        case HTTPStatus.FORBIDDEN:
                            setError(
                                saksnummer
                                    ? `Beklager, du har ingen tilgang til sak ${saksnummer} og journalpost ${journalpostId}`
                                    : `Beklager, du har ingen tilgang til journalpost med id ${journalpostId}`,
                                "Ingen tilgang",
                            );
                            return {} as Journalpost;
                        case HTTPStatus.NOT_FOUND:
                            setError(
                                saksnummer
                                    ? `Fant ingen journalpost med id ${journalpostId} og saksnummer ${saksnummer}`
                                    : `Fant ingen journalpost med id ${journalpostId}`,
                                "Beklager, journalpost ikke funnet",
                            );
                            return {} as Journalpost;
                        default:
                            setError(
                                saksnummer
                                    ? `Beklager, det skjedde en feil ved lasting av journalpost med id ${journalpostId} og saksnummer ${saksnummer}. Vennligst prøv å laste siden på nytt.`
                                    : `Beklager, det skjedde en feil ved lasting av journalpost. Vennligst prøv å laste siden på nytt.`,
                            );
                            return {} as Journalpost;
                    }
                }
                throw error;
            }
        },
    }).data;
}

export const useLagreJournalpost = () => {
    const queryClient = useQueryClient();
    const {
        appState: { journalpostId },
        showErrorMessage,
    } = useAppContext();
    return useMutation<
        boolean,
        any,
        {
            journalpost: LagreJournalpostRequest;
            journalpostId: string;
            enhet: string;
            refresh?: boolean;
        },
        any
    >({
        mutationFn: async ({ journalpost, journalpostId, enhet }) => {
            try {
                await BIDRAG_DOKUMENT_API.journal.patchJournalpost(
                    journalpostId,
                    {
                        ...journalpost,
                        tilknyttSaker: journalpost.tilknyttSaker ?? [],
                        endreDokumenter: journalpost.endreDokumenter ?? [],
                        endreReturDetaljer: journalpost.endreReturDetaljer ?? [],
                        gjelderType: (journalpost.gjelderType as IdentType) ?? IdentType.FNR,
                    },
                    {
                        headers: {
                            "X-Enhet": enhet,
                        },
                    },
                );
                return true;
            } catch (_e) {
                showErrorMessage(["Det skjedde en feil ved lagring av journalpost. Vennligst prøv på nytt."]);
                return false;
            }
        },
        onSuccess: (_, { refresh }) => {
            if (refresh === true) {
                queryClient.invalidateQueries({ queryKey: DokumentQueryKeys.hentJournalpost(journalpostId) });
            }
        },
    });
};
export function useRegistrerJournalpostMutation() {
    return useMutation({
        onSuccess: (_, { journalpost }) => {
            redirectToBehandleSak(journalpost);
        },
        mutationFn: async ({
            journalpost,
            journalpostId,
            påloggetEnhet,
        }: {
            journalpostId: string;
            påloggetEnhet: string;
            journalpost: RegistrerJournalpostRequest;
        }) => {
            try {
                const response = await BIDRAG_DOKUMENT_API.journal.patchJournalpost(
                    journalpostId,
                    {
                        ...journalpost,
                        tilknyttSaker: journalpost.tilknyttSaker ?? [],
                        endreDokumenter: journalpost.endreDokumenter ?? [],
                        endreReturDetaljer: journalpost.endreReturDetaljer ?? [],
                        gjelderType: (journalpost.gjelderType as IdentType) ?? IdentType.FNR,
                    },
                    {
                        headers: {
                            "X-Enhet": påloggetEnhet,
                        },
                    },
                );
                return response.data;
            } catch (error) {
                showErrorPage(error);
            }
        },
    });
}
async function convertAktoerIdToFnr(journalpost: JournalpostDto): Promise<JournalpostDto> {
    if (journalpost?.gjelderAktor?.type === IdentType.AKTOERID) {
        const aktoerId = journalpost.gjelderAktor.ident;
        const person = await hentPerson(aktoerId);
        journalpost.gjelderAktor.ident = person.ident;
        journalpost.gjelderAktor.type = IdentType.FNR;
    }
    return journalpost;
}
async function toJournalpost(journalpostResponse: JournalpostResponse, saksnummer?: string): Promise<Journalpost> {
    journalpostResponse.journalpost = await convertAktoerIdToFnr(journalpostResponse.journalpost);
    return new JournalpostMapper(
        journalpostResponse.journalpost,
        saksnummer,
        journalpostResponse.sakstilknytninger,
    ).map();
}

function mapAvvik(avvikType: HentAvvikEnum, isForsendelseEllerJoarkJournalpost: boolean): AvvikViewModel {
    switch (avvikType) {
        case HentAvvikEnum.FARSKAP_UTELUKKET:
            return new FarskapUtelukketModel();
        case HentAvvikEnum.KOPIER_FRA_ANNEN_FAGOMRADE:
            return new KopierFraAnnenFagomradeViewModel();
        case HentAvvikEnum.BESTILL_ORIGINAL:
            return new BestillOriginalViewModel();
        case HentAvvikEnum.BESTILL_RESKANNING:
            return new BestillReskanningViewModel();
        case HentAvvikEnum.FEILFORE_SAK:
            return new FeilforeSakViewModel();
        case HentAvvikEnum.BESTILL_SPLITTING:
            return new BestillSplittingViewModel();
        case HentAvvikEnum.OVERFOR_TIL_ANNEN_ENHET:
            return new OverforTilAnnenEnhetViewModel();
        case HentAvvikEnum.SEND_TIL_FAGOMRADE:
            return new SendTilFagomradeViewModel();
        case HentAvvikEnum.ENDRE_FAGOMRADE:
            if (isForsendelseEllerJoarkJournalpost) {
                return new EndreFagomradeJoarkViewModel();
            }
            return new EndreFagomradeViewModel();
        case HentAvvikEnum.INNG_TIL_UTG_DOKUMENT:
            return new InngTilUtgDokumentViewModel();
        case HentAvvikEnum.SLETT_JOURNALPOST:
            return new SlettJournalpostViewModel();
        case HentAvvikEnum.TREKK_JOURNALPOST:
            return new TrekkJournalpostViewModel();
        case HentAvvikEnum.REGISTRER_RETUR:
            return new RegistrerReturViewModel();
        case HentAvvikEnum.BESTILL_NY_DISTRIBUSJON:
            return new BestillNyDistribusjonViewModel();
        case HentAvvikEnum.MANGLER_ADRESSE:
            return new ManglerAdresseViewModel();
        default:
            return null;
    }
}
function redirectToBehandleSak(registrertJournalpost: RegistrerJournalpostRequest) {
    const firstSaksnummerFromListToRegister: string = registrertJournalpost.tilknyttSaker[0];
    RedirectTo.behandleSak(firstSaksnummerFromListToRegister);
}
