import { cleanup, waitFor } from "@testing-library/react";
import { expect } from "chai";
import dayjs from "dayjs";
import { describe } from "mocha";
import React from "react";

import JournalpostDetaljer from "../../../pages/registrereJournalpost/components/journalpostdetaljer/JournalpostDetaljer";
import type { JournalpostDto } from "../../../types/api/JournalpostTypes";
import { DokumentType, JournalpostKanal, JournalpostMapper } from "../../../types/journalpost";
import { serviceStubs } from "../../resources/mockservice";
import { mountWithStoreAndReactHookForm } from "../../utils/StoreInitializer";
import { sleep } from "../../utils/TestDomUtils";
import RegisterJournalpostEventSimulator from "./RegisterJournalpostEventSimulator";

const validDateMsg = "Valid date formats ddmmyy, dd.mm.yyyy or yyyy-mm-dd";
const journalpostDto: JournalpostDto = {
    journalpostId: "123211",
    kilde: JournalpostKanal.NAV_NO_BID,
    kanal: JournalpostKanal.NAV_NO_BID,
    dokumenter: [
        {
            tittel: "",
            dokumentreferanse: "Beskrivelse",
            dokumentType: DokumentType.U,
        },
    ],
};
describe.skip("JournalpostDetaljer", () => {
    beforeEach(() => {
        cleanup();
        serviceStubs().hentJournalpostStub.callsFake(() =>
            Promise.resolve(new JournalpostMapper(journalpostDto).map()),
        );
    });
    const renderJournalpostDetaljer = async () => {
        mountWithStoreAndReactHookForm(<JournalpostDetaljer />, {
            saksnummer: "",
        });
        await waitFor(() => expect(document.querySelector(".journalpost-detaljer")).to.be.not.null, { timeout: 2000 });
    };

    it("should show journalpost source", async () => {
        await renderJournalpostDetaljer();
        expect(document.querySelector(".journalpost-kilde").textContent).to.be.eq("Kanal:Ditt NAV (innsending bidrag)");
    });

    it("should show and hide error message when date format has been corrected", async () => {
        await renderJournalpostDetaljer();
        await waitFor(() => document.querySelector(".journalpost-detaljer") !== null);

        const simulator = new RegisterJournalpostEventSimulator();
        simulator.changeMottatDato("Test");
        await waitFor(() => {
            expect(document.querySelector(".skjemaelement__feilmelding") !== null).to.eq(true, validDateMsg);
        });
        simulator.changeMottatDato("010120");

        await waitFor(() => {
            expect(document.querySelector(".skjemaelement__feilmelding") !== null).to.eq(
                false,
                "Error message should be removed",
            );
        });
    });

    it("should show error message when wrong date format has been inserted (random text)", async () => {
        await renderJournalpostDetaljer();

        await sleep(100);
        const simulator = new RegisterJournalpostEventSimulator();
        simulator.changeMottatDato("Test");

        await waitFor(() => {
            expect(document.querySelector(".skjemaelement__feilmelding").textContent).to.eq("Ugyldig format på dato");
        });
    });

    it("should show error message when invalid date on valid format has been inserted (DDMMYY)", async () => {
        await renderJournalpostDetaljer();

        const simulator = new RegisterJournalpostEventSimulator();
        simulator.changeMottatDato("400119");

        await waitFor(() => {
            expect(document.querySelector(".skjemaelement__feilmelding").textContent).to.eq("Ugyldig format på dato");
        });
    });

    it("should show error message when date is on valid format, but year is not a leap year (DDMMYY)", async () => {
        await renderJournalpostDetaljer();

        const simulator = new RegisterJournalpostEventSimulator();
        simulator.changeMottatDato("290219");
        await waitFor(() => {
            expect(document.querySelector(".skjemaelement__feilmelding")?.textContent).to.eq("Ugyldig format på dato");
        });
    });

    it("should show error message when date is past date today", async () => {
        const oneDayFromToday = dayjs().add(1, "day").format("DDMMYY");
        await renderJournalpostDetaljer();

        const simulator = new RegisterJournalpostEventSimulator();
        simulator.changeMottatDato(oneDayFromToday);
        await sleep(100);

        await waitFor(() => {
            expect(document.querySelector(".skjemaelement__feilmelding")?.textContent).to.eq(
                "Mottat dato kan ikke være senere enn dagens dato",
                "Should fail when date is after today",
            );
        });
    });

    it("should render all elements", async () => {
        await renderJournalpostDetaljer();
        // THEN
        expect(document.querySelector(".autosuggest") !== null).to.eq(true);
        expect(document.querySelector("#mottatDato") !== null).to.eq(true);
        expect(document.querySelector(".skjemaelement__feilmelding") !== null).to.eq(false);
    });
});
