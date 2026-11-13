import type { JournalpostDto } from "@bidrag/api/BidragDokumentApi";
import { describe, expect, it } from "vitest";
import { byggDokumenter } from "./saksdokumenterUtils";

describe("byggDokumenter", () => {
    it("gir dokumentene samme Dok.dato som Journalen, også for dokumenter fra Joark som er skannet senere", () => {
        const journalpost = {
            journalpostId: "JOARK-1",
            dokumentDato: "2026-11-10",
            mottattDato: "2026-11-02",
            dokumenter: [{ dokumentreferanse: "dok-1", tittel: "Søknad", metadata: {} }],
        } as unknown as JournalpostDto;

        expect(byggDokumenter([journalpost]).map((dokument) => dokument.dokumentDato)).toEqual(["2026-11-02"]);
    });
});
