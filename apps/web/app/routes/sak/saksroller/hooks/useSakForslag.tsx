import type { PersonDto } from "@bidrag/api/PersonApi";

import type { BidragssakDto } from "@bidrag/api/SakApi";
import { Rolletype } from "@bidrag/api/SakApi";
import { SecureLoggerService } from "@bidrag/common";
import { useEffect, useState } from "react";
import { useHentPersonMotpartBarnRelasjon } from "~/api/useApi.ts";
import { beregnSakForslag } from "./sak-forslag-utils.ts";

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
