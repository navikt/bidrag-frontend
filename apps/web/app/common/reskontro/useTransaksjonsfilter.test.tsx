import type { Transaksjon } from "@bidrag/api/BidragReskontroApi";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { useTransaksjonsfilter } from "./useTransaksjonsfilter";

function filtrer(alletransaksjoner: Transaksjon[], search = "") {
    let resultat: ReturnType<typeof useTransaksjonsfilter> | undefined;
    function Filter() {
        resultat = useTransaksjonsfilter({
            alletransaksjoner,
            unikeMottakere: ["mottaker-b", "mottaker-a"],
            unikeBarn: ["barn-b", "barn-a"],
        });
        return null;
    }

    renderToStaticMarkup(
        <MemoryRouter initialEntries={[`/reskontro${search}`]}>
            <Filter />
        </MemoryRouter>,
    );
    if (!resultat) throw new Error("Filteret ble ikke rendret");
    return resultat;
}

describe("useTransaksjonsfilter", () => {
    it("beholder alle transaksjoner uten filter, inkludert manglende felt", () => {
        const transaksjoner = [{ transaksjonskode: "A1" }, {}];

        expect(filtrer(transaksjoner)).toEqual({ filtrertData: transaksjoner, totalTransCount: 2 });
        expect(filtrer([])).toEqual({ filtrertData: [], totalTransCount: 0 });
    });

    it("kombinerer kodegrupper og enkeltkoder", () => {
        const transaksjoner = [
            { transaksjonskode: "301" },
            { transaksjonskode: "309" },
            { transaksjonskode: "A1" },
            { transaksjonskode: "B1" },
            {},
        ];

        expect(filtrer(transaksjoner, "?kode=Innbetalinger&kode=A1")).toEqual({
            filtrertData: transaksjoner.slice(0, 3),
            totalTransCount: 5,
        });
    });

    it("filtrerer mottaker og barn med sorterte URL-nøkler, ikke identer", () => {
        const valgt = { mottaker: "mottaker-b", barn: "barn-a" };
        const transaksjoner = [
            valgt,
            { mottaker: "mottaker-a", barn: "barn-a" },
            { mottaker: "mottaker-b", barn: "barn-b" },
            {},
        ];

        expect(filtrer(transaksjoner, "?mottaker=1&b=0")).toEqual({
            filtrertData: [valgt],
            totalTransCount: 4,
        });
    });

    it("filtrerer datointervall og beholder transaksjoner uten dato", () => {
        const transaksjoner = [
            { dato: "2026-10-31" },
            { dato: "2026-11-02" },
            { dato: "2026-11-08" },
            { dato: "2026-11-10" },
            {},
        ];

        expect(filtrer(transaksjoner, "?fra=2026-11-01&til=2026-11-09").filtrertData).toEqual([
            transaksjoner[1],
            transaksjoner[2],
            transaksjoner[4],
        ]);
    });

    it("utelater bare nullrest ved filter for åpne transaksjoner", () => {
        const transaksjoner = [{ restBeløp: 0 }, { restBeløp: -10 }, { restBeløp: 10 }, { restBeløp: null }, {}];

        expect(filtrer(transaksjoner, "?opentrans=true").filtrertData).toEqual(transaksjoner.slice(1));
        expect(filtrer(transaksjoner, "?opentrans=false").filtrertData).toEqual(transaksjoner);
    });
});
