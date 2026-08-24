import type { Resultatkode, UtgiftBeregningDto, Utgiftstype } from "@bidrag/api/BidragBehandlingApiV1";

export interface Utgiftspost {
    dato: string | null;
    type: Utgiftstype | "" | string;
    kravbeløp: number;
    godkjentBeløp: number;
    kommentar: string;
    betaltAvBp: boolean;
    id?: number;
    utgiftstypeVisningsnavn?: string;
    erRedigerbart?: boolean;
}
export interface UtgiftFormValues {
    avslag?: Resultatkode | "";
    beregning?: UtgiftBeregningDto;
    begrunnelse: string;
    utgifter: Utgiftspost[];
    maksGodkjentBeløp: number;
    maksGodkjentBeløpBegrunnelse: string;
    maksGodkjentBeløpTaMed: boolean;
}
