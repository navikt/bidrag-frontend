import { useEffect, useState } from "react";

import type { BidragssakDto } from "@bidrag/api/SakApi";
import { Rolletype } from "@bidrag/api/SakApi";
import type { MotpartBarnRelasjon, PersonDto } from "@bidrag/api/PersonApi";
import { SecureLoggerService } from "@bidrag/common";
import { beregnAlder, beregnAlderFraFnr } from "@bidrag/utils";
import { useHentPersonMotpartBarnRelasjon } from "~/api/useApi.ts";

const MAKS_ALDER_BARN = 24;

type SakForslag = {
    muligeBarnPerMotpart: Map<string, PersonDto[]>;
    muligeAndreForeldre: PersonDto[];
    isLoading: boolean;
    feil: string | null;
};

/**
 * Hook for å hente forslag til roller basert på eksisterende saksroller
 *
 * Henter motpart-barn-relasjon én gang for kjent forelder og filtrerer basert på saksroller
 */
export function useSakForslag({ sak }: { sak: BidragssakDto | undefined }): SakForslag {
    const [muligeBarnPerMotpart, setMuligeBarnPerMotpart] = useState<Map<string, PersonDto[]>>(new Map());
    const [muligeAndreForeldre, setMuligeAndreForeldre] = useState<PersonDto[]>([]);
    const [feil, setFeil] = useState<string | null>(null);

    const bp = sak?.roller.find((rolle) => rolle.type === Rolletype.BP);
    const bm = sak?.roller.find((rolle) => rolle.type === Rolletype.BM);
    const barnListe = sak?.roller.filter((rolle) => rolle.type === Rolletype.BA) || [];
    const barnIdenter = barnListe.map((b) => b.fodselsnummer);
    const barnIdenterKey = barnIdenter.join(",");

    // Hent for den første kjente forelderen (BP eller BM)
    const kjentForelder = bp || bm;
    const ukjentForelder = bp ? !bm : !bp;

    // Hent motpart-barn-relasjon hvis minst én forelder er kjent
    const {
        data: motpartRelasjon,
        isLoading,
        error,
    } = useHentPersonMotpartBarnRelasjon(
        kjentForelder?.fodselsnummer ? { ident: kjentForelder.fodselsnummer } : null,
        Boolean(sak && kjentForelder),
    );

    // Prosesser motpart-barn-relasjon
    useEffect(() => {
        if (!sak || !motpartRelasjon || !kjentForelder) {
            setMuligeAndreForeldre([]);
            setMuligeBarnPerMotpart(new Map());
            return;
        }

        const erBarnUnderMaksAlder = (barn: PersonDto) => {
            const alder = barn.fødselsdato ? beregnAlder(barn.fødselsdato) : beregnAlderFraFnr(barn.ident);

            return alder != null && alder <= MAKS_ALDER_BARN;
        };

        try {
            const relasjoner = motpartRelasjon.personensMotpartBarnRelasjon ?? [];
            const barnMap = new Map<string, PersonDto[]>();
            const motparter: PersonDto[] = [];

            if (ukjentForelder) {
                // Kun én forelder kjent
                if (barnListe.length === 0) {
                    // Ingen barn i saken - vis alle motparter og deres barn
                    relasjoner.forEach((rel: MotpartBarnRelasjon) => {
                        if (rel.motpart) {
                            motparter.push(rel.motpart);
                            barnMap.set(rel.motpart.ident, rel.fellesBarn);
                        }
                    });
                } else {
                    // Barn i saken - filtrer motparter basert på barn
                    const relevanteRelasjoner = relasjoner.filter((rel: MotpartBarnRelasjon) => {
                        const barnIRelasjon = rel.fellesBarn.map((b) => b.ident);
                        return barnIdenter.some((barnIdent) => barnIdent && barnIRelasjon.includes(barnIdent));
                    });

                    relevanteRelasjoner.forEach((rel: MotpartBarnRelasjon) => {
                        if (rel.motpart) {
                            motparter.push(rel.motpart);
                            const søskenIkkeISaken = rel.fellesBarn.filter((barn) => !barnIdenter.includes(barn.ident));
                            barnMap.set(rel.motpart.ident, søskenIkkeISaken);
                        }
                    });
                }

                setMuligeAndreForeldre(motparter);
            } else {
                // Begge foreldre kjent - hent søsken
                const andreForelderIdent = kjentForelder === bp ? bm?.fodselsnummer : bp?.fodselsnummer;

                if (andreForelderIdent && barnListe.length > 0) {
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

                setMuligeAndreForeldre([]);
            }

            // Filtrer barn etter alder
            const filtrertBarnMap = new Map<string, PersonDto[]>(
                Array.from(barnMap.entries())
                    .map(([motpartIdent, liste]): [string, PersonDto[]] => [motpartIdent, liste.filter(erBarnUnderMaksAlder)])
                    .filter(([, liste]) => liste.length > 0),
            );

            setMuligeBarnPerMotpart(filtrertBarnMap);
        } catch (e) {
            SecureLoggerService.error("Kunne ikke prosessere motpart-barn-relasjon", e instanceof Error ? e : new Error(String(e)));
            setFeil("Kunne ikke hente forslag til roller");
        }
    }, [
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
