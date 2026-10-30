import { createBarnRolleTableData } from "../../components/table/barn-rolle-tabel/BarnRolleTableUtils";
import { RelasjonType } from "../../types/personsearch";
import { RolleType } from "../../types/rolleveileder";
import { BA, createValgteRoller, FODSELSNUMMER } from "../mockdata/personMock";

describe("createBarnRolleTableData", () => {
    const { personensMor, personensFar } = BA(FODSELSNUMMER);

    it("creates rows for mor and far sorted by relasjon with roles from valgteRoller", () => {
        const result = createBarnRolleTableData(
            personensMor,
            personensFar,
            createValgteRoller(personensFar.ident, personensMor.ident, [FODSELSNUMMER])
        );

        expect(result).toEqual([
            {
                rolle: RolleType.BP,
                relasjon: RelasjonType.FAR,
                fodselsnummer: "99999",
                navn: "Far",
                visningsnavn: "Far",
            },
            {
                rolle: RolleType.BM,
                relasjon: RelasjonType.MOR,
                fodselsnummer: "88888",
                navn: "Mor",
                visningsnavn: "Mor",
            },
        ]);
    });

    it("leaves rolle undefined when parent is not valgt", () => {
        const result = createBarnRolleTableData(personensMor, personensFar, createValgteRoller("", "", []));
        expect(result.map((r) => r.rolle)).toEqual([undefined, undefined]);
    });

    it.each([
        ["mor", undefined, personensFar, RelasjonType.FAR],
        ["far", personensMor, null, RelasjonType.MOR],
    ])("omits missing %s", (_, mor, far, expectedRelasjon) => {
        const result = createBarnRolleTableData(mor, far, createValgteRoller("", "", []));
        expect(result.map((r) => r.relasjon)).toEqual([expectedRelasjon]);
    });

    it("returns empty list without parents", () => {
        expect(createBarnRolleTableData(undefined, null, createValgteRoller("", "", []))).toEqual([]);
    });
});
