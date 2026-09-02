import type { EnhetDto } from "@bidrag/api/OrganisasjonApi";
import { type BidragssakDto, Rolletype } from "@bidrag/api/SakApi";
import { type QueryClient, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { SAK_API } from "../api/api";
import { isEmpty } from "../common/utils/ObjectUtils";
import Validator from "../common/utils/Validators";
import { useAppContext } from "../store/AppContext";
import SakMapper from "../store/mappers/SakMapper";
import { useSearch } from "../store/SearchContext";
import type { InternalRolleDto, Kategori, SakStatus } from "../types/api/SakTypes";
import type { Journalpost } from "../types/journalpost";
import { erSamhandlerId, type Person } from "../types/person";
import type { Sak } from "./../types/sak";
import { DokumentQueryKeys, useHentJournalpost } from "./useDokumentApi";
import { OrganisasjonQueryFunctions } from "./useOrganisasjonApi";
import { hentPerson, PersonApiQueryKeys, PersonQueryFunctions, useHentGjelder } from "./usePersonApi";

export const SakApiQueryKeys = {
    hentSakerForPerson: (ident: string) => ["hentSakerForPerson", ident],
    hentSakerForJournalpost: (journalpostId: string) => ["hentSakerForJournalpost", journalpostId],
    hentSakerForFødselsnummer: (ident: string) => ["hentSakerForFødselsnummer", ident],
    hentSak: (saksnummer: string) => ["hentSak", saksnummer],
    hentEnkelSak: () => ["hentEnkelSak"],
};
export const SakQueryFunctions = {
    hentSakerForFødselsnummer: (fødselsnummer: string) => ({
        queryKey: SakApiQueryKeys.hentSakerForFødselsnummer(fødselsnummer),
        queryFn: async ({ queryKey }) => {
            try {
                return await SAK_API.person.finnForFodselsnummer(JSON.stringify(queryKey[1]));
            } catch (error) {
                if (error instanceof AxiosError) {
                    if (error.response?.status === 404) return { data: [], status: 200 };
                }
                throw error;
            }
        },
    }),
    hentSak: (saksnummer: string, queryClient: QueryClient) => ({
        queryKey: SakApiQueryKeys.hentSak(saksnummer),
        queryFn: async ({ queryKey }) => {
            const saksnummer = queryKey[1];
            const defaultSak = { data: { saksnummer, roller: [] } as BidragssakDto, status: 200 };
            try {
                if (isEmpty(saksnummer)) return defaultSak;
                const response = await SAK_API.bidragSak.findMetadataForSak(saksnummer);
                if (response.status === 404) {
                    return {
                        ...defaultSak,
                        staus: 404,
                        erIkkeBidragSak: true,
                    };
                }
                if (response.status !== 200) {
                    return { ...defaultSak, status: response.status };
                }
                const sak = response.data;
                await updateRollerWithPerson(sak.roller, queryClient);
                await updateRollerRMWithPerson(sak.roller, queryClient);
                return { data: sak, status: 200 };
            } catch (error) {
                console.error("Error fetching sak", error);
                if (!(error instanceof AxiosError)) return null;
                return { ...defaultSak, status: error.status };
            }
        },
    }),
    hentEnkelSak: (saksnummer?: string) => ({
        queryKey: SakApiQueryKeys.hentEnkelSak(),
        queryFn: () => SAK_API.bidragSak.findMetadataForSak(saksnummer),
    }),
    hentSakerForPerson: (person: Person, queryClient: QueryClient) => ({
        queryKey: SakApiQueryKeys.hentSakerForPerson(person?.ident),
        queryFn: () => mapSakerForPerson(person, queryClient),
    }),
};
export const useHentSakerPerson = () => {
    const gjelder = useHentGjelder();
    const queryClient = useQueryClient();
    const { data: saker, isLoading } = useQuery({
        ...SakQueryFunctions.hentSakerForPerson(gjelder, queryClient),
    });

    return { saker, isLoading };
};
export const useHentSakerForJournalpost = () => {
    const journalpost = useHentJournalpost();
    const gjelder = useHentGjelder();
    const queryClient = useQueryClient();
    const { data: saker, isLoading } = useQuery({
        queryKey: SakApiQueryKeys.hentSakerForJournalpost(journalpost.journalpostId),
        queryFn: async () => {

            const sakerPerson = await queryClient.fetchQuery({
                ...SakQueryFunctions.hentSakerForPerson(gjelder, queryClient),
            });
            return hentSakerForJournalpost(journalpost, gjelder, sakerPerson, queryClient);
        },
    });
    return { saker, isLoading };
};

export const useHentSakerForFødselsnummer = (fødselsnummer?: string) => {
    return useQuery({
        enabled: !isEmpty(fødselsnummer),
        ...SakQueryFunctions.hentSakerForFødselsnummer(fødselsnummer),
    });
};

export const useSakSearch = () => {
    const queryClient = useQueryClient();
    return useSuspenseQuery({
        queryKey: SakApiQueryKeys.hentEnkelSak(),
        queryFn: async ({ meta }) => {
            const saksnummer = meta.saksnummer;
            if (isEmpty(saksnummer)) return null;
            const sakResponse = await queryClient.fetchQuery({
                ...SakQueryFunctions.hentSak(saksnummer as string, queryClient),
            });
            const sak = sakResponse.data;
            return {
                ...sak,
                roller: sak.roller.map((rolle) => ({
                    ...rolle,
                    rolletype: mapRolletype(rolle.rolleType),
                })),
                kategori: sak.kategori as Kategori,
            } as Sak;
        },
    }).data;
};
export function useRefreshSakerJournalpost() {
    const queryClient = useQueryClient();
    const gjelder = useHentGjelder();
    const {
        appState: { journalpostId },
    } = useAppContext();

    return async () => {
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: DokumentQueryKeys.hentJournalpost(journalpostId) }),
            queryClient.invalidateQueries({ queryKey: SakApiQueryKeys.hentSakerForFødselsnummer(gjelder?.ident) }),
            queryClient.invalidateQueries({ queryKey: SakApiQueryKeys.hentSakerForPerson(gjelder?.ident) }),
            queryClient.invalidateQueries({ queryKey: SakApiQueryKeys.hentSakerForJournalpost(journalpostId) }),
        ]);
    };
}
export const useRefreshSakerPersonQuery = () => {
    const gjelder = useHentGjelder();
    const queryClient = useQueryClient();
    return async () => {
        await queryClient.invalidateQueries({ queryKey: SakApiQueryKeys.hentSakerForFødselsnummer(gjelder?.ident) });
        return queryClient.invalidateQueries({ queryKey: SakApiQueryKeys.hentSakerForPerson(gjelder?.ident) });
    };
};

