import type {
    FaktiskTilsynsutgiftDto,
    StonadTilBarnetilsynDto,
    StonadTilBarnetilsynDtoSkolealderEnum,
    StonadTilBarnetilsynDtoTilsynstypeEnum,
    TilleggsstonadDto,
    UnderholdDto,
} from "@bidrag/api/BidragBehandlingApiV1";

interface UnderholdPeriode {
    datoFom: string;
    datoTom: string | "";
    kanRedigeres: boolean;
    erRedigerbart: boolean;
}

export interface StønadTilBarnetilsynPeriode
    extends UnderholdPeriode,
        Omit<StonadTilBarnetilsynDto, "skolealder" | "tilsynstype" | "periode"> {
    skolealder?: StonadTilBarnetilsynDtoSkolealderEnum | "";
    tilsynstype?: StonadTilBarnetilsynDtoTilsynstypeEnum | "";
}
export interface FaktiskTilsynsutgiftPeriode extends UnderholdPeriode, Omit<FaktiskTilsynsutgiftDto, "periode"> {}
export interface TilleggsstonadPeriode extends UnderholdPeriode, Omit<TilleggsstonadDto, "periode"> {}

export type UnderholdkostnadsFormPeriode =
    | StønadTilBarnetilsynPeriode
    | FaktiskTilsynsutgiftPeriode
    | TilleggsstonadPeriode;

export interface Underhold
    extends Omit<UnderholdDto, "stønadTilBarnetilsyn" | "faktiskTilsynsutgift" | "tilleggsstønad"> {
    stønadTilBarnetilsyn?: StønadTilBarnetilsynPeriode[];
    faktiskTilsynsutgift?: FaktiskTilsynsutgiftPeriode[];
    tilleggsstønad?: TilleggsstonadPeriode[];
}

export interface UnderholdAndreBarn
    extends Omit<UnderholdDto, "stønadTilBarnetilsyn" | "faktiskTilsynsutgift" | "tilleggsstønad"> {
    faktiskTilsynsutgift?: FaktiskTilsynsutgiftPeriode[];
}

export type UnderholdskostnadFormValues = {
    underholdskostnaderMedIBehandling: Underhold[];
    underholdskostnaderAndreBarn?: UnderholdAndreBarn[];
    underholdskostnaderAndreBarnBegrunnelse: string;
};
