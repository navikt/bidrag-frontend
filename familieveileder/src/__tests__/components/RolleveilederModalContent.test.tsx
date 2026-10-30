import { render, screen, within } from "@testing-library/react";
import React from "react";

import RolleveilederModalContent from "../../components/modal-content/rolleveileder-modal-content/RolleveilederModalContent";
import PersonSearchService from "../../service/PersonSearchService";
import { ForelderrolleType, PersonFamilierelasjonerResponse } from "../../types/personsearch";
import { RolleType, Rolleveileder } from "../../types/rolleveileder";
import {
    BA,
    BAWithoutForeldre,
    BAWithoutPersonensmor,
    BPWithTwoMotpart,
    createFamilieenheter,
    createPersonInfo,
    createValgteRoller,
    FODSELSNUMMER,
} from "../mockdata/personMock";

const TEST_ID = "test-rolleveileder-modal-content";

function mockFamilierelasjoner(response: PersonFamilierelasjonerResponse) {
    return vi.spyOn(PersonSearchService.prototype, "hentFamilierelasjoner").mockResolvedValue(response);
}

function renderContent(rolle: RolleType, valgteRoller: Rolleveileder) {
    render(
        <RolleveilederModalContent
            fodselsnummer={FODSELSNUMMER}
            rolle={rolle}
            onSubmit={vi.fn()}
            valgteRoller={valgteRoller}
            onClose={vi.fn()}
            testId={TEST_ID}
        />
    );
}

describe("RolleveilederModalContent", () => {
    it("shows loader until familierelasjoner are fetched", () => {
        vi.spyOn(PersonSearchService.prototype, "hentFamilierelasjoner").mockReturnValue(new Promise(() => undefined));
        renderContent(RolleType.BP, createValgteRoller(FODSELSNUMMER, "", []));

        expect(within(screen.getByTestId(TEST_ID)).getByTitle("Henter familierelasjoner")).toBeTruthy();
    });

    it("fetches familierelasjoner for fodselsnummer", async () => {
        const spy = mockFamilierelasjoner(BPWithTwoMotpart(FODSELSNUMMER));
        renderContent(RolleType.BP, createValgteRoller(FODSELSNUMMER, "", []));

        await screen.findByTestId("test-foreldre-modal-content");
        expect(spy).toHaveBeenCalledExactlyOnceWith(FODSELSNUMMER);
    });

    describe("BP", () => {
        it("renders BP in rolleveileder table and foreldre content", async () => {
            mockFamilierelasjoner(BPWithTwoMotpart(FODSELSNUMMER));
            renderContent(RolleType.BP, createValgteRoller(FODSELSNUMMER, "22222", ["33333"]));

            await screen.findByTestId("test-foreldre-modal-content");
            const [rolleveilederTable] = screen.getAllByRole("table");
            expect(within(rolleveilederTable).getByRole("rowheader").textContent).toBe("BP");
            expect(
                within(rolleveilederTable)
                    .getAllByRole("cell")
                    .map((c) => c.textContent)
            ).toEqual([FODSELSNUMMER, "Far"]);
        });

        it("removes duplicate barn within a familieenhet", async () => {
            const response = BPWithTwoMotpart(FODSELSNUMMER);
            const barn = createPersonInfo("Barn", "33333");
            response.personensFamilieenheter = [
                createFamilieenheter(ForelderrolleType.MOR, createPersonInfo("Mor", "22222"), [barn, barn]),
            ];
            mockFamilierelasjoner(response);
            renderContent(RolleType.BP, createValgteRoller(FODSELSNUMMER, "", []));

            await screen.findByTestId("test-foreldre-modal-content");
            expect(
                (screen.getAllByTestId("test-foreldre-rolle-table-select") as HTMLInputElement[]).map((c) => c.value)
            ).toEqual(["22222", "33333"]);
        });
    });

    describe("BA", () => {
        it("renders BA, MOR and FAR", async () => {
            const data = BA(FODSELSNUMMER);
            mockFamilierelasjoner(data);
            renderContent(RolleType.BA, createValgteRoller("", data.personensMor.ident, [FODSELSNUMMER]));

            expect(await screen.findByText("BA")).toBeTruthy();
            expect(await screen.findByText("MOR")).toBeTruthy();
            expect(screen.getByText("FAR")).toBeTruthy();
        });

        it("renders error and only rolleveileder table when barn has no foreldre", async () => {
            mockFamilierelasjoner(BAWithoutForeldre(FODSELSNUMMER));
            renderContent(RolleType.BA, createValgteRoller("", "", [FODSELSNUMMER]));

            expect(await screen.findByTestId("test-error-barn-modal-content")).toBeTruthy();
            expect(screen.getAllByRole("table")).toHaveLength(1);
        });

        it("renders one parent row when personens mor is missing", async () => {
            const data = BAWithoutPersonensmor(FODSELSNUMMER);
            mockFamilierelasjoner(data);
            renderContent(RolleType.BA, createValgteRoller(data.personensFar.ident, "", [FODSELSNUMMER]));

            const barnTable = await screen.findByTestId("test-barn-rolle-table");
            // header row + Far
            expect(within(barnTable).getAllByRole("row")).toHaveLength(2);
        });
    });
});
