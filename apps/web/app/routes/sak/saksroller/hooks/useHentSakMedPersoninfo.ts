import type { BidragssakDto } from "@bidrag/api/SakApi";
import { useMemo } from "react";
import { useHentFlerePersoninformasjonSuspense, useHentSakSuspense } from "~/api/useApi.ts";
import type { Rolle } from "../sakvisning-schema.ts";
import { berikRoller } from "./rolleberikelse.ts";

export interface SakMedPersoninfo {
    sak: BidragssakDto;
    berikedeRoller: Rolle[];
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

        return berikRoller(sak.roller, personInfoMap);
    }, [sak, personQueries, sakIdenter]);

    return {
        sak,
        berikedeRoller,
        erEktefellebidrag,
        refetch,
        dataUpdatedAt,
    };
}
