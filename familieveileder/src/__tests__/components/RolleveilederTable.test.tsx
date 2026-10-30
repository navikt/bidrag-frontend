import { render, screen, within } from "@testing-library/react";
import React from "react";

import RolleveilederTable from "../../components/table/rolleveileder-table/RolleveilederTable";
import { HEADER } from "../../constants/table";
import { RolleType } from "../../types/rolleveileder";
import { FODSELSNUMMER } from "../mockdata/personMock";

describe("RolleveilederTable", () => {
    it("renders headers and a row with rolle, fodselsnummer and navn", () => {
        render(<RolleveilederTable rolle={RolleType.BP} fodselsnummer={FODSELSNUMMER} navn="Far" />);

        const [headerRow, bodyRow] = screen.getAllByRole("row");
        expect(
            within(headerRow)
                .getAllByRole("columnheader")
                .map((c) => c.textContent)
        ).toEqual(HEADER.ROLLEVEILEDER);
        expect(within(bodyRow).getByRole("rowheader").textContent).toBe(RolleType.BP);
        expect(
            within(bodyRow)
                .getAllByRole("cell")
                .map((c) => c.textContent)
        ).toEqual([FODSELSNUMMER, "Far"]);
    });
});
