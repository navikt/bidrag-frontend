import { RelasjonType } from "../../types/personsearch";
import { ForelderrolleType } from "../../types/personsearch";
import { RolleType } from "../../types/rolleveileder";
import { IFamilierelasjonTableData } from "../../types/table";
import {
    getFamileenhetByMotpartFodselsnummer,
    getFamilieenhetUtenMotpart,
    getFamilierelasjonByRolle,
    getMotpartRolleType,
    getRolleType,
} from "../../utils/personUtils";
import { BPWithTwoMotpart, createFamilieenheter, createValgteRoller, FODSELSNUMMER } from "../mockdata/personMock";

function tableRow(rolle: RolleType, fodselsnummer: string): IFamilierelasjonTableData {
    return {
        rolle,
        relasjon: RelasjonType.BARN,
        fodselsnummer,
        navn: fodselsnummer,
        visningsnavn: fodselsnummer,
        isChecked: true,
    };
}

describe("getFamilierelasjonByRolle", () => {
    const rows = [tableRow(RolleType.BA, "1"), tableRow(RolleType.BM, "2"), tableRow(RolleType.BA, "3")];

    it("returns only rows with the given rolle, in order", () => {
        expect(getFamilierelasjonByRolle(rows, RolleType.BA).map((r) => r.fodselsnummer)).toEqual(["1", "3"]);
        expect(getFamilierelasjonByRolle(rows, RolleType.BM).map((r) => r.fodselsnummer)).toEqual(["2"]);
    });

    it("returns empty list when no row matches", () => {
        expect(getFamilierelasjonByRolle(rows, RolleType.BP)).toEqual([]);
    });
});

describe("getFamileenhetByMotpartFodselsnummer", () => {
    const familieenheter = BPWithTwoMotpart(FODSELSNUMMER).personensFamilieenheter;

    it("finds familieenhet by motpart ident", () => {
        expect(getFamileenhetByMotpartFodselsnummer(familieenheter, "12345")).toBe(familieenheter[1]);
    });

    it("returns undefined for unknown ident", () => {
        expect(getFamileenhetByMotpartFodselsnummer(familieenheter, "00000")).toBeUndefined();
    });

    it("skips familieenheter without motpart", () => {
        const utenMotpart = createFamilieenheter(ForelderrolleType.MOR, null, []);
        expect(getFamileenhetByMotpartFodselsnummer([utenMotpart, ...familieenheter], "22222")).toBe(familieenheter[0]);
    });
});

describe("getFamilieenhetUtenMotpart", () => {
    const medMotpart = BPWithTwoMotpart(FODSELSNUMMER).personensFamilieenheter;

    it("returns familieenhet with null motpart", () => {
        const utenMotpart = createFamilieenheter(ForelderrolleType.MOR, null, []);
        expect(getFamilieenhetUtenMotpart([...medMotpart, utenMotpart])).toBe(utenMotpart);
    });

    it("returns familieenhet with undefined motpart", () => {
        const utenMotpart = createFamilieenheter(ForelderrolleType.MOR, undefined, []);
        expect(getFamilieenhetUtenMotpart([...medMotpart, utenMotpart])).toBe(utenMotpart);
    });

    it("returns undefined when all have motpart", () => {
        expect(getFamilieenhetUtenMotpart(medMotpart)).toBeUndefined();
    });
});

describe("getMotpartRolleType", () => {
    it.each([
        [RolleType.BP, RolleType.BM],
        [RolleType.BM, RolleType.BP],
        [RolleType.BA, RolleType.BP],
    ])("motpart of %s is %s", (rolle, expected) => {
        expect(getMotpartRolleType(rolle)).toBe(expected);
    });
});

describe("getRolleType", () => {
    const valgteRoller = createValgteRoller("1", "2", ["3"]);

    it("returns BP when fodselsnummer is valgt BP", () => {
        expect(getRolleType("1", valgteRoller)).toBe(RolleType.BP);
    });

    it("returns BM when fodselsnummer is valgt BM", () => {
        expect(getRolleType("2", valgteRoller)).toBe(RolleType.BM);
    });

    it("returns undefined for barn or unknown", () => {
        expect(getRolleType("3", valgteRoller)).toBeUndefined();
        expect(getRolleType("4", valgteRoller)).toBeUndefined();
    });
});
