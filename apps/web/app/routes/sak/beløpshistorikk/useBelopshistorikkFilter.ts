import type {
    StonadDto,
    StonadPeriodeDto,
} from "@bidrag/api/BelopshistorikkApi";
import { parseDateQueryParam, unikeVerdier } from "@bidrag/utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useLocation } from "react-router";
import { hentBelopshistorikkQuery } from "~/api/query/belopshistorikk.query.ts";
import { IdentQueryParamMapper } from "~/common/filter/IdentQueryParamMapper.ts";
import {
    PARAM_BARN,
    PARAM_FRA,
    PARAM_TIL,
    PARAM_TYPE,
} from "~/routes/sak/beløpshistorikk/konstanter.ts";
import { erInnenforPeriode } from "./periode.utils";

interface StonadMedPeriode
    extends StonadPeriodeDto,
        Pick<
            StonadDto,
            "kravhaver" | "type" | "skyldner" | "mottaker" | "innkreving"
        > {}

export function useBeløphistorikkfilter(saksnummer: string) {
    const { data: allestonader } = useSuspenseQuery(
        hentBelopshistorikkQuery(saksnummer),
    );

    const unikeKravhavere = useMemo(
        () => unikeVerdier(allestonader.map((t) => t.kravhaver)),
        [allestonader],
    );
    const unikeTyper = useMemo(
        () => unikeVerdier(allestonader.map((t) => t.type)),
        [allestonader],
    );

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

    const { search: searchString } = useLocation();

    const barnMapper = new IdentQueryParamMapper(unikeKravhavere);

    const filtrertData = useMemo(() => {
        const params = new URLSearchParams(searchString);
        const typer = params.getAll(PARAM_TYPE);
        const kravhavere = barnMapper.toIdents(params.getAll(PARAM_BARN));

        const fra = parseDateQueryParam(params.get(PARAM_FRA));
        const til = parseDateQueryParam(params.get(PARAM_TIL));

        return perioder.filter((t) => {
            if (typer.length > 0 && !typer.includes(t.type ?? "")) return false;
            if (
                kravhavere.length > 0 &&
                !kravhavere.includes(t.kravhaver ?? "")
            )
                return false;
            if ((fra || til) && !erInnenforPeriode(fra, til, t.periode))
                return false;
            return true;
        });
    }, [perioder, searchString]);

    return {
        totalCount: perioder.length,
        filtrertData,
        unikeKravhavere,
        unikeTyper,
    };
}
