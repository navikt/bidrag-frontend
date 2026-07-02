import { unikeVerdier } from "@bidrag/utils/arrayUtils";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { hentReskontroTransaksjonerForSaksnummer } from "~/routes/api/query/reskontro.query";

import { DUMMY_BARN } from "./konstanter";

export function useTransaksjoner(saksnummer: string) {
    const { data } = useSuspenseQuery(
        hentReskontroTransaksjonerForSaksnummer(saksnummer),
    );
    const alletransaksjoner = data?.transaksjoner ?? [];
    const unikeMottakere = useMemo(
        () => unikeVerdier(alletransaksjoner.map((t) => t.mottaker)),
        [alletransaksjoner],
    );
    const unikeBarn = useMemo(
        () =>
            unikeVerdier(
                alletransaksjoner
                    .map((t) => t.barn)
                    .filter((b) => b !== DUMMY_BARN),
            ),
        [alletransaksjoner],
    );
    const unikeTransaksjonskoder = useMemo(
        () => unikeVerdier(alletransaksjoner.map((t) => t.transaksjonskode)),
        [alletransaksjoner],
    );

    return {
        alletransaksjoner,
        unikeMottakere,
        unikeTransaksjonskoder,
        unikeBarn,
    };
}
