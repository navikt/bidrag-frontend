import type { VedtakDto } from "@bidrag/api/BidragVedtakApi";
import { parseDateQueryParam, unikeVerdier } from "@bidrag/utils";
import { useSuspenseQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import { useLocation } from "react-router";
import { hentVedtakQuery } from "~/api/query/vedtak.query.ts";
import { IdentQueryParamMapper } from "~/common/filter/IdentQueryParamMapper.ts";
import { useBeløphistorikk } from "~/common/reskontro/useBelopshistorikk.ts";
import { PARAM_BARN, PARAM_FRA, PARAM_TIL, PARAM_TYPE } from "~/routes/sak/beløpshistorikk/konstanter.ts";
import { beregnAntallMåneder, erInnenforPeriode } from "./periode.utils";

export function useBeløphistorikkfilter(saksnummer: string) {
    const { allestonader, perioder } = useBeløphistorikk(saksnummer);

    const unikeKravhavere = useMemo(() => unikeVerdier(allestonader.map((t) => t.kravhaver)), [allestonader]);
    const unikeTyper = useMemo(() => unikeVerdier(allestonader.map((t) => t.type)), [allestonader]);

    /** Må hente opp vedtak for å få vedtaksType og vedtaksTidspunkt, da dette ikke er med i beløpshistorikk-APIet */
    const unikeVedtaksIder = useMemo(() => {
        return unikeVerdier(perioder.map((t) => t.vedtaksid))
            .filter((id) => id !== null && id !== undefined)
            .map((id) => Number(id));
    }, [allestonader]);

    const vedtakResultater = useSuspenseQueries({
        queries: unikeVedtaksIder.map((vedtaksId) => hentVedtakQuery(vedtaksId)),
    });

    const vedtakPerVedtaksId = useMemo(() => {
        const map = new Map<number, VedtakDto | undefined>();
        unikeVedtaksIder.forEach((vedtaksId, i) => {
            map.set(vedtaksId, vedtakResultater[i]?.data);
        });
        return map;
    }, [unikeVedtaksIder, vedtakResultater]);

    const perioderMedVedtak = useMemo(() => {
        return perioder.map((periode) => {
            const vedtak = periode.vedtaksid ? vedtakPerVedtaksId.get(periode.vedtaksid) : undefined;
            return {
                ...periode,
                vedtaksType: vedtak?.type,
                vedtaksTidspunkt: vedtak?.vedtakstidspunkt ?? vedtak?.opprettetTidspunkt,
            };
        });
    }, [perioder, vedtakResultater]);

    const { search: searchString } = useLocation();

    const barnMapper = new IdentQueryParamMapper(unikeKravhavere);

    const filtrertData = useMemo(() => {
        const params = new URLSearchParams(searchString);
        const typer = params.getAll(PARAM_TYPE);
        const kravhavere = barnMapper.toIdents(params.getAll(PARAM_BARN));

        const fra = parseDateQueryParam(params.get(PARAM_FRA));
        const til = parseDateQueryParam(params.get(PARAM_TIL));

        return perioderMedVedtak
            .filter((t) => {
                if (typer.length > 0 && !typer.includes(t.type ?? "")) return false;
                if (kravhavere.length > 0 && !kravhavere.includes(t.kravhaver ?? "")) return false;
                if ((fra || til) && !erInnenforPeriode(fra, til, t.periode)) return false;
                return true;
            })
            .map((t) => {
                const antallMåneder = beregnAntallMåneder(fra, til, t.periode);
                return {
                    ...t,
                    antallMåneder,
                    periodSum: antallMåneder * (t.beløp ?? 0),
                };
            });
    }, [perioderMedVedtak, searchString]);

    return {
        totalCount: perioder.length,
        filtrertData,
        unikeKravhavere,
        unikeTyper,
    };
}
