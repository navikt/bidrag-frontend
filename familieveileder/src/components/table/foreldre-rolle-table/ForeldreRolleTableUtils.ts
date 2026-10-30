import { FamileenhetDto, RelasjonType } from "../../../types/personsearch";
import { RolleType, Rolleveileder } from "../../../types/rolleveileder";
import { IFamilierelasjonTableData } from "../../../types/table";
import { getMotpartRolleType } from "../../../utils/personUtils";

/**
 * Lager tabellrader for motpart og felles barn i en familieenhet, med avkrysning fra valgte roller.
 */
export default function createFamilierelasjonData(
    rolle: RolleType,
    familieenhet: FamileenhetDto,
    valgteRoller: Rolleveileder
): IFamilierelasjonTableData[] {
    const { fellesBarn } = familieenhet;
    const role = getMotpartRolleType(rolle);

    const motpartRow: IFamilierelasjonTableData = familieenhet.motpart && {
        rolle: role,
        relasjon: familieenhet.forelderrolleMotpart as unknown as RelasjonType,
        fodselsnummer: familieenhet.motpart.ident,
        navn: familieenhet.motpart.navn,
        visningsnavn: familieenhet.motpart.visningsnavn,
        isChecked: !!(valgteRoller?.[role.toLowerCase()] === familieenhet.motpart.ident),
    };
    const barnRow = fellesBarn.reduce(
        (acc: IFamilierelasjonTableData[], barn) => [
            ...acc,
            {
                rolle: RolleType.BA,
                relasjon: RelasjonType.BARN,
                fodselsnummer: barn.ident,
                navn: barn.navn,
                visningsnavn: barn.visningsnavn,
                isChecked: !!valgteRoller.barn.find((selectedBarn) => selectedBarn === barn.ident),
            },
        ],
        []
    );

    return [motpartRow, ...barnRow].filter((row) => row && row !== null);
}
