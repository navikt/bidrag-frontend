import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import FamilieveilederPage from "../../pages/familieveileder/FamilieveilederPage";
import PersonSearchService from "../../service/PersonSearchService";
import { RolleType, Rolleveileder } from "../../types/rolleveileder";
import { BPWithTwoMotpart, createValgteRoller, FODSELSNUMMER } from "../mockdata/personMock";

const OPEN_BUTTON_NAME = "Åpne rolleveileder";

describe("FamilieveilederPage", () => {
    const BPTwoMotpart = BPWithTwoMotpart(FODSELSNUMMER);
    const valgteMotpart = BPTwoMotpart.personensFamilieenheter[0];
    const allBarn = valgteMotpart.fellesBarn.map((barn) => barn.ident);
    let onSubmit: ReturnType<typeof vi.fn<(rolleveileder: Rolleveileder) => void>>;
    let hentFamilierelasjoner: ReturnType<typeof vi.spyOn>;

    const getDialog = () => document.querySelector("dialog");
    const openModal = () => userEvent.click(screen.getByRole("button", { name: OPEN_BUTTON_NAME }));
    const getCheckboxes = () =>
        screen.findAllByTestId("test-foreldre-rolle-table-select") as Promise<HTMLInputElement[]>;
    async function uncheckAll() {
        for (const checkbox of await getCheckboxes()) {
            if (checkbox.checked) await userEvent.click(checkbox);
        }
    }

    beforeEach(() => {
        onSubmit = vi.fn();
        hentFamilierelasjoner = vi
            .spyOn(PersonSearchService.prototype, "hentFamilierelasjoner")
            .mockResolvedValue(BPTwoMotpart);
        render(
            <FamilieveilederPage
                fodselsnummer={FODSELSNUMMER}
                rolle={RolleType.BP}
                onSubmit={onSubmit}
                valgteRoller={createValgteRoller(FODSELSNUMMER, valgteMotpart.motpart.ident, [allBarn[0]])}
            />
        );
    });

    it("renders the open button with a closed modal", () => {
        expect(screen.getByRole("button", { name: OPEN_BUTTON_NAME })).toBeTruthy();
        expect(getDialog().open).toBe(false);
    });

    it("opens modal and fetches familierelasjoner only once", async () => {
        await openModal();

        expect(getDialog().open).toBe(true);
        expect(await screen.findByTestId("test-foreldre-modal-content")).toBeTruthy();
        expect(screen.getByRole("heading", { name: "Rolleveileder" })).toBeTruthy();
        expect(hentFamilierelasjoner).toHaveBeenCalledExactlyOnceWith(FODSELSNUMMER);
    });

    it("returns everyone when Velg alle is clicked", async () => {
        await openModal();
        const selectAll = (await screen.findByTestId("test-foreldre-rolle-table-select-all")) as HTMLInputElement;
        expect(selectAll.checked).toBe(false);

        await userEvent.click(selectAll);
        expect(selectAll.checked).toBe(true);
        await userEvent.click(screen.getByTestId("test-velg-knapp"));

        expect(onSubmit).toHaveBeenCalledExactlyOnceWith(
            createValgteRoller(FODSELSNUMMER, valgteMotpart.motpart.ident, allBarn)
        );
    });

    it("returns only barn and empty bm when only barn are selected", async () => {
        await openModal();
        await uncheckAll();
        for (const checkbox of await getCheckboxes()) {
            if (allBarn.includes(checkbox.value)) await userEvent.click(checkbox);
        }
        await userEvent.click(screen.getByTestId("test-velg-knapp"));

        expect(onSubmit).toHaveBeenCalledExactlyOnceWith(createValgteRoller(FODSELSNUMMER, "", allBarn));
    });

    it("returns only bp and bm when only bm is selected", async () => {
        await openModal();
        await uncheckAll();
        const bmCheckbox = (await getCheckboxes()).find((c) => c.value === valgteMotpart.motpart.ident);
        await userEvent.click(bmCheckbox);
        await userEvent.click(screen.getByTestId("test-velg-knapp"));

        expect(onSubmit).toHaveBeenCalledExactlyOnceWith(
            createValgteRoller(FODSELSNUMMER, valgteMotpart.motpart.ident, [])
        );
    });

    it("allows user to change motpart", async () => {
        const newMotpart = BPTwoMotpart.personensFamilieenheter[1].motpart.ident;
        await openModal();

        const select = (await screen.findByTestId("test-foreldre-modal-content-select")) as HTMLSelectElement;
        expect(select.value).toBe(valgteMotpart.motpart.ident);
        await userEvent.selectOptions(select, newMotpart);

        expect(select.value).toBe(newMotpart);
    });

    it("closes modal after submit", async () => {
        await openModal();
        await userEvent.click(await screen.findByTestId("test-velg-knapp"));

        await waitFor(() => expect(getDialog().open).toBe(false));
    });
});