export const useStartPersonOrSakSearchCallback = () => {
    const queryClient = useQueryClient();
    const jp = useHentJournalpost();
    const { setEnkelSak, setSearchState } = useSearch();
    return async (searchTerm: string): Promise<boolean> => {
        const LENGTH_OF_SAKSNUMMER_7_CHARS = 7;
        if (!searchTerm || isEmpty(searchTerm.trim()) || searchTerm.length < LENGTH_OF_SAKSNUMMER_7_CHARS) {
            return true;
        }

        const searchSuccess = true;
        setEnkelSak(null);
        setSearchState("pending");
        queryClient.setQueryDefaults(SakApiQueryKeys.hentEnkelSak(), { meta: { saksnummer: null } });
        queryClient.setQueryData(PersonApiQueryKeys.hentGjelder(jp.journalpostId), { ident: "", navn: "" });
        if (Validator.isValidFnr(searchTerm)) {
            const person = await hentPerson(searchTerm);
            await queryClient.setQueryData(PersonApiQueryKeys.hentGjelder(jp.journalpostId), person);
            if (person.feil) {
                setSearchState("error");
                return false;
            }
        } else if (Validator.isValidSaksnummer(searchTerm)) {
            const sakResponse = await queryClient.fetchQuery({
                ...SakQueryFunctions.hentSak(searchTerm, queryClient),
            });
            if (sakResponse.status !== 200) {
                setSearchState("error");
                return false;
            }
            const sak = sakResponse.data;
            setEnkelSak({
                ...sak,
                roller: sak.roller.map((rolle) => ({
                    ...rolle,
                    rolletype: mapRolletype(rolle.rolleType),
                })),
                kategori: sak.kategori as Kategori,
            } as Sak);
        }

        setSearchState("success");
        return searchSuccess;
    };
};

