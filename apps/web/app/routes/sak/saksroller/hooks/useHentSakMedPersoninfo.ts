import { useMemo } from "react";

import type { BidragssakDto, RolleDto } from "@bidrag/api/SakApi";
import { Rolletype } from "@bidrag/api/SakApi";
import type { TilgangsFeilError } from "@bidrag/api";
import { beregnAlder, beregnAlderFraFnr } from "@bidrag/utils";
import {
    useHentFlerePersoninformasjonSuspense,
    useHentSakSuspense,
} from "~/api/useApi.ts";
import { MYNDYG_BARN_ALDER } from "../sakvisning-schema.ts";
import type { BarnRolle, Rolle } from "../sakvisning-schema.ts";

export interface SakMedPersoninfo {
    sak: BidragssakDto;
    berikedeRoller: Rolle[];
    error: Error | TilgangsFeilError | null;
    harTilgang: boolean;
    erEktefellebidrag: boolean;
    refetch: () => Promise<unknown>;
    dataUpdatedAt: number;
}

export function useHentSakMedPersoninfo(saksnummer: string): SakMedPersoninfo {
    const { data: sak, refetch, dataUpdatedAt } = useHentSakSuspense(saksnummer);

    const sakIdenter = useMemo(() => {
        return sak.roller.flatMap((r) => (r.fodselsnummer ? [r.fodselsnummer] : []));
    }, [sak]);

    const personQueries = useHentFlerePersoninformasjonSuspense(sakIdenter, sakIdenter.length > 0);

    const harTilgang = true; // Hvis suspense ikke kastet, har vi tilgang

    const erEktefellebidrag = useMemo(() => {
        const harBarn = sak.roller.some((r) => r.type === "BA");
        const harBP = sak.roller.some((r) => r.type === "BP");
        const harBM = sak.roller.some((r) => r.type === "BM");
        return !harBarn && harBP && harBM;
    }, [sak]);

    const berikedeRoller = useMemo(() => {
        const personInfoMap = new Map(
            personQueries.map((q, idx) => [sakIdenter[idx], q.data] as const).filter(([ident, data]) => ident && data),
        );

        return [...sak.roller]
            .sort((a, b) => a.fodselsnummer?.localeCompare(b.fodselsnummer || "") || a.type.localeCompare(b.type))
            .map((rolle): Rolle => {
                const personInfo = rolle.fodselsnummer ? personInfoMap.get(rolle.fodselsnummer) : undefined;
                const alder = personInfo?.fødselsdato
                    ? beregnAlder(personInfo.fødselsdato)
                    : beregnAlderFraFnr(rolle.fodselsnummer ?? "");

                if (rolle.type === "BA" && rolle.fodselsnummer) {
                    const erMyndig = (alder ?? 0) >= MYNDYG_BARN_ALDER;
                    return {
                        ...rolle,
                        rolleType: "BA",
                        fodselsnummer: rolle.fodselsnummer || "",
                        mottagerErVerge: rolle.mottagerErVerge ?? false,
                        fødselsdato: personInfo?.fødselsdato,
                        navn: personInfo?.visningsnavn,
                        diskresjonskode: personInfo?.diskresjonskode,
                        reellMottaker: rolle.reellMottaker?.ident,
                        reellMottakerType: rolle.reellMottaker?.ident?.trim()
                            ? rolle.fodselsnummer === rolle.reellMottaker.ident
                                ? "barnet_selv"
                                : "samhandler"
                            : undefined,
                        alder: alder ?? undefined,
                        erMyndig,
                        rollehistorikk: mapRollehistorikk(rolle),
                    } as BarnRolle;
                }

                return {
                    ...rolle,
                    reellMottaker: undefined,
                    reellMottager: undefined,
                    fødselsdato: personInfo?.fødselsdato,
                    fodselsnummer: rolle.fodselsnummer || "",
                    mottagerErVerge: rolle.mottagerErVerge ?? false,
                    navn: personInfo?.visningsnavn,
                    diskresjonskode: personInfo?.diskresjonskode,
                    rollehistorikk: mapRollehistorikk(rolle),
                } as Rolle;
            });
    }, [sak, personQueries, sakIdenter]);

    return {
        sak,
        berikedeRoller,
        error: null,
        harTilgang,
        erEktefellebidrag,
        refetch,
        dataUpdatedAt,
    };
}

const mapRollehistorikk = (rolle: RolleDto): Rolle["rollehistorikk"] => {
    return (
        (rolle.rollehistorikk?.map((historikk) => ({
            ...historikk,
            opprettetDato: historikk.opprettetTidspunkt ? new Date(historikk.opprettetTidspunkt) : undefined,
            type: rolletypeTilVisningsnavn(historikk.type),
            typeEndring: historikk.typeEndring || "Manuell endring",
            reellMottaker: historikk.reellMottaker?.ident,
        })) as Rolle["rollehistorikk"]) ?? []
    );
};

export const rolletypeTilVisningsnavn = (rolle?: Rolletype): string => {
    if (!rolle) return "";
    switch (rolle) {
        case Rolletype.BM:
            return "Bidragsmottaker";
        case Rolletype.BA:
            return "Barn";
        case Rolletype.BP:
            return "Bidragspliktig";
        default:
            return rolle;
    }
};
