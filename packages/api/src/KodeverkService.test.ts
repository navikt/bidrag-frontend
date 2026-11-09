import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BIDRAG_KODEVERK_API } from "./api";
import type { KodeverkBetydning, KodeverkKoderBetydningerResponse } from "./api/BidragKodeverkApi";
import { KodeverkService } from "./KodeverkService";

vi.mock("./api", () => ({
    BIDRAG_KODEVERK_API: { kodeverk: { hentKodeverk: vi.fn() } },
}));

function betydning(overrides: Partial<KodeverkBetydning> = {}): KodeverkBetydning {
    return {
        gyldigFra: "2020-01-01",
        gyldigTil: "",
        beskrivelser: { nb: { tekst: "Oslo", term: "OSLO" } },
        ...overrides,
    };
}

function mockKodeverk(data: KodeverkKoderBetydningerResponse) {
    vi.mocked(BIDRAG_KODEVERK_API.kodeverk.hentKodeverk).mockResolvedValue({
        data,
    } as Awaited<ReturnType<typeof BIDRAG_KODEVERK_API.kodeverk.hentKodeverk>>);
}

describe("KodeverkService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 10, 9, 15));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("velger nyeste betydning og beholder koder til og med siste gyldighetsdag", async () => {
        mockKodeverk({
            betydninger: {
                "0001": [betydning({ gyldigFra: "2026-01-01", gyldigTil: "2026-11-09" }), betydning()],
                "0002": [betydning(), betydning({ gyldigFra: "2026-01-01", gyldigTil: "2026-11-08" })],
                "0003": [],
                "0004": [betydning()],
                "0005": [betydning({ gyldigTil: "ugyldig" })],
            },
        });

        expect(await new KodeverkService().getPostnummere()).toEqual([{ "0001": "Oslo" }, { "0004": "Oslo" }]);
        expect(BIDRAG_KODEVERK_API.kodeverk.hentKodeverk).toHaveBeenCalledWith("Postnummer");
    });

    it("bruker tekst, deretter term og til slutt koden som visningstekst", async () => {
        mockKodeverk({
            betydninger: {
                "0001": [betydning()],
                "0002": [betydning({ beskrivelser: { nb: { tekst: "", term: "BERGEN" } } })],
                "0003": [betydning({ beskrivelser: {} })],
                "0004": [betydning({ beskrivelser: { nb: { tekst: "", term: "" } } })],
            },
        });

        expect(await new KodeverkService().getPostnummere()).toEqual([
            { "0001": "Oslo" },
            { "0002": "BERGEN" },
            { "0003": "0003" },
            { "0004": "0004" },
        ]);
    });

    it("henter ISO2-landkoder og sorterer norske navn", async () => {
        mockKodeverk({
            betydninger: {
                AT: [betydning({ beskrivelser: { nb: { tekst: "Østerrike", term: "" } } })],
                SE: [betydning({ beskrivelser: { nb: { tekst: "Sverige", term: "" } } })],
                NO: [betydning({ beskrivelser: { nb: { tekst: "Norge", term: "" } } })],
            },
        });

        expect(await new KodeverkService().getLandkoder()).toEqual([
            { NO: "Norge" },
            { SE: "Sverige" },
            { AT: "Østerrike" },
        ]);
        expect(BIDRAG_KODEVERK_API.kodeverk.hentKodeverk).toHaveBeenCalledWith("LandkoderISO2");
    });
});
