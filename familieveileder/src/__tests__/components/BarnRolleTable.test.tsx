import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import type { Mock } from "vitest";

import { ISelectData } from "../../components/select/role-select/RoleSelect";
import BarnRolleTable from "../../components/table/barn-rolle-tabel/BarnRolleTable";
import { createBarnRolleTableData } from "../../components/table/barn-rolle-tabel/BarnRolleTableUtils";
import { HEADER } from "../../constants/table";
import { BA, createValgteRoller, FODSELSNUMMER } from "../mockdata/personMock";

describe("BarnRolleTable", () => {
    const { personensMor, personensFar } = BA(FODSELSNUMMER);
    const valgteRoller = createValgteRoller("", personensMor.ident, [FODSELSNUMMER]);
    const MOR_SELECT_TESTID = `test-role-select-${personensMor.visningsnavn}`;
    const FAR_SELECT_TESTID = `test-role-select-${personensFar.visningsnavn}`;
    let onSelectRole: Mock<(data: ISelectData) => void>;

    beforeEach(() => {
        onSelectRole = vi.fn();
        render(
            <BarnRolleTable
                tableData={createBarnRolleTableData(personensMor, personensFar, valgteRoller)}
                onSelectRole={onSelectRole}
            />
        );
    });

    it("renders headers without Velg-column and one select per parent", () => {
        const table = screen.getByTestId("test-barn-rolle-table");
        expect(
            within(table)
                .getAllByRole("columnheader")
                .map((c) => c.textContent)
        ).toEqual(HEADER.FAMILIERELASJON.slice(1));
        expect(screen.getAllByTestId(/test-role-select/i)).toHaveLength(2);
    });

    it("renders relasjon, fodselsnummer and visningsnavn for each parent", () => {
        const rows = within(screen.getByTestId("test-barn-rolle-table")).getAllByRole("row").slice(1);
        expect(
            rows.map((r) =>
                within(r)
                    .getAllByRole("cell")
                    .slice(1)
                    .map((c) => c.textContent)
            )
        ).toEqual([
            ["FAR", "99999", "Far"],
            ["MOR", "88888", "Mor"],
        ]);
    });

    it("sets default option from valgteRoller", () => {
        expect((screen.getByTestId(MOR_SELECT_TESTID) as HTMLSelectElement).value).toBe("BM");
        expect((screen.getByTestId(FAR_SELECT_TESTID) as HTMLSelectElement).value).toBe("");
    });

    it("allows user to change role", async () => {
        await userEvent.selectOptions(screen.getByTestId(MOR_SELECT_TESTID), "BP");

        expect((screen.getByTestId(MOR_SELECT_TESTID) as HTMLSelectElement).value).toBe("BP");
        expect(onSelectRole).toHaveBeenCalledExactlyOnceWith({ name: "Mor", value: "BP" });
    });
});
