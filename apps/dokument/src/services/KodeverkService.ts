import { BIDRAG_KODEVERK_API } from "@bidrag/api";
import type { KodeverkBetydning, KodeverkKoderBetydningerResponse } from "@bidrag/api/BidragKodeverkApi";
import type { LandkodeLand, PostnummerPoststed } from "../types/api/KodeverkTypes";

const SPRAAK = "nb";

function erFortsattGyldig(gyldigTil?: string): boolean {
    if (!gyldigTil) return true;
    const [year, month, day] = gyldigTil.split("-").map(Number);
    const gyldigTilDato = new Date(year, month - 1, day);
    const idag = new Date();
    idag.setHours(0, 0, 0, 0);
    return gyldigTilDato >= idag;
}

function nyesteBetydning(betydninger: KodeverkBetydning[]): KodeverkBetydning {
    return betydninger.reduce((nyeste, gjeldende) => (nyeste.gyldigFra > gjeldende.gyldigFra ? nyeste : gjeldende));
}

/** Mapper svaret fra /kodeverk/{kodeverk} til en liste med `{ [kode]: visningstekst }`. */
function mapTilKodeVisningstekst<T extends Record<string, string>>(response: KodeverkKoderBetydningerResponse): T[] {
    return Object.entries(response.betydninger ?? {})
        .map(([kode, betydninger]) => {
            if (!betydninger || betydninger.length === 0) return null;
            return { kode, betydning: nyesteBetydning(betydninger) };
        })
        .filter((entry): entry is { kode: string; betydning: KodeverkBetydning } => entry !== null)
        .filter(({ betydning }) => erFortsattGyldig(betydning.gyldigTil))
        .map(({ kode, betydning }) => {
            const beskrivelse = betydning.beskrivelser?.[SPRAAK];
            const tekst = beskrivelse?.tekst || beskrivelse?.term || kode;
            return { [kode]: tekst } as T;
        });
}

export default class KodeverkService {
    async getPostnummere(): Promise<PostnummerPoststed[]> {
        const { data } = await BIDRAG_KODEVERK_API.kodeverk.hentKodeverk("Postnummer");
        return mapTilKodeVisningstekst<PostnummerPoststed>(data);
    }

    async getLandkoder(): Promise<LandkodeLand[]> {
        const { data } = await BIDRAG_KODEVERK_API.kodeverk.hentKodeverk("LandkoderISO2");
        return mapTilKodeVisningstekst<LandkodeLand>(data).sort((a, b) =>
            Object.values(a)[0].localeCompare(Object.values(b)[0], "nb"),
        );
    }
}
