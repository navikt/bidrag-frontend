import type { TypeArManedsperiode } from "@bidrag/api/BelopshistorikkApi";
import { differenceInMonths, format, isBefore, max, min } from "date-fns";

export function erDatoInnenforPeriode(dato: Date, fom: string, tom?: string | null): boolean {
    const datoManed = format(dato, "yyyy-MM");
    const tomManed = tom ?? format(new Date(), "yyyy-MM");

    if (datoManed < fom) {
        return false;
    }

    return datoManed <= tomManed;
}

export function erInnenforPeriode(fra: Date | undefined, til: Date | undefined, periode: TypeArManedsperiode): boolean {
    const fraManed = fra ? format(fra, "yyyy-MM") : "0000-01";
    const tilManed = til ? format(til, "yyyy-MM") : format(new Date(), "yyyy-MM");
    const periodeTom = periode.til ?? format(new Date(), "yyyy-MM");
    const periodeFom = periode.fom ?? "0000-01";

    if (fraManed > tilManed) {
        return false;
    }

    return fraManed <= periodeTom && tilManed >= periodeFom;
}

/**
 * Beregner antall måneder en periode dekker, klemmet mot filtergrensene fra/til.
 * Returnerer 0 dersom perioden ikke overlapper filteret.
 */
export function beregnAntallMåneder(
    fra: Date | undefined,
    tom: Date | undefined,
    periode: TypeArManedsperiode,
): number {
    const nå = new Date();
    const filterFom = fra ?? new Date("0000-01-01");
    const filterTom = tom ?? nå;
    const periodeFom = new Date(periode.fom);
    const periodeTom = periode.til ? new Date(periode.til) : nå;

    const effektivFom = max([filterFom, periodeFom]);
    const effektivTom = min([filterTom, periodeTom]);

    if (isBefore(effektivTom, effektivFom)) return 0;

    const months = differenceInMonths(effektivFom, effektivTom);
    /** Ta med en ekstra måned dersom filterTom er før periodeTom, for å inkludere hele siste måned i perioden */
    if (tom && isBefore(filterTom, periodeTom)){
        return Math.abs(months) + 1;
    }

    return Math.abs(months);
}
