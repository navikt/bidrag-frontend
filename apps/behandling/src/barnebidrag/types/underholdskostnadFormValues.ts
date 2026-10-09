import type {
    FaktiskTilsynsutgiftDto,
    ForpleiningDto,
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
export interface ForpleiningPeriode extends UnderholdPeriode, Omit<ForpleiningDto, "periode"> {}

export type UnderholdkostnadsFormPeriode =
    | StønadTilBarnetilsynPeriode
    | FaktiskTilsynsutgiftPeriode
    | TilleggsstonadPeriode
    | ForpleiningPeriode;

export interface Underhold
    extends Omit<UnderholdDto, "stønadTilBarnetilsyn" | "faktiskTilsynsutgift" | "tilleggsstønad" | "forpleining"> {
    stønadTilBarnetilsyn?: StønadTilBarnetilsynPeriode[];
    faktiskTilsynsutgift?: FaktiskTilsynsutgiftPeriode[];
    tilleggsstønad?: TilleggsstonadPeriode[];
    forpleining?: ForpleiningPeriode[];
}

export interface UnderholdAndreBarn
    extends Omit<UnderholdDto, "stønadTilBarnetilsyn" | "faktiskTilsynsutgift" | "tilleggsstønad" | "forpleining"> {
    faktiskTilsynsutgift?: FaktiskTilsynsutgiftPeriode[];
}

export type UnderholdskostnadFormValues = {
    underholdskostnaderMedIBehandling: Underhold[];
    underholdskostnaderAndreBarn?: UnderholdAndreBarn[];
    underholdskostnaderAndreBarnBegrunnelse: string;
};
