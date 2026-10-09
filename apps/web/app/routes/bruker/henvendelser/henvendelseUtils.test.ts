import type { HenvendelseDto } from "@bidrag/api/BidragHenvendelseApi";
import { describe, expect, it } from "vitest";
import { tilTermPerKode } from "~/api/query/kodeverk.query.ts";
import { type HenvendelseRad, modiaLenke, sorterHenvendelser, tilHenvendelseRader } from "./henvendelseUtils.ts";

function henvendelse(overstyr: Partial<HenvendelseDto> = {}): HenvendelseDto {
    return {
        kjedeId: "kjede-1",
        henvendelsestype: "MELDINGSKJEDE",
        tema: "BID",
        temagruppe: "FMLI",
        sisteMeldingSendt: "2026-06-28T09:30:00Z",
        ...overstyr,
    };
}

function rad(kjedeId: string, sisteMeldingSendt: string | null, tema = "Bidrag"): HenvendelseRad {
    return { kjedeId, sisteMeldingSendt, tema, temagruppe: "Familie", henvendelsestype: "Chat" };
}

describe("tilHenvendelseRader", () => {
    it("dekoder tema, temagruppe og henvendelsestype", () => {
        const [rad] = tilHenvendelseRader([henvendelse()], { BID: "Bidrag" }, { FMLI: "Familie" });

        expect(rad).toMatchObject({ tema: "Bidrag", temagruppe: "Familie", henvendelsestype: "Meldingskjede" });
    });

    it("viser koden når kodeverket ikke kjenner den, og strek når koden mangler", () => {
        const [rad] = tilHenvendelseRader([henvendelse({ tema: "XYZ", temagruppe: null })]);

        expect(rad).toMatchObject({ tema: "XYZ", temagruppe: "-" });
    });
});

describe("sorterHenvendelser", () => {
    const rader = [rad("eldst", "2026-01-01T00:00:00Z"), rad("uten-dato", null), rad("nyest", "2026-06-01T00:00:00Z")];

    it("sorterer nyeste først som standard, med manglende dato sist", () => {
        expect(sorterHenvendelser(rader).map((r) => r.kjedeId)).toEqual(["nyest", "eldst", "uten-dato"]);
    });

    it("legger manglende dato sist også ved stigende sortering", () => {
        const sortert = sorterHenvendelser(rader, { orderBy: "sisteMeldingSendt", direction: "ascending" });

        expect(sortert.map((r) => r.kjedeId)).toEqual(["eldst", "nyest", "uten-dato"]);
    });

    it("sorterer tekstkolonner alfabetisk", () => {
        const tekstrader = [rad("a", null, "Øvrig"), rad("b", null, "Barnetrygd")];

        const sortert = sorterHenvendelser(tekstrader, { orderBy: "tema", direction: "ascending" });

        expect(sortert.map((r) => r.tema)).toEqual(["Barnetrygd", "Øvrig"]);
    });

    it("endrer ikke lista den får inn", () => {
        sorterHenvendelser(rader);

        expect(rader.map((r) => r.kjedeId)).toEqual(["eldst", "uten-dato", "nyest"]);
    });
});

describe("tilTermPerKode", () => {
    it("bruker termen i den nyeste betydningen", () => {
        const termer = tilTermPerKode({
            betydninger: {
                BID: [
                    {
                        gyldigFra: "1900-01-01",
                        gyldigTil: "2010-01-01",
                        beskrivelser: { nb: { term: "Gammel", tekst: "" } },
                    },
                    {
                        gyldigFra: "2010-01-01",
                        gyldigTil: "9999-12-31",
                        beskrivelser: { nb: { term: "Bidrag", tekst: "" } },
                    },
                ],
            },
        });

        expect(termer).toEqual({ BID: "Bidrag" });
    });
});

describe("modiaLenke", () => {
    it("lenker til personen når kjedeId mangler", () => {
        expect(modiaLenke("12345678901")).toBe("/modia/person?sokFnr=12345678901");
    });

    it("lenker til tråden med henvendelseId", () => {
        expect(modiaLenke("12345678901", "a0J3N000004dUBJUA2")).toBe(
            "/modia/person?sokFnr=12345678901&henvendelseId=a0J3N000004dUBJUA2",
        );
    });
});
