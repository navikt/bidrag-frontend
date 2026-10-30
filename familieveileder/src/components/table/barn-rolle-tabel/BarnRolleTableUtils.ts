import { PersonInfoDto, RelasjonType } from "../../../types/personsearch";
import { Rolleveileder } from "../../../types/rolleveileder";
import { IBarnRolleTableData } from "../../../types/table";
import { getRolleType } from "../../../utils/personUtils";

/**
 * Lager tabellrader for barnets mor og far, med rolle utledet fra allerede valgte roller.
 */
export function createBarnRolleTableData(
    mor: PersonInfoDto | undefined | null,
    far: PersonInfoDto | undefined | null,
    valgteRoller: Rolleveileder
): IBarnRolleTableData[] {
    const morRolle = mor &&
        mor !== null && {
            rolle: getRolleType(mor.ident, valgteRoller),
            relasjon: RelasjonType.MOR,
            fodselsnummer: mor.ident,
            navn: mor.navn,
            visningsnavn: mor.visningsnavn,
        };
    const farRolle = far &&
        far !== null && {
            rolle: getRolleType(far.ident, valgteRoller),
            relasjon: RelasjonType.FAR,
            fodselsnummer: far.ident,
            navn: far.navn,
            visningsnavn: far.visningsnavn,
        };

    return [morRolle, farRolle]
        .filter((i) => i !== undefined && i !== null)
        .sort((a, b) => a.relasjon.localeCompare(b.relasjon));
}
