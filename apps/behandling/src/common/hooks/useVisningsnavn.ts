import { Inntektsrapportering, Resultatkode, Stonadstype, Vedtakstype } from "@bidrag/api/BidragBehandlingApiV1";
import { useSuspenseQuery } from "@tanstack/react-query";
import { dateToMMYYYY, getYearFromDate } from "../../utils/date-utils";

import { BEHANDLING_API_V1 } from "../constants/api";

const inntekskodeMedÅrstall = [
    Inntektsrapportering.AINNTEKT.toString(),
    Inntektsrapportering.KAPITALINNTEKT.toString(),
    Inntektsrapportering.LIGNINGSINNTEKT.toString(),
];
const inntekskodeMedPeriode = [
    Inntektsrapportering.OVERGANGSSTONAD.toString(),
    Inntektsrapportering.AAP.toString(),
    Inntektsrapportering.SYKEPENGER.toString(),
    Inntektsrapportering.PENSJON.toString(),
    Inntektsrapportering.DAGPENGER.toString(),
    Inntektsrapportering.INTRODUKSJONSSTONAD.toString(),
    Inntektsrapportering.KVALIFISERINGSSTONAD.toString(),
    Inntektsrapportering.FORELDREPENGER.toString(),
    Inntektsrapportering.AINNTEKT_BEREGNET_12MND_FRA_OPPRINNELIG_VEDTAKSTIDSPUNKT.toString(),
    Inntektsrapportering.AINNTEKT_BEREGNET_3MND_FRA_OPPRINNELIG_VEDTAKSTIDSPUNKT.toString(),
];
const allInntektskoder = Object.values(Inntektsrapportering).map((entry) => entry.toString());
export const StønadstypeTilVisningsnavn = {
    [Stonadstype.BIDRAG]: "Bidrag",
    [Stonadstype.BIDRAG18AAR]: "Bidrag 18 år",
};
export function prefetchVisningsnavn() {
    return useSuspenseQuery({
        queryKey: ["visningsnavn"],
        queryFn: () =>
            BEHANDLING_API_V1.api.hentVisningsnavn().then((response) => {
                window.localStorage.setItem("visningsnavn", JSON.stringify(response.data));
                return response.data;
            }),
    });
}
export function hentVisningsnavnVedtakstype(kode: string, vedtakstype?: Vedtakstype) {
    return hentVisningsnavn(kode, undefined, undefined, vedtakstype);
}
export function hentVisningsnavn(
    kode: string,
    datoFom?: Date | string,
    datoTom?: Date | string,
    vedtakstype?: Vedtakstype,
) {
    const visningsnavnMap = JSON.parse(window.localStorage.getItem("visningsnavn") || "{}");
    const toVisningsnavn = (kode: string) => {
        const visningsnavn = (visningsnavnMap[kode] ?? "MANGLER_VISNINGSNAVN") as string;
        if (kode === Resultatkode.AVSLAG_PRIVAT_AVTALE_BIDRAG && vedtakstype === Vedtakstype.OPPHOR)
            return visningsnavn.replace("Avslag", "Opphør");
        return visningsnavn;
    };
    const toVisningsnavnInntekt = (kode: string, datoFom?: Date | string, datoTom?: Date | string) => {
        const årstall = getYearFromDate(datoFom);
        if (inntekskodeMedÅrstall.includes(kode)) return `${toVisningsnavn(kode)} ${årstall ?? ""}`.trim();
        if (inntekskodeMedPeriode.includes(kode)) {
            const dateString = `${dateToMMYYYY(datoFom)} - ${dateToMMYYYY(datoTom) ?? ""}`;
            return `${toVisningsnavn(kode)} ${dateString}`.trim();
        }
        return toVisningsnavn(kode);
    };
    return allInntektskoder.includes(kode) ? toVisningsnavnInntekt(kode, datoFom, datoTom) : toVisningsnavn(kode);
}
