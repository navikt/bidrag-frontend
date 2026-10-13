// Rolletyper brukt av "Opprett ny sak"-funksjonaliteten. Denne har med vilje en
// egen `UKJENT`-verdi (i motsetning til `RolleTypeAbbreviation` i
// packages/common/src/types/roller/RolleType.ts), siden modalen må kunne
// representere "ukjent motpart"/"ukjent BM" som en egen valgbar rolle.
export enum RolleType {
    BM = "BM",
    BP = "BP",
    BA = "BA",
    RM = "RM",
    FR = "FR",
    UKJENT = "UKJENT",
}
