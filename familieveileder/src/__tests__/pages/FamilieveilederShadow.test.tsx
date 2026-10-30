import { render, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import FamilieveilederShadow from "../../pages/familieveileder/FamilieveilederShadow";
import PersonSearchService from "../../service/PersonSearchService";
import { RolleType } from "../../types/rolleveileder";
import { BPWithTwoMotpart, createValgteRoller, FODSELSNUMMER } from "../mockdata/personMock";

const ELEMENT_NAME = "familie-veileder";
const SUBMIT_EVENT = "familie-veileder_onSubmit";

describe("FamilieveilederShadow", () => {
    const valgteRoller = createValgteRoller(FODSELSNUMMER, "22222", ["33333"]);

    beforeEach(() => {
        vi.spyOn(PersonSearchService.prototype, "hentFamilierelasjoner").mockResolvedValue(
            BPWithTwoMotpart(FODSELSNUMMER)
        );
    });

    async function renderShadow(onSubmit = vi.fn()) {
        const result = render(
            <FamilieveilederShadow
                fodselsnummer={FODSELSNUMMER}
                rolle={RolleType.BP}
                valgteRoller={valgteRoller}
                onSubmit={onSubmit}
            />
        );
        const element = result.container.querySelector(ELEMENT_NAME) as HTMLElement;
        await waitFor(() => expect(element.shadowRoot?.getElementById("bidrag-sak-ui")).toBeTruthy());
        const app = within(element.shadowRoot.getElementById("bidrag-sak-ui"));
        await app.findByRole("button", { name: "Åpne rolleveileder" });
        return { ...result, element, app, onSubmit };
    }

    it("renders a familie-veileder element with id and serialized props", async () => {
        const { element } = await renderShadow();

        expect(element.id).toBe(`bidrag-sak-ui_familieveileder${FODSELSNUMMER}${RolleType.BP}`);
        expect(element.getAttribute("fodselsnummer")).toBe(JSON.stringify(FODSELSNUMMER));
        expect(element.getAttribute("valgteroller")).toBe(JSON.stringify(valgteRoller));
        expect(element.getAttribute("event_onsubmit")).toBe(SUBMIT_EVENT);
    });

    it("isolates the app in the shadow DOM", async () => {
        await renderShadow();
        expect(document.querySelector("button")).toBeNull();
    });

    it("calls onSubmit with result chosen inside the shadow DOM", async () => {
        const { app, onSubmit } = await renderShadow();

        await userEvent.click(app.getByRole("button", { name: "Åpne rolleveileder" }));
        await userEvent.click(await app.findByTestId("test-velg-knapp"));

        expect(onSubmit).toHaveBeenCalledExactlyOnceWith(valgteRoller);
    });

    it("stops forwarding events after unmount", async () => {
        const { onSubmit, unmount } = await renderShadow();

        window.dispatchEvent(new CustomEvent(SUBMIT_EVENT, { detail: valgteRoller }));
        expect(onSubmit).toHaveBeenCalledTimes(1);

        unmount();
        window.dispatchEvent(new CustomEvent(SUBMIT_EVENT, { detail: valgteRoller }));
        expect(onSubmit).toHaveBeenCalledTimes(1);
    });
});
