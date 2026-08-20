import type { Rolletype } from "@bidrag/api/BidragBehandlingApiV1";
import { RolleTypeAbbreviation } from "@bidrag/common";

/**
 * API-et og @bidrag/common har hver sin enum for rolletype med identiske verdier.
 * Denne mapper fra API-enumen til enumen komponentene i @bidrag/common forventer.
 */
export function tilRolleType(rolletype?: Rolletype | string | null): RolleTypeAbbreviation | undefined {
    if (!rolletype) return undefined;
    return RolleTypeAbbreviation[rolletype as keyof typeof RolleTypeAbbreviation];
}
