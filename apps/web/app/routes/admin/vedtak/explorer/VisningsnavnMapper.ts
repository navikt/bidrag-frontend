import { BEHANDLING_API_V1 } from "@bidrag/api";

import { Inntektsrapportering } from "@bidrag/api/BidragBehandlingApiV1";
import { useSuspenseQuery } from "@tanstack/react-query";

export function lastVisningsnavn() {
    return useSuspenseQuery({
        queryKey: ["visningsnavn"],
        queryFn: () => lagreVisningsnavn(),
    });
}

export async function lagreVisningsnavn() {
    return BEHANDLING_API_V1.api.hentVisningsnavn().then((response) => {
        console.log(response);
        window.localStorage.setItem("visningsnavn", JSON.stringify(response.data));
        return response.data;
    });
}

const inntekskodeMedÅrstall = [
    Inntektsrapportering.AINNTEKT.toString(),
    Inntektsrapportering.KAPITALINNTEKT.toString(),
    Inntektsrapportering.LIGNINGSINNTEKT.toString(),
];
const allInntektskoder = Object.values(Inntektsrapportering).map((entry) => entry.toString());

export function hentVisningsnavn(kode: string, årstall?: number) {
    const visningsnavnMap = JSON.parse(window.localStorage.getItem("visningsnavn") || "{}");
    const toVisningsnavn = (kode: string) => {
        return visningsnavnMap[kode] ?? "MANGLER_VISNINGSNAVN";
    };
    const toVisningsnavnInntekt = (kode: string, årstall?: number) => {
        if (inntekskodeMedÅrstall.includes(kode)) return `${toVisningsnavn(kode)} ${årstall ?? ""}`.trim();
        return toVisningsnavn(kode);
    };
    return allInntektskoder.includes(kode) ? toVisningsnavnInntekt(kode, årstall) : toVisningsnavn(kode);
}
