export enum ForelderrolleType {
    FAR = "FAR",
    MOR = "MOR",
    BARN = "BARN",
}

export enum RelasjonType {
    FAR = "FAR",
    MOR = "MOR",
    BARN = "BARN",
}

export interface FamileenhetPersonInfo {
    ident: string;
}

export interface FamileenhetDto {
    forelderrolleMotpart: ForelderrolleType;
    motpart: FamileenhetPersonInfo | undefined | null;
    fellesBarn: FamileenhetPersonInfo[];
}