function mapRolletype(rolletype: Rolletype): Rolletype {
    switch (rolletype as string) {
        case "REELMOTTAKER":
            return Rolletype.RM;
        case "FEILREGISTRERT":
            return Rolletype.FR;
        case "BIDRAGSPLIKTIG":
            return Rolletype.BP;
        case "BIDRAGSMOTTAKER":
            return Rolletype.BM;
        case "BARN":
            return Rolletype.BA;
        default:
            return rolletype;
    }
}
// Mappers
async function hentSakerForJournalpost(
    journalpost: Journalpost,
    person: Person,
    sakerPerson: Sak[],
    queryClient: QueryClient,
) {
    const saksnummerPerson = sakerPerson.map((sak) => sak.saksnummer);
    const saksnummerJournalpost = journalpost.sakstilknytninger.filter((saksnr) => !saksnummerPerson.includes(saksnr));

    const sakerJournalpost = await Promise.all([
        ...saksnummerJournalpost.map((saksnummer) => {
            return queryClient
                .fetchQuery({ ...SakQueryFunctions.hentSak(saksnummer, queryClient) })
                .then((response) => ({
                    ...response.data,
                    kategori: response.data.kategori as Kategori,
                    saksstatus: response.data.saksstatus as SakStatus,
                }));
        }),
    ]);
    const saker = [...sakerJournalpost, ...sakerPerson];
    const sortedSaker = SakMapper.sortBySaksnummer(saker);

    const enhetsInfo = await hentSakerEnhetsInfo(saker, queryClient);

    return SakMapper.mapSakerForPerson(sortedSaker, person, enhetsInfo, journalpost.sakstilknytninger);
}
async function hentSakerEnhetsInfo(saker: Sak[], queryClient: QueryClient): Promise<EnhetDto[]> {
    const eierfogdList = Array.from(
        new Set(
            saker.filter((sak) => sak.eierfogd !== undefined || sak.eierfogd !== "null").map((sak) => sak.eierfogd),
        ),
    );

    return await Promise.all(
        eierfogdList.map((eierfogd) =>
            queryClient.fetchQuery({
                ...OrganisasjonQueryFunctions.hentEnhet(eierfogd),
            }),
        ),
    );
}
export async function hentSakerForPerson(personId: string, queryClient?: QueryClient): Promise<Sak[]> {
    if (isEmpty(personId)) {
        return [];
    }

    const response = await queryClient.fetchQuery({
        ...SakQueryFunctions.hentSakerForFødselsnummer(personId),
    });
    if (response.status !== 200) return [];
    return await Promise.all(
        response.data.map(async (sak) => {
            await updateRollerWithPerson(sak.roller, queryClient);
            await updateRollerRMWithPerson(sak.roller, queryClient);
            return {
                ...sak,
                kategori: sak.kategori as Kategori,
            } as Sak;
        }),
    );
}

async function mapSakerForPerson(person: Person, queryClient: QueryClient) {
    const sakerPerson = await hentSakerForPerson(person.ident, queryClient);
    const sortedSaker = SakMapper.sortBySaksnummer(sakerPerson);
    const enhetsInfo = await hentSakerEnhetsInfo(sakerPerson, queryClient);

    return SakMapper.mapSakerForPerson(sortedSaker, person, enhetsInfo);
}
function updateRollerRMWithPerson(roller: InternalRolleDto[], queryClient?: QueryClient) {
    return Promise.all([
        ...roller
            .filter((f) => f.reellMottaker?.ident && !erSamhandlerId(f.reellMottaker?.ident))
            .map((rolle: InternalRolleDto) =>
                queryClient
                    .fetchQuery({ ...PersonQueryFunctions.hentPerson(rolle.reellMottaker?.ident) })
                    .then((person) => {
                        rolle.reellMottaker.navn = person.visningsnavn;
                        return rolle;
                    })
                    .catch((e) => {
                        console.error("Det skjedde en feil ved henting av person", e);
                        return rolle;
                    }),
            ),
        ...roller
            .filter((f) => f.reellMottaker?.ident && erSamhandlerId(f.reellMottaker?.ident))
            .map((rolle: InternalRolleDto) =>
                queryClient
                    .fetchQuery({ ...PersonQueryFunctions.hentSamhandler(rolle.reellMottaker?.ident) })
                    .then((person) => {
                        rolle.reellMottaker.navn = person.navn;
                        return rolle;
                    })
                    .catch((e) => {
                        console.error("Det skjedde en feil ved henting av person", e);
                        return rolle;
                    }),
            ),
    ]);
}
function updateRollerWithPerson(roller: InternalRolleDto[], queryClient?: QueryClient) {
    return Promise.all(
        roller.map((rolle: InternalRolleDto) =>
            queryClient
                .fetchQuery({ ...PersonQueryFunctions.hentPerson(rolle.foedselsnummer) })
                .then((person) => {
                    rolle.navn = person.navn;
                    rolle.visningsnavn = person.visningsnavn;
                    rolle.person = person;
                    return rolle;
                })
                .catch((e) => {
                    console.error("Det skjedde en feil ved henting av person", e);
                    return rolle;
                }),
        ),
    );
}
