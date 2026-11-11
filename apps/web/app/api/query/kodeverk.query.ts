import { BIDRAG_KODEVERK_API } from "@bidrag/api";
import type { KodeverkKoderBetydningerResponse } from "@bidrag/api/BidragKodeverkApi";
import { withQueryErrorHandlingV2 } from "@bidrag/common";
import { queryOptions } from "@tanstack/react-query";

export type Kodeverknavn = "Tema" | "Temagrupper";

export function hentKodeverk(kodeverk: Kodeverknavn) {
    return queryOptions({
        queryKey: ["hentKodeverk", kodeverk],
        queryFn: () =>
            withQueryErrorHandlingV2(`hentKodeverk ${kodeverk}`, async () => {
                const { data } = await BIDRAG_KODEVERK_API.kodeverk.hentKodeverk(kodeverk);
                return tilTermPerKode(data);
            }),
        staleTime: Infinity,
    });
}

/** Bruker den nyeste betydningen av hver kode, slik at en utgått kode fortsatt får et navn. */
export function tilTermPerKode(response: KodeverkKoderBetydningerResponse): Record<string, string> {
    const termPerKode: Record<string, string> = {};
    for (const [kode, betydninger] of Object.entries(response.betydninger ?? {})) {
        if (!betydninger?.length) continue;
        const nyeste = betydninger.reduce((a, b) => (a.gyldigFra >= b.gyldigFra ? a : b));
        const beskrivelse = nyeste.beskrivelser?.nb;
        termPerKode[kode] = beskrivelse?.term || beskrivelse?.tekst || kode;
    }
    return termPerKode;
}
