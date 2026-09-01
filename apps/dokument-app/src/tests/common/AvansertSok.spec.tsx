import { fireEvent, screen, waitFor } from "@testing-library/react";
import { expect } from "chai";
import { describe } from "mocha";
import React from "react";
import type { SinonStub } from "sinon";

import AvansertSok from "../../common/components/person/AvansertSok";
import RegistrereJournalpostContainer from "../../pages/registrereJournalpost/RegistrereJournalpostContainer";
import { sinonSandbox } from "../resources/mocha.init";
import { PERSON_IDENT, PERSON_NAVN } from "../resources/testdata";
import { mountWithStore } from "../utils/StoreInitializer";
import { sleep } from "../utils/TestDomUtils";

const AKTOR_ID = "yar2762580775882";
describe("AvansertSok", () => {
    let openPersonSokStub: SinonStub;
    let waitForPersonSokResultStub: SinonStub;
    beforeEach(() => {
        openPersonSokStub = sinonSandbox.stub(window, "openPersonsok").returns(null);
        waitForPersonSokResultStub = sinonSandbox.stub(window, "waitForPersonSokResult").callsFake(() => {
            return new Promise((resolve) => {
                setTimeout(
                    () =>
                        resolve({
                            ok: true,
                            status: 200,
                            payload: {
                                ident: PERSON_IDENT,
                                navn: PERSON_NAVN,
                                aktoerId: AKTOR_ID,
                            },
                        }),
                    1000,
                );
            });
        });
    });

    it("Should open personsok and return result", async () => {
        const onResultStub = sinonSandbox.fake();
        mountWithStore(<AvansertSok onResult={onResultStub} />);
        const avansertSokButton = await screen.findByText("Personsøk");
        fireEvent.click(avansertSokButton);

        await waitFor(() => document.getElementById("avansertsok_modal") !== null);
        await waitFor(() => sinonSandbox.assert.calledOnce(openPersonSokStub));
        await waitFor(() => sinonSandbox.assert.calledOnce(waitForPersonSokResultStub));
        await waitFor(() => sinonSandbox.assert.calledOnce(onResultStub));

        sinonSandbox.assert.calledWith(onResultStub, {
            ident: PERSON_IDENT,
            navn: PERSON_NAVN,
            aktoerId: AKTOR_ID,
        });

        expect(document.getElementById("avansertsok_modal")).is.null;
    });

    it("Should not return search result on failure", async () => {
        const onResultStub = sinonSandbox.fake();
        waitForPersonSokResultStub.resolves({
            ok: false,
            status: 200,
            payload: null,
        });

        mountWithStore(<AvansertSok onResult={onResultStub} />);
        const avansertSokButton = await screen.findByText("Personsøk");
        fireEvent.click(avansertSokButton);

        await waitFor(() => document.getElementById("avansertsok_modal") !== null);
        await waitFor(() => sinonSandbox.assert.calledOnce(openPersonSokStub));
        await waitFor(() => sinonSandbox.assert.calledOnce(waitForPersonSokResultStub));
        await sleep(1000);
        sinonSandbox.assert.notCalled(onResultStub);
        expect(document.getElementById("avansertsok_modal")).is.null;
    });

    it("Should show error message on error", async () => {
        waitForPersonSokResultStub.resolves({
            ok: false,
            status: 200,
            payload: null,
        });

        mountWithStore(<RegistrereJournalpostContainer />, { saksnummer: "" });
        const avansertSokButton = await screen.findByText("Personsøk");
        fireEvent.click(avansertSokButton);

        await waitFor(() => document.getElementById("avansertsok_modal") !== null);
        await waitFor(() => sinonSandbox.assert.calledOnce(openPersonSokStub));
        await waitFor(() => sinonSandbox.assert.calledOnce(waitForPersonSokResultStub));
        const errorMessage = await screen.findByText("Det skjedde en feil ved henting av personinfo");
        expect(errorMessage).is.not.null;
    });

    it("Should show error message on exception", async () => {
        waitForPersonSokResultStub.rejects({
            ok: false,
            status: 200,
            payload: null,
        });

        mountWithStore(<RegistrereJournalpostContainer />, { saksnummer: "" });
        const avansertSokButton = await screen.findByText("Personsøk");
        fireEvent.click(avansertSokButton);

        await waitFor(() => document.getElementById("avansertsok_modal") !== null);
        await waitFor(() => sinonSandbox.assert.calledOnce(openPersonSokStub));
        await waitFor(() => sinonSandbox.assert.calledOnce(waitForPersonSokResultStub));
        const errorMessage = await screen.findByText("Det skjedde en feil ved henting av personinfo");
        expect(errorMessage).is.not.null;
    });
});
