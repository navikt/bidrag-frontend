import type { TypeArManedsperiode } from "@bidrag/api/BelopshistorikkApi";
import { format } from "date-fns";

export function erDatoInnenforPeriode(
    dato: Date,
    fom: string,
    tom?: string | null,
): boolean {
    const datoManed = format(dato, "yyyy-MM");
    const tomManed = tom ?? format(new Date(), "yyyy-MM");

    if (datoManed < fom) {
        return false;
    }

    return datoManed <= tomManed;
}

export function erInnenforPeriode(
    fra: Date | undefined,
    til: Date | undefined,
    periode: TypeArManedsperiode,
): boolean {
    const fraManed = fra ? format(fra, "yyyy-MM") : "0000-01";
    const tilManed = til
        ? format(til, "yyyy-MM")
        : format(new Date(), "yyyy-MM");
    const periodeTom = periode.til ?? format(new Date(), "yyyy-MM");
    const periodeFom = periode.fom ?? "0000-01";

    if (fraManed > tilManed) {
        return false;
    }

    return fraManed <= periodeTom && tilManed >= periodeFom;
}
