import type { StonadDto, StonadPeriodeDto } from "@bidrag/api/BelopshistorikkApi";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { hentBelopshistorikkQuery } from "~/api/query/belopshistorikk.query.ts";

interface StonadMedPeriode
    extends StonadPeriodeDto,
        Pick<StonadDto, "kravhaver" | "type" | "skyldner" | "mottaker" | "innkreving"> {}

export function useBeløphistorikk(saksnummer: string) {
    const { data: allestonader } = useSuspenseQuery(hentBelopshistorikkQuery(saksnummer));

    const perioder: Array<StonadMedPeriode> = useMemo(() => {
        if (!allestonader) return [];

        return allestonader.flatMap((stønad) =>
            stønad.periodeListe.map((periode) => ({
                ...periode,
                kravhaver: stønad.kravhaver,
                type: stønad.type,
                skyldner: stønad.skyldner,
                mottaker: stønad.mottaker,
                innkreving: stønad.innkreving,
            })),
        );
    }, [allestonader]);

    return {
        allestonader,
        perioder,
    };
}
