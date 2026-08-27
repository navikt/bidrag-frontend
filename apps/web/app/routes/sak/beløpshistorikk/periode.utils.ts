import type { TypeArManedsperiode } from "@bidrag/api/BelopshistorikkApi";
import {
    differenceInMonths,
    endOfMonth,
    format,
    isAfter,
    isBefore,
    lastDayOfMonth,
    max,
    min,
    subMonths,
} from "date-fns";

export function sisteDagIMnd(dato: Date): Date {
    return lastDayOfMonth(dato);
}

export function erDatoInnenforPeriode(dato: Date, periode: TypeArManedsperiode): boolean {
    const periodeFom = new Date(periode.fom);
    const periodeTom = periode.til ? endOfMonth(subMonths(new Date(periode.til), 1)) : new Date("9999-12-31");

    return !isAfter(dato, periodeTom) && !isBefore(dato, periodeFom);
}

export function erInnenforPeriode(fra: Date | undefined, til: Date | undefined, periode: TypeArManedsperiode): boolean {
    const fraManed = fra ? format(fra, "yyyy-MM") : "0000-01";
    const tilManed = til ? format(til, "yyyy-MM") : format(new Date(), "yyyy-MM");
    const periodeTom = periode.til ?? format(new Date(), "yyyy-MM");
    const periodeFom = periode.fom ?? "0000-01";

    if (fraManed > tilManed) {
        return false;
    }
    return fraManed < periodeTom && tilManed >= periodeFom;
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
    const periodeTom = periode.til ? endOfMonth(subMonths(new Date(periode.til), 1)) : nå;

    const effektivFom = max([filterFom, periodeFom]);
    const effektivTom = min([filterTom, periodeTom]);

    if (isBefore(effektivTom, effektivFom)) return 0;

    const months = differenceInMonths(effektivTom, effektivFom);
    /** Ta med en ekstra måned for å få med inneværende */
    return Math.abs(months) + 1;
}
