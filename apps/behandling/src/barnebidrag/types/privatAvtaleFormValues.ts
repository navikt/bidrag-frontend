import type {
    Kilde,
    PrivatAvtaleType,
    Samvaersklasse,
    Stonadstype,
    Valutakode,
} from "@bidrag/api/BidragBehandlingApiV1";

export type PrivatAvtaleFormValue = {
    gjelderBarn: {
        id: number;
        ident?: string;
        navn?: string;
        fødselsdato?: string;
        kilde?: Kilde;
        stønadstype?: Stonadstype | null;
    };
    harLøpendeBidrag: boolean;
    saksnummer?: string;
    enhet?: string;
    begrunnelse?: string;
    privatAvtale: PrivatAvtaleFormValuesPerBarn | null;
};
export type PrivatAvtaleFormValues = {
    roller: PrivatAvtaleFormValue[];
    andreBarn: PrivatAvtaleFormValue[];
    andreBarnBegrunnelse: string;
};
export type PrivatAvtalePeriode = {
    id?: number;
    fom: string | null;
    tom: string | null;
    beløp: number;
    samværsklasse?: Samvaersklasse | "";
    valutakode?: Valutakode | "";
};
export type PrivatAvtaleFormValuesPerBarn = {
    avtaleDato: string | null;
    avtaleType?: PrivatAvtaleType | string;
    perioder: PrivatAvtalePeriode[];
    skalIndeksreguleres: boolean;
    avtaleId: number;
    gjelderUtland?: boolean;
    stønadstype?: Stonadstype | null;
};
