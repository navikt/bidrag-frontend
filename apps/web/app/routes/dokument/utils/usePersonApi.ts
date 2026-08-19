import {useSuspenseQuery} from "@tanstack/react-query";
import {AxiosError} from "axios";
import countries from "i18n-iso-countries";
import norwegianLocale from "i18n-iso-countries/langs/nb.json";


import {useAppContext} from "../store/AppContext";
import {HTTPStatus} from "../types/enum/HttpStatus";
import {Person} from "../types/person";
import {useHentJournalpost} from "./useDokumentApi";
import {BIDRAG_ORGANISASJON_API, BIDRAG_PERSON_API, BIDRAG_SAMHANDLER_API} from "@bidrag/api";
import {EnhetDto} from "@bidrag/api/OrganisasjonApi";
import {SamhandlerDto} from "@bidrag/api/SamhandlerApi";
import {PersonAdresseDto} from "@bidrag/api/PersonApi";
import {DistribuerTilAdresse} from "@bidrag/api/BidragDokumentApi";
import {IdentUtils} from "@bidrag/common";

// Register languages
countries.registerLocale(norwegianLocale);

// Convert alpha-3 to alpha-2
export function alpha3ToAlpha2CountryCode(alpha3: string): string | undefined {
    return countries.alpha3ToAlpha2(alpha3);
}

type PersonInfo = { ident: string; navn?: string; valid?: boolean };

export const PersonApiQueryKeys = {
    person: "person",
    hentGjelder: (jpId: string) => ["hentGjelder", jpId],
    hentMottakerAdresse: (jpId: string) => ["hentMottakerAdresse", jpId],
    hentPerson: (fnr: string) => ["hentPerson", fnr],
    hentSamhandler: (samhandlerId: string) => ["hentSamhandler", samhandlerId],
    hentAktorForIdent: (ident: string) => [PersonApiQueryKeys.person, "aktor", ident],
};
export const PersonQueryFunctions = {
    hentGjelder: (fødselsnummer: string, jpId: string) => {
        return {
            queryKey: PersonApiQueryKeys.hentGjelder(jpId),
            queryFn: () => hentPerson(fødselsnummer),
        };
    },
    hentPerson: (fødselsnummer: string) => ({
        queryKey: PersonApiQueryKeys.hentPerson(fødselsnummer),
        queryFn: ({queryKey}: { queryKey: string[] }) => hentPerson(queryKey[1] || ""),
    }),

    hentSamhandler: (samhandlerIdent: string) => ({
        queryKey: PersonApiQueryKeys.hentSamhandler(samhandlerIdent),
        queryFn: ({queryKey}: { queryKey: string[] }) => hentSamhandler(queryKey[1] || ""),
    }),
};
export const useHentGjelder = (): Person => {
    const {
        appState: {journalpostId},
    } = useAppContext();
    const jp = useHentJournalpost();
    const {data: personData} = useSuspenseQuery({
        queryKey: PersonApiQueryKeys.hentGjelder(journalpostId),
        queryFn: async () => {
            if (jp?.gjelderAktor?.ident == undefined) return {ident: "", visningsnavn: "", begrensetTilgang: false};

            return hentPerson(jp?.gjelderAktor?.ident);
        },
        staleTime: Infinity,
    });

    return personData;
};

export const useHentMottakerAdresse = () => {
    const jp = useHentJournalpost();

    const mottakerIdent = jp.avsenderMottaker?.ident;
    return useSuspenseQuery({
        queryKey: PersonApiQueryKeys.hentMottakerAdresse(jp.journalpostId || ""),
        queryFn: async () => {
            if (jp.avsenderMottaker?.adresse) return {data: jp.avsenderMottaker.adresse};
            return BIDRAG_PERSON_API.adresse.hentPersonPostadresse(null, {
                ident: mottakerIdent,
            });
        },
    }).data.data as DistribuerTilAdresse;
};

