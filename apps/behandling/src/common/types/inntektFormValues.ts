import type { InntektDtoV2, Inntektsrapportering, Inntektstype } from "@bidrag/api/BidragBehandlingApiV1";

export interface InntektFormPeriode extends Omit<InntektDtoV2, "rapporteringstype"> {
    angittPeriode?: {
        fom?: string;
        til?: string;
    };
    inntektstype?: Inntektstype | "";
    skattesats?: number;
    rapporteringstype: Inntektsrapportering | "";
    beløpMnd?: number;
    erRedigerbart?: boolean;
    nyPeriodeSomLagres?: boolean;
    kanRedigeres?: boolean;
    kanBarnetilleggSkattesatsRedigeres?: boolean;
}
export interface InntektFormValues {
    årsinntekter: { [key: string]: InntektFormPeriode[] };
    barnetillegg: { [key: string]: { [key: string]: InntektFormPeriode[] } };
    småbarnstillegg: { [key: string]: InntektFormPeriode[] };
    kontantstøtte: { [key: string]: { [key: string]: InntektFormPeriode[] } };
    utvidetBarnetrygd: { [key: string]: InntektFormPeriode[] };
    begrunnelser?: { [key: string]: string };
}
