import { type RolleType, RolleTypeAbbreviation } from "@bidrag/common";

export function mapRolleToDisplayValue(rolleType: RolleType): string {
    switch (rolleType) {
        case RolleTypeAbbreviation.BA:
            return "Barn";
        case RolleTypeAbbreviation.BM:
            return "Bidragsmottaker";
        case RolleTypeAbbreviation.BP:
            return "Bidragspliktig";
        case RolleTypeAbbreviation.RM:
            return "Reel mottaker";
    }
    return rolleType;
}
