export type InntektType = "småbarnstillegg" | "utvidetBarnetrygd" | "årsinntekter";
export type InntektTypeBarn = "barnetillegg" | "kontantstøtte";
export type InntektTables = `${InntektType}.${string}` | `${InntektTypeBarn}.${string}.${string}`;
