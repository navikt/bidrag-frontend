import { describe, expect, it } from "vitest";
import { enheterSakenFlyttesFra, måBekrefteEnhet } from "./enheter";

describe("🔴 måBekrefteEnhet", () => {
    it("krever ikke bekreftelse når saken blir hos saksbehandlers enhet og eierfogd", () => {
        expect(måBekrefteEnhet({ enhet: "4806", innloggetEnhet: "4806", eierfogd: "4806" })).toBe(false);
    });

    it("krever bekreftelse når saken sendes til en annen enhet enn saksbehandlers", () => {
        expect(måBekrefteEnhet({ enhet: "4812", innloggetEnhet: "4806", eierfogd: undefined })).toBe(true);
    });

    it("krever bekreftelse når saken sendes til en annen enhet enn eierfogd", () => {
        expect(måBekrefteEnhet({ enhet: "4812", innloggetEnhet: undefined, eierfogd: "4806" })).toBe(true);
    });

    it("krever bekreftelse for skjermet enhet når saksbehandlers enhet er ukjent", () => {
        expect(måBekrefteEnhet({ enhet: "2103", innloggetEnhet: null, eierfogd: undefined })).toBe(true);
    });

    it("krever ikke bekreftelse når saksbehandler tilhører den skjermede enheten", () => {
        expect(måBekrefteEnhet({ enhet: "2103", innloggetEnhet: "2103", eierfogd: undefined })).toBe(false);
    });

    it("krever ikke bekreftelse før enheten er kjent", () => {
        expect(måBekrefteEnhet({ enhet: null, innloggetEnhet: "4806", eierfogd: "4806" })).toBe(false);
    });
});

describe("enheterSakenFlyttesFra", () => {
    it("viser samme enhet én gang når saksbehandlers enhet og eierfogd er like", () => {
        expect(enheterSakenFlyttesFra({ enhet: "2103", innloggetEnhet: "4806", eierfogd: "4806" })).toEqual(["4806"]);
    });
});
