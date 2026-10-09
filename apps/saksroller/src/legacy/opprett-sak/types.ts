import type { PersonDto } from "@bidrag/api/PersonApi";

import type { RolleType } from "./RolleType.ts";

/**
 * Lokale typer for "Opprett ny sak"-modalen, migrert fra bidrag-ui
 * (apps/sak-ui/src/types/person.ts). Personopplysninger kommer nå direkte fra
 * `PersonDto` (packages/api) i stedet for en egen lokal `IPerson`-type.
 */
export interface IPersonensReellMottakerRolle extends PersonDto {
    checked: boolean;
    error?: string;
    reellMottaker?: string;
    rolle: RolleType;
}

export interface IForeldreRoleData {
    minRolleForPerson: string;
    relatertPersonsIdent: string;
    relatertPersonsNavn?: string;
    relatertPersonsRolle: string;
    role?: RolleType;
}
