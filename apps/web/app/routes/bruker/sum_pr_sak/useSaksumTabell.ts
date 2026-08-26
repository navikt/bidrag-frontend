import type { RolleDto } from "@bidrag/api/SakApi";
import { formaterBelop } from "@bidrag/utils";
import { sumPerValuta } from "~/common/reskontro/gjeldsberegninger.ts";
import { useAktivPeriode } from "~/routes/bruker/sum_pr_sak/useAktivPeriode.ts";

type PeriodeFilter = "mottaker" | "skyldner";

interface UseSaksumTabellOptions {
    saksnummer: string;
    ident: string;
    periodeFilter: PeriodeFilter;
}

export function useSaksumTabell({ saksnummer, ident, periodeFilter}: UseSaksumTabellOptions) {
    const { aktivePerioder } = useAktivPeriode(saksnummer);

    const bidrag = aktivePerioder
        .filter((p) => p[periodeFilter] === ident)
        .filter((p) => p.type === "BIDRAG" || p.type === "BIDRAG18AAR");

    const forskudd = aktivePerioder.filter((p) => p.mottaker === ident).filter((p) => p.type === "FORSKUDD")

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
