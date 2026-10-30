import createFamilierelasjonData from "../../components/table/foreldre-rolle-table/ForeldreRolleTableUtils";
import { ForelderrolleType, RelasjonType } from "../../types/personsearch";
import { RolleType } from "../../types/rolleveileder";
import {
    BPWithTwoMotpart,
    createFamilieenheter,
    createPersonInfo,
    createValgteRoller,
    FODSELSNUMMER,
} from "../mockdata/personMock";

describe("createFamilierelasjonData", () => {
    const familieenhet = BPWithTwoMotpart(FODSELSNUMMER).personensFamilieenheter[0];

    it("creates motpart row first followed by barn, checked from valgteRoller", () => {
        const result = createFamilierelasjonData(
            RolleType.BP,
            familieenhet,
            createValgteRoller(FODSELSNUMMER, "22222", ["44444"])
        );

        expect(result).toEqual([
            {
                rolle: RolleType.BM,
                relasjon: RelasjonType.MOR,
                fodselsnummer: "22222",
                navn: "Mor",
                visningsnavn: "Mor",
                isChecked: true,
            },
            {
                rolle: RolleType.BA,
                relasjon: RelasjonType.BARN,
                fodselsnummer: "33333",
                navn: "Barn",
                visningsnavn: "Barn",
                isChecked: false,
            },
            {
                rolle: RolleType.BA,
                relasjon: RelasjonType.BARN,
                fodselsnummer: "44444",
                navn: "Barn2",
                visningsnavn: "Barn2",
                isChecked: true,
            },
        ]);
    });

    it("gives motpart BP rolle when person is BM, checked against valgteRoller.bp", () => {
        const enhet = createFamilieenheter(ForelderrolleType.FAR, createPersonInfo("Far", "55555"), []);
        const [motpart] = createFamilierelasjonData(
            RolleType.BM,
            enhet,
            createValgteRoller("55555", FODSELSNUMMER, [])
        );

        expect(motpart.rolle).toBe(RolleType.BP);
        expect(motpart.relasjon).toBe(RelasjonType.FAR);
        expect(motpart.isChecked).toBe(true);
    });

    it("does not check motpart when another person is valgt", () => {
        const [motpart] = createFamilierelasjonData(
            RolleType.BP,
            familieenhet,
            createValgteRoller(FODSELSNUMMER, "12345", [])
        );
        expect(motpart.isChecked).toBe(false);
    });

    it("omits motpart row when familieenhet has no motpart", () => {
        const enhet = createFamilieenheter(ForelderrolleType.MOR, null, [createPersonInfo("Barn", "33333")]);
        const result = createFamilierelasjonData(RolleType.BP, enhet, createValgteRoller(FODSELSNUMMER, "", []));

        expect(result.map((r) => r.fodselsnummer)).toEqual(["33333"]);
    });
});