export const hentMottakerAdresse = async (mottakerIdent: string): Promise<DistribuerTilAdresse> => {
    if (IdentUtils.isSamhandlerId(mottakerIdent)) {
        return BIDRAG_SAMHANDLER_API.samhandler.hentSamhandler(JSON.stringify(mottakerIdent)).then((response) => {
            if (response.status === HTTPStatus.NO_CONTENT) {
                return null;
            }
            return {...response.data.adresse, land: alpha3ToAlpha2CountryCode(response.data.adresse?.land || "")};
        });
    }
    return PERSON_API.adresse
        .hentPersonPostadresse(null, {
            ident: mottakerIdent,
        })
        .then((response) => response.data);
};
export const useHentPerson = (ident?: string): PersonDto => {
    const {data: personData, refetch} = useSuspenseQuery({
        ...PersonQueryFunctions.hentGjelder(ident, ""),
    });

    return personData;
};

export const useHentPerson2 = (ident?: string) =>
    useSuspenseQuery({
        ...PersonQueryFunctions.hentPerson(ident ?? ""),
    });
export const useHentPersonGeografiskEnhet = (): EnhetDto => {
    const person = useHentGjelder();
    const {data: data} = useSuspenseQuery({
        queryKey: ["personGeografiskEnhet", person.ident],
        queryFn: () => {
            return BIDRAG_ORGANISASJON_API.arbeidsfordeling.hentArbeidsfordelingGeografiskTilknytningEnhet({
                ident: person.ident,
                biidenter: [],
                tema: "BID",
            });
        },
    });

    return data.data;
};

export async function hentSamhandler(samhandlerId: string): Promise<SamhandlerDto> {
    const defaultValue: SamhandlerDto = {samhandlerId, navn: "", offentligId: undefined, offentligIdType: undefined};

    if (!samhandlerId) return defaultValue;
    try {
        const response = await BIDRAG_SAMHANDLER_API.samhandler.hentSamhandler(JSON.stringify(samhandlerId));

        if (response.status === HTTPStatus.NO_CONTENT) {
            return {...defaultValue};
        }
        if (response.status == HTTPStatus.FORBIDDEN) {
            return {samhandlerId, navn: "", offentligId: undefined, offentligIdType: undefined};
        }
        return response.data;
    } catch (error) {
        if (error && error instanceof AxiosError) {
            if (error.status === HTTPStatus.NO_CONTENT) {
                return {...defaultValue, navn: "Samhandler ikke funnet"};
            }
            if (error.status == HTTPStatus.FORBIDDEN) {
                return {...defaultValue, navn: "Ingen tilgang"};
            }
        }
        return {...defaultValue, navn: "Feil ved henting av samhandler"};
    }
}

export async function hentPerson(ident: string): Promise<Person> {
    const defaultValue = {ident: ident, navn: "", visningsnavn: "", begrensetTilgang: false, feil: false};

    if (!ident) return defaultValue;
    try {
        const personResponse = await BIDRAG_PERSON_API.informasjon.hentPersonPost({ident});

        if (personResponse.status === HTTPStatus.NO_CONTENT) {
            return {...defaultValue, feil: true};
        }
        if (personResponse.status == HTTPStatus.FORBIDDEN) {
            return {ident: ident, begrensetTilgang: true, feil: true, visningsnavn: ""};
        }
        return personResponse.data;
    } catch (error) {
        if (error && error instanceof AxiosError) {
            if (error.status === HTTPStatus.NO_CONTENT) {
                return {...defaultValue, feil: true, visningsnavn: "Person ikke funnet"};
            }
            if (error.status == HTTPStatus.FORBIDDEN) {
                return {ident: ident, begrensetTilgang: true, feil: true, visningsnavn: "Ingen tilgang"};
            }
        }
        return {...defaultValue, visningsnavn: "Feil ved henting av navn", feil: true};
    }
}

async function useHentPersonAdresse(ident: string): Promise<PersonAdresseDto | null> {
    const postAdresseResult = await BIDRAG_PERSON_API.adresse.hentPersonPostadresse(null, {
        ident,
    });
    if (postAdresseResult.status == 201) return null;
    return postAdresseResult.data;
}
