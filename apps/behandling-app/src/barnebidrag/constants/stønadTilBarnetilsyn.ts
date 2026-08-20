import {
    StonadTilBarnetilsynDtoSkolealderEnum,
    StonadTilBarnetilsynDtoTilsynstypeEnum,
} from "@bidrag/api/BidragBehandlingApiV1";

export const STONAD_TIL_BARNETILSYNS_TYPE = {
    [StonadTilBarnetilsynDtoTilsynstypeEnum.DELTID]: "Deltid",
    [StonadTilBarnetilsynDtoTilsynstypeEnum.HELTID]: "Heltid",
    [StonadTilBarnetilsynDtoTilsynstypeEnum.IKKE_ANGITT]: "Ikke angitt",
} as const;

export const STONAD_TIL_BARNETILSYNS_SKOLEALDER = {
    [StonadTilBarnetilsynDtoSkolealderEnum.OVER]: "Ja",
    [StonadTilBarnetilsynDtoSkolealderEnum.UNDER]: "Nei",
    [StonadTilBarnetilsynDtoSkolealderEnum.IKKE_ANGITT]: "Ikke angitt",
} as const;
