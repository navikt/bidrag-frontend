import type { MotpartBarnRelasjon, PersonDto } from "@bidrag/api/PersonApi";

import type { BidragssakDto } from "@bidrag/api/SakApi";
import { Rolletype } from "@bidrag/api/SakApi";
import { SecureLoggerService } from "@bidrag/common";
import { beregnAlder, beregnAlderFraFnr } from "@bidrag/utils";
import { useEffect, useState } from "react";
import { useHentPersonMotpartBarnRelasjon } from "~/api/useApi.ts";

const MAKS_ALDER_BARN = 24;

type SakForslag = {
    muligeBarnPerMotpart: Map<string, PersonDto[]>;
    muligeAndreForeldre: PersonDto[];
    isLoading: boolean;
    feil: string | null;
};

export function useSakForslag({ sak }: { sak: BidragssakDto | undefined }): SakForslag {
    const [muligeBarnPerMotpart, setMuligeBarnPerMotpart] = useState<Map<string, PersonDto[]>>(new Map());
    const [muligeAndreForeldre, setMuligeAndreForeldre] = useState<PersonDto[]>([]);
    const [feil, setFeil] = useState<string | null>(null);

    const bp = sak?.roller.find((rolle) => rolle.type === Rolletype.BP);
    const bm = sak?.roller.find((rolle) => rolle.type === Rolletype.BM);
    const barnListe = sak?.roller.filter((rolle) => rolle.type === Rolletype.BA) || [];
    const barnIdenter = barnListe.map((b) => b.fodselsnummer);
    const barnIdenterKey = barnIdenter.join(",");

    const kjentForelder = bp || bm;
    const ukjentForelder = bp ? !bm : !bp;

    const {
        data: motpartRelasjon,
        isLoading,
        error,
    } = useHentPersonMotpartBarnRelasjon(
        kjentForelder?.fodselsnummer ? { ident: kjentForelder.fodselsnummer } : null,
        Boolean(sak && kjentForelder),
    );

    function prosesserMotpartRelasjon() {
        if (!sak || !motpartRelasjon || !kjentForelder) {
            setMuligeAndreForeldre([]);
            setMuligeBarnPerMotpart(new Map());
            return;
        }

        try {
            const { muligeAndreForeldre: nyeMuligeAndreForeldre, muligeBarnPerMotpart: nyttMuligeBarnPerMotpart } =
                beregnSakForslag({
                    motpartRelasjon,
                    barnListe,
                    barnIdenter,
                    ukjentForelder,
                    andreForelderIdent: kjentForelder === bp ? bm?.fodselsnummer : bp?.fodselsnummer,
                });

            setMuligeAndreForeldre(nyeMuligeAndreForeldre);
            setMuligeBarnPerMotpart(nyttMuligeBarnPerMotpart);
        } catch (e) {
            SecureLoggerService.error(
                "Kunne ikke prosessere motpart-barn-relasjon",
                e instanceof Error ? e : new Error(String(e)),
            );
            setFeil("Kunne ikke hente forslag til roller");
        }
    }

    useEffect(prosesserMotpartRelasjon, [
        sak,
        motpartRelasjon,
        kjentForelder,
        ukjentForelder,
        barnListe.length,
        barnIdenterKey,
        bp?.fodselsnummer,
        bm?.fodselsnummer,
    ]);

    return {
        muligeBarnPerMotpart,
        muligeAndreForeldre,
        isLoading,
        feil: feil || (error ? "Kunne ikke hente data" : null),
    };
}

type MotpartBarnRelasjonDto = {
    personensMotpartBarnRelasjon?: MotpartBarnRelasjon[];
};

export function beregnSakForslag({
    motpartRelasjon,
    barnListe,
    barnIdenter,
    ukjentForelder,
    andreForelderIdent,
}: {
    motpartRelasjon: MotpartBarnRelasjonDto;
    barnListe: { fodselsnummer?: string }[];
    barnIdenter: (string | undefined)[];
    ukjentForelder: boolean;
    andreForelderIdent: string | undefined;
}): { muligeAndreForeldre: PersonDto[]; muligeBarnPerMotpart: Map<string, PersonDto[]> } {
    const erBarnUnderMaksAlder = (barn: PersonDto) => {
        const alder = barn.fødselsdato ? beregnAlder(barn.fødselsdato) : beregnAlderFraFnr(barn.ident);

        return alder != null && alder <= MAKS_ALDER_BARN;
    };

    const relasjoner = motpartRelasjon.personensMotpartBarnRelasjon ?? [];
    const barnMap = new Map<string, PersonDto[]>();
    const muligeAndreForeldre: PersonDto[] = [];

    function leggTilAlleMotparterOgDerasBarn() {
        relasjoner.forEach((rel: MotpartBarnRelasjon) => {
            if (rel.motpart) {
                muligeAndreForeldre.push(rel.motpart);
                barnMap.set(rel.motpart.ident, rel.fellesBarn);
            }
        });
    }

    function leggTilMotparterMedFellesBarnISaken() {
        const relevanteRelasjoner = relasjoner.filter((rel: MotpartBarnRelasjon) => {
            const barnIRelasjon = rel.fellesBarn.map((b) => b.ident);
            return barnIdenter.some((barnIdent) => barnIdent && barnIRelasjon.includes(barnIdent));
        });

        relevanteRelasjoner.forEach((rel: MotpartBarnRelasjon) => {
            if (rel.motpart) {
                muligeAndreForeldre.push(rel.motpart);
                const søskenIkkeISaken = rel.fellesBarn.filter((barn) => !barnIdenter.includes(barn.ident));
                barnMap.set(rel.motpart.ident, søskenIkkeISaken);
            }
        });
    }

    function leggTilSøskenForKjentAndreForelder() {
        if (!andreForelderIdent || barnListe.length === 0) {
            return;
        }

        const relasjonMedAndreForelder = relasjoner.find(
            (rel: MotpartBarnRelasjon) => rel.motpart?.ident === andreForelderIdent,
        );

        if (relasjonMedAndreForelder) {
            const søskenIkkeISaken = relasjonMedAndreForelder.fellesBarn.filter(
                (barn) => !barnIdenter.includes(barn.ident),
            );
            barnMap.set(andreForelderIdent, søskenIkkeISaken);
        }
    }

    if (ukjentForelder) {
        if (barnListe.length === 0) {
            leggTilAlleMotparterOgDerasBarn();
        } else {
            leggTilMotparterMedFellesBarnISaken();
        }
    } else {
        leggTilSøskenForKjentAndreForelder();
    }

    const muligeBarnPerMotpart = new Map<string, PersonDto[]>(
        Array.from(barnMap.entries())
            .map(([motpartIdent, liste]): [string, PersonDto[]] => [motpartIdent, liste.filter(erBarnUnderMaksAlder)])
            .filter(([, liste]) => liste.length > 0),
    );

    return { muligeAndreForeldre, muligeBarnPerMotpart };
}
