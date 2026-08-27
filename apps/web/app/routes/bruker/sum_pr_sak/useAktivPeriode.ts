import type { RolleDto } from "@bidrag/api/SakApi";
import { formaterBelop } from "@bidrag/utils";
import { useMemo } from "react";
import { sumPerValuta } from "~/common/reskontro/gjeldsberegninger.ts";
import { useBeløphistorikk } from "~/common/reskontro/useBelopshistorikk.ts";
import { erDatoInnenforPeriode } from "~/routes/sak/beløpshistorikk/periode.utils.ts";

type PeriodeFilter = "mottaker" | "skyldner";

interface AktivPeriodeOptions {
    saksnummer: string;
    ident: string;
    periodeFilter: PeriodeFilter;
    inkluderForskudd?: boolean;
}

export function useAktivPeriode({ saksnummer, ident, periodeFilter, inkluderForskudd = false }: AktivPeriodeOptions) {
    const { perioder } = useBeløphistorikk(saksnummer);
    const aktivePerioder = useMemo(
        () =>
            perioder.filter((p) => {
                const periode = p.periode;
                return erDatoInnenforPeriode(new Date(), periode);
            }),
        [perioder],
    );

    const bidrag = aktivePerioder
        .filter((p) => p[periodeFilter] === ident)
        .filter((p) => p.type === "BIDRAG" || p.type === "BIDRAG18AAR");

    const forskudd = inkluderForskudd
        ? aktivePerioder.filter((p) => p.mottaker === ident).filter((p) => p.type === "FORSKUDD")
        : [];

    const sumBidragPerValuta = sumPerValuta(bidrag);
    const sumForskuddPerValuta = sumPerValuta(forskudd);

    const getBidragForBarn = (barnIdent?: string | null): string => {
        const b = bidrag.find((p) => p.kravhaver === barnIdent);
        return `${formaterBelop(b?.beløp)}  ${b?.valutakode ?? ""} `;
    };

    const getForskuddForBarn = (barnIdent?: string | null): string => {
        const b = forskudd.find((p) => p.kravhaver === barnIdent);
        return `${formaterBelop(b?.beløp)}  ${b?.valutakode ?? ""} `;
    };

    const reellMottakerIdent = (barnIdent: string | undefined, roller: RolleDto[]): string => {
        return roller.find((rolle) => rolle.fodselsnummer === barnIdent)?.reellMottaker?.ident ?? "-";
    };

    return {
        bidrag,
        forskudd,
        sumBidragPerValuta,
        sumForskuddPerValuta,
        getBidragForBarn,
        getForskuddForBarn,
        reellMottakerIdent,
    };
}
