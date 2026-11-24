import type { JournalpostDto } from "@bidrag/api/BidragDokumentApi";
import { describe, expect, it } from "vitest";
import { dokumentDato, standardSort } from "./journalpostUtils";

function journalpost(overrides: Partial<JournalpostDto>): JournalpostDto {
    return { dokumenter: [], ...overrides } as JournalpostDto;
}

describe("dokumentDato", () => {
    it("bruker mottattDato for journalposter fra Joark", () => {
        expect(
            dokumentDato(
                journalpost({ journalpostId: "JOARK-1", dokumentDato: "2026-11-10", mottattDato: "2026-11-02" }),
            ),
        ).toBe("2026-11-02");
    });

    it("bruker dokumentDato for Joark-journalposter uten mottattDato og for andre journalposter", () => {
        expect(dokumentDato(journalpost({ journalpostId: "JOARK-1", dokumentDato: "2026-11-10" }))).toBe("2026-11-10");
        expect(
            dokumentDato(
                journalpost({ journalpostId: "BID-1", dokumentDato: "2026-11-10", mottattDato: "2026-11-02" }),
            ),
        ).toBe("2026-11-10");
    });
});

describe("standardSort", () => {
    it("sorterer etter datoen som vises som Dok.dato, nyeste først", () => {
        // Henvendelsen ble mottatt 02.11, men skannet 10.11. Svaret ble sendt 05.11.
        const henvendelse = journalpost({
            journalpostId: "JOARK-1",
            dokumentDato: "2026-11-10",
            mottattDato: "2026-11-02",
        });
        const svar = journalpost({ journalpostId: "JOARK-2", dokumentDato: "2026-11-05", mottattDato: "2026-11-05" });

        expect([henvendelse, svar].sort(standardSort)).toEqual([svar, henvendelse]);
    });
});
