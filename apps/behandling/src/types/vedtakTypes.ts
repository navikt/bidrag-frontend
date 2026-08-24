import type {
    BeregningValideringsfeil,
    ResultatBeregningBarnDto,
    ResultatBidragberegningDto,
    ResultatSaerbidragsberegningDto,
} from "@bidrag/api/BidragBehandlingApiV1";

export interface VedtakBeregningFeil {
    melding: string[];
    detaljer?: BeregningValideringsfeil;
}
export interface VedtakBeregningResult {
    resultat?: ResultatBeregningBarnDto[];
    feil?: VedtakBeregningFeil;
}

export interface VedtakSærbidragBeregningResult {
    resultat?: ResultatSaerbidragsberegningDto;
    feil?: VedtakBeregningFeil;
}

export interface VedtakBarnebidragBeregningResult {
    resultat?: ResultatBidragberegningDto;
    feil?: VedtakBeregningFeil;
    ugyldigBeregning?: boolean;
}
