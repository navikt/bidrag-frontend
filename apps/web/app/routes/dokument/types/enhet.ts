import { EnhetDto, EnhetType } from "./api/EnhetTypes";

export { EnhetType };
export type Enhet = EnhetDto;

export enum BidragEnhet {
    FARSKAP = "4860",
    UTLAND = "4865",
    EGNE_ANSATTE = "4883",
    VIKAFOSSEN = "2103",
}
