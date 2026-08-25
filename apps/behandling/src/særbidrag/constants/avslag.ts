import { Resultatkode } from "@bidrag/api/BidragBehandlingApiV1";

export const AvslagListe = [
    Resultatkode.UTGIFTER_DEKKES_AV_BARNEBIDRAGET,
    Resultatkode.MANGLENDE_DOKUMENTASJON,
    Resultatkode.IKKENODVENDIGEUTGIFTER,
    Resultatkode.AVSLAGPRIVATAVTALEOMSAeRBIDRAG,
];

export const AvslagListeEtterUtgifterErUtfylt = [
    Resultatkode.ALLE_UTGIFTER_ER_FORELDET,
    Resultatkode.GODKJENTBELOPERLAVEREENNFORSKUDDSSATS,
];
