import { isAfter, isBefore } from "date-fns";
import { useMemo } from "react";
import { useLocation } from "react-router";

import { parseDateQueryParam } from "@bidrag/utils/datoUtils";
import { IdentQueryParamMapper } from "./IdentQueryParamMapper";
import { PARAM_BARN, PARAM_FRA, PARAM_KODER, PARAM_MOTTAKERE, PARAM_OPEN_TRANS, PARAM_TIL } from "./konstanter";
import { isTransaksjonGruppe, transaksjonstypeGrupper } from "./transaksjonstyper";
import { useTransaksjoner } from "./useTransaksjoner";

export function useTransaksjonsfilter(saksnummer: string) {
    const { alletransaksjoner, unikeMottakere, unikeBarn } = useTransaksjoner(saksnummer!);
    const { search: searchString } = useLocation();

    const mottakerMapper = new IdentQueryParamMapper(unikeMottakere);
    const barnMapper = new IdentQueryParamMapper(unikeBarn);

    const filtrertData = useMemo(() => {
        const params = new URLSearchParams(searchString);
        const allekoder = params.getAll(PARAM_KODER);
        const enkeltKoder = allekoder.filter((k) => !isTransaksjonGruppe(k));
        const gruppeeKoder = allekoder
            .filter((k) => isTransaksjonGruppe(k))
            .flatMap((kode) => transaksjonstypeGrupper[kode]?.transKoder ?? []);

        const koder = enkeltKoder.concat(gruppeeKoder);

        const mottakere = mottakerMapper.toIdents(params.getAll(PARAM_MOTTAKERE));
        const barn = barnMapper.toIdents(params.getAll(PARAM_BARN));

        const fra = parseDateQueryParam(params.get(PARAM_FRA));
        const til = parseDateQueryParam(params.get(PARAM_TIL));

        const openTans = params.get(PARAM_OPEN_TRANS) === "true";

        return alletransaksjoner.filter((t) => {
            if (openTans && t.restBeløp === 0) return false;
            if (koder.length > 0 && !koder.includes(t.transaksjonskode ?? "")) return false;
            if (mottakere.length > 0 && !mottakere.includes(t.mottaker ?? "")) return false;
            if (barn.length > 0 && !barn.includes(t.barn ?? "")) return false;
            if (fra && t.dato && isAfter(fra, t.dato)) return false;
            if (til && t.dato && isBefore(til, t.dato)) return false;
            return true;
        });
    }, [alletransaksjoner, searchString]);

    return {
        totalTransCount: alletransaksjoner.length,
        filtrertData,
    };
}
