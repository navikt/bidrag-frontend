export interface Rolleveileder {
    bm: string | undefined;
    bp: string | undefined;
    barn: string[];
}

export enum RolleType {
    BM = "BM",
    BP = "BP",
    BA = "BA",
    RM = "RM",
    FR = "FR",
    UKJENT = "UKJENT",
}
