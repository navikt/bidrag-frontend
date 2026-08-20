import { type RolleDto, Rolletype } from "@bidrag/api/BidragBehandlingApiV1";

export interface IRolleUI extends RolleDto {
    navn: string;
}

export function mapRolle(rolle: Rolletype): string {
    switch (rolle) {
        case Rolletype.BM:
            return "BIDRAGSMOTTAKER";
        case Rolletype.BP:
            return "BIDRAGSPLIKTIG";
    }
    return rolle;
}
