import type { MottakerAdresseTo } from "@bidrag/api/BidragForsendelseApi";
import type { PersonAdresseDto, PersonDto } from "@bidrag/api/PersonApi";
import { IdentUtils, ObjectUtils, StringUtils } from "@bidrag/common";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import type { AxiosResponse } from "axios";
import { usePersonApi, useSamhandlerApi } from "../api/api";
import { countryCodeIso3ToIso2 } from "../utils/AdresseUtils";

type PersonInfo = { ident: string; navn?: string; valid?: boolean; adresse?: MottakerAdresseTo };

const PersonApiQueryKeys = {
    person: "person",
    hentPerson: (ident: string) => [PersonApiQueryKeys.person, ident],
    hentAktorForIdent: (ident: string) => [PersonApiQueryKeys.person, "aktor", ident],
};

function getPersonAdresse(postAdresseResult: AxiosResponse<PersonAdresseDto, any>) {
    if (postAdresseResult.status === 201) return null;
    return postAdresseResult.data;
}

export const useHentPerson = (ident?: string): PersonDto => {
    const personApi = usePersonApi();
    const { data: personData } = useSuspenseQuery({
        queryKey: PersonApiQueryKeys.hentPerson(ident),
        queryFn: async () => {
            if (!ident || StringUtils.isEmpty(ident)) return { ident, visningsnavn: "" };
            return (await personApi.informasjon.hentPersonPost({ ident }))?.data;
        },
    });

    return personData;
};

export const useHentSamhandlerEllerPersonForIdent = (ident: string) => {
    const samhandlerApi = useSamhandlerApi();
    const personApi = usePersonApi();
    return useQuery({
        queryKey: PersonApiQueryKeys.hentAktorForIdent(ident),
        queryFn: async (): Promise<PersonInfo> => {
            if (ObjectUtils.isEmpty(ident) || StringUtils.isEmpty(ident)) return { ident, valid: false };
            if (IdentUtils.isSamhandlerId(ident)) {
                const result = await samhandlerApi.samhandler.hentSamhandler(JSON.stringify(ident));
                if (result.status !== 200) throw Error(`Fant ikke samhandler med ident ${ident}`);
                return {
                    ident,
                    navn: result.data.navn,
                    valid: true,
                    adresse: {
                        adresselinje1: "",
                        ...result.data.adresse,
                        landkode: result.data.adresse?.land ? countryCodeIso3ToIso2(result.data.adresse.land) : "",
                        landkode3: result.data.adresse?.land,
                    },
                };
            } else if (IdentUtils.isFnr(ident)) {
                const result = await personApi.informasjon.hentPersonPost({ ident });
                const postAdresseResult = await personApi.adresse.hentPersonPostadresse(null, {
                    ident,
                });
                const postAdresse = getPersonAdresse(postAdresseResult);
                if (result.status !== 200) throw Error(`Fant ikke person med ident ${ident}`);
                return {
                    ident,
                    navn: result.data.visningsnavn,
                    valid: true,
                    adresse: postAdresseResult
                        ? {
                              adresselinje1: "",
                              ...postAdresse,
                              landkode: postAdresse.land,
                              landkode3: postAdresse.land3,
                          }
                        : null,
                };
            }
            return { ident, valid: false };
        },
        throwOnError: false,
        retry: 2,
    });
};
