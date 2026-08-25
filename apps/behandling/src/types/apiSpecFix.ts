/**
 * OpenAPI-spesifikasjonen til bidrag-behandling angir `default: ""` på flere
 * boolean- og long-felter. Det gjør at swagger-typescript-api genererer feltene
 * som `string` selv om API-et faktisk tar imot boolean/number.
 *
 * `RelaxSpecTypes` løsner opp string-felter i request-typene slik at vi kan sende
 * de reelle verdiene uten å kaste hver eneste gang.
 *
 * TODO: fjern når spesifikasjonen i bidrag-behandling er rettet.
 */
export type RelaxSpecTypes<T> = T extends (infer U)[]
    ? RelaxSpecTypes<U>[]
    : T extends string
      ? T | number | boolean
      : T extends object
        ? { [K in keyof T]: RelaxSpecTypes<T[K]> }
        : T;

/**
 * `OppdatereInntektRequest` genereres med `oppdaterInnteksperiodeSkatteprosent` som
 * påkrevd selv om backend har tom liste som default. Vi gjør alle felter valgfrie.
 */
export type OppdatereInntektRequestLosnet = RelaxSpecTypes<
    Partial<import("@bidrag/api/BidragBehandlingApiV1").OppdatereInntektRequest>
>;
