import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import ForeldreModalContent from "../../components/modal-content/foreldre-modal-content/ForeldreModalContent";
import { ForelderrolleType } from "../../types/personsearch";
import { RolleType, Rolleveileder } from "../../types/rolleveileder";
import {
    BPWithTwoMotpart,
    createFamilieenheter,
    createPersonInfo,
    createValgteRoller,
    FODSELSNUMMER,
} from "../mockdata/personMock";

const UKJENT = "ukjent";

describe("ForeldreModalContent", () => {
    const familieenheter = BPWithTwoMotpart(FODSELSNUMMER).personensFamilieenheter;
    const getMotpartSelect = () => screen.getByTestId("test-foreldre-modal-content-select") as HTMLSelectElement;
    const checkedIdents = () =>
        (screen.getAllByTestId("test-foreldre-rolle-table-select") as HTMLInputElement[])
            .filter((c) => c.checked)
            .map((c) => c.value);

    function renderContent(valgteRoller: Rolleveileder, personensFamilieenheter = familieenheter) {
        const onSubmit = vi.fn();
        const onClose = vi.fn();
        render(
            <ForeldreModalContent
                fodselsnummer={FODSELSNUMMER}
                rolle={RolleType.BP}
                valgteRoller={valgteRoller}
                personensFamilieenheter={personensFamilieenheter}
                onSubmit={onSubmit}
                onClose={onClose}
            />
        );
        return { onSubmit, onClose };
    }

    it("lists motparter and Ukjent as options", () => {
        renderContent(createValgteRoller(FODSELSNUMMER, "", []));
        expect(Array.from(getMotpartSelect().options).map((o) => [o.value, o.text])).toEqual([
            ["22222", "Mor"],
            ["12345", "Mor2"],
            [UKJENT, "Ukjent"],
        ]);
    });

    it("defaults to first familieenhet when nothing is valgt", () => {
        renderContent(createValgteRoller(FODSELSNUMMER, "", []));
        expect(getMotpartSelect().value).toBe("22222");
    });

    it("selects familieenhet of valgt motpart", () => {
        renderContent(createValgteRoller(FODSELSNUMMER, "12345", []));
        expect(getMotpartSelect().value).toBe("12345");
        expect(checkedIdents()).toEqual(["12345"]);
    });

    it("selects familieenhet of valgt barn when motpart is not valgt", () => {
        renderContent(createValgteRoller(FODSELSNUMMER, "", ["678910"]));
        expect(getMotpartSelect().value).toBe("12345");
        expect(checkedIdents()).toEqual(["678910"]);
    });

    it("falls back to Ukjent when valgt motpart is not in any familieenhet", () => {
        renderContent(createValgteRoller(FODSELSNUMMER, "00000", []));
        expect(getMotpartSelect().value).toBe(UKJENT);
        expect(screen.queryAllByTestId("test-foreldre-rolle-table-select")).toEqual([]);
    });

    it("shows barn without motpart under Ukjent", async () => {
        const utenMotpart = createFamilieenheter(ForelderrolleType.MOR, null, [createPersonInfo("Barn4", "55555")]);
        renderContent(createValgteRoller(FODSELSNUMMER, "", []), [...familieenheter, utenMotpart]);

        await userEvent.selectOptions(getMotpartSelect(), UKJENT);

        expect(
            (screen.getAllByTestId("test-foreldre-rolle-table-select") as HTMLInputElement[]).map((c) => c.value)
        ).toEqual(["55555"]);
    });

    it("submits person, selected motpart and barn and closes", async () => {
        const { onSubmit, onClose } = renderContent(createValgteRoller(FODSELSNUMMER, "22222", ["33333"]));

        await userEvent.click(screen.getByTestId("test-velg-knapp"));

        expect(onSubmit).toHaveBeenCalledExactlyOnceWith({ bp: FODSELSNUMMER, bm: "22222", barn: ["33333"] });
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("submits only from the newly selected motpart after switching", async () => {
        const { onSubmit } = renderContent(createValgteRoller(FODSELSNUMMER, "", []));

        await userEvent.selectOptions(getMotpartSelect(), "12345");
        await userEvent.click(screen.getByTestId("test-foreldre-rolle-table-select-all"));
        await userEvent.click(screen.getByTestId("test-velg-knapp"));

        expect(onSubmit).toHaveBeenCalledExactlyOnceWith({ bp: FODSELSNUMMER, bm: "12345", barn: ["678910"] });
    });

    it("Avbryt closes without submitting", async () => {
        const { onSubmit, onClose } = renderContent(createValgteRoller(FODSELSNUMMER, "", []));

        await userEvent.click(screen.getByTestId("test-avbryt-knapp"));

        expect(onClose).toHaveBeenCalledTimes(1);
        expect(onSubmit).not.toHaveBeenCalled();
    });
});
