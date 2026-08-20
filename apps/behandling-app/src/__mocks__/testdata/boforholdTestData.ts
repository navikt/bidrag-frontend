import type { HusstandsmedlemDtoV2 } from "@bidrag/api/BidragBehandlingApiV1";

interface Sivilstand {
    gyldigFraOgMed: string;
    datoTom: string;
    sivilstand: string;
    kilde: string;
}

export interface BoforholdData {
    husstandsBarn: HusstandsmedlemDtoV2[];
    sivilstand: Sivilstand[];
    boforholdBegrunnelseMedIVedtakNotat: string;
    boforholdBegrunnelseKunINotat: string;
}

export const boforholdData: BoforholdData = {
    husstandsBarn: [],
    sivilstand: [],
    boforholdBegrunnelseMedIVedtakNotat: "",
    boforholdBegrunnelseKunINotat: "",
};
