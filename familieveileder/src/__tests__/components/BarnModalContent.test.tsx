import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import BarnModalContent from "../../components/modal-content/barn-modal-content/BarnModalContent";
import { BA, BAWithoutForeldre, createValgteRoller, FODSELSNUMMER } from "../mockdata/personMock";

describe("BarnModalContent", () => {
    const familierelasjoner = BA(FODSELSNUMMER);
    const { personensMor, personensFar } = familierelasjoner;
    const morSelect = () => screen.getByTestId(`test-role-select-${personensMor.visningsnavn}`) as HTMLSelectElement;
    const farSelect = () => screen.getByTestId(`test-role-select-${personensFar.visningsnavn}`) as HTMLSelectElement;

    function renderContent(valgteRoller = createValgteRoller("", "", [FODSELSNUMMER])) {
        const onSubmit = vi.fn();
        const onClose = vi.fn();
        render(
            <BarnModalContent
                familierelasjoner={familierelasjoner}
                valgteRoller={valgteRoller}
                onSubmit={onSubmit}
                onClose={onClose}
            />
        );
        return { onSubmit, onClose };
    }

    it("selecting a role for one parent gives the other parent the opposite role", async () => {
        renderContent();

        await userEvent.selectOptions(morSelect(), "BM");

        expect(morSelect().value).toBe("BM");
        expect(farSelect().value).toBe("BP");
    });

    it("submits fodselsnummer per role, keeps barn and closes", async () => {
        const { onSubmit, onClose } = renderContent();

        await userEvent.selectOptions(farSelect(), "BM");
        await userEvent.click(screen.getByTestId("test-velg-knapp"));

        expect(onSubmit).toHaveBeenCalledExactlyOnceWith({
            bm: personensFar.ident,
            bp: personensMor.ident,
            barn: [FODSELSNUMMER],
        });
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("submits empty strings when no roles are chosen", async () => {
        const { onSubmit } = renderContent();

        await userEvent.click(screen.getByTestId("test-velg-knapp"));

        expect(onSubmit).toHaveBeenCalledExactlyOnceWith({ bm: "", bp: "", barn: [FODSELSNUMMER] });
    });

    it("submits pre-selected roles unchanged", async () => {
        const { onSubmit } = renderContent(createValgteRoller(personensFar.ident, personensMor.ident, [FODSELSNUMMER]));

        await userEvent.click(screen.getByTestId("test-velg-knapp"));

        expect(onSubmit).toHaveBeenCalledExactlyOnceWith({
            bm: personensMor.ident,
            bp: personensFar.ident,
            barn: [FODSELSNUMMER],
        });
    });

    it("Avbryt closes without submitting", async () => {
        const { onSubmit, onClose } = renderContent();

        await userEvent.click(screen.getByTestId("test-avbryt-knapp"));

        expect(onClose).toHaveBeenCalledTimes(1);
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it("shows error with Avbryt when barn has no foreldre", async () => {
        const onClose = vi.fn();
        render(
            <BarnModalContent
                familierelasjoner={BAWithoutForeldre(FODSELSNUMMER)}
                valgteRoller={createValgteRoller("", "", [FODSELSNUMMER])}
                onSubmit={vi.fn()}
                onClose={onClose}
            />
        );

        expect(screen.getByTestId("test-error-barn-modal-content").textContent).toContain(
            "Det finnes ikke registrerte foreldre for barnet"
        );
        expect(screen.queryByRole("table")).toBeNull();
        await userEvent.click(screen.getByRole("button", { name: "Avbryt" }));
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
