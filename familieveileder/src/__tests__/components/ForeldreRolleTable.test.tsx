import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import type { Mock } from "vitest";

import ForeldreRolleTable from "../../components/table/foreldre-rolle-table/ForeldreRolleTable";
import { RolleType } from "../../types/rolleveileder";
import { IFamilierelasjonTableData } from "../../types/table";
import { BPWithTwoMotpart, createValgteRoller, FODSELSNUMMER } from "../mockdata/personMock";

const selectedIdents = (data: IFamilierelasjonTableData[]) => data.map((d) => d.fodselsnummer);

describe("ForeldreRolleTable", () => {
    const familieenhet = BPWithTwoMotpart(FODSELSNUMMER).personensFamilieenheter[0];
    let onSelect: Mock<(data: IFamilierelasjonTableData[]) => void>;

    const getCheckboxes = () => screen.getAllByTestId("test-foreldre-rolle-table-select") as HTMLInputElement[];
    const getSelectAll = () => screen.getByTestId("test-foreldre-rolle-table-select-all") as HTMLInputElement;

    beforeEach(() => {
        onSelect = vi.fn();
        render(
            <ForeldreRolleTable
                rolleType={RolleType.BP}
                familieenhet={familieenhet}
                valgteRoller={createValgteRoller(FODSELSNUMMER, "22222", ["33333"])}
                onSelect={onSelect}
            />
        );
    });

    it("renders one checkbox per motpart and barn, checked from valgteRoller", () => {
        expect(getCheckboxes().map((c) => [c.value, c.checked])).toEqual([
            ["22222", true],
            ["33333", true],
            ["44444", false],
        ]);
        expect(getSelectAll().checked).toBe(false);
    });

    it("reports initial selection via onSelect", () => {
        expect(selectedIdents(onSelect.mock.lastCall[0])).toEqual(["22222", "33333"]);
    });

    it("toggles a single row", async () => {
        await userEvent.click(getCheckboxes()[0]);

        expect(getCheckboxes()[0].checked).toBe(false);
        expect(selectedIdents(onSelect.mock.lastCall[0])).toEqual(["33333"]);
    });

    it("selects all and then deselects all with Velg alle", async () => {
        await userEvent.click(getSelectAll());
        expect(getSelectAll().checked).toBe(true);
        expect(selectedIdents(onSelect.mock.lastCall[0])).toEqual(["22222", "33333", "44444"]);

        await userEvent.click(getSelectAll());
        expect(getSelectAll().checked).toBe(false);
        expect(onSelect.mock.lastCall[0]).toEqual([]);
    });
});
