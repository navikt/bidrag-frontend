import { describe, expect, it } from "vitest";
import { byggHref, finnStandardReturMål } from "./returLink.ts";

describe("byggHref", () => {
    it("tar med enhet fra URL-en når målet ikke har enhet i params", () => {
        const href = byggHref(
            { sti: "/sak/123/behandling/1", params: undefined },
            new URLSearchParams("enhet=4806&sessionState=abc"),
        );
        expect(href).toBe("/sak/123/behandling/1?sessionState=abc&enhet=4806");
    });

    it("beholder enhet fra målets params", () => {
        const href = byggHref(
            { sti: "/forsendelse/9", params: new URLSearchParams({ enhet: "4806" }) },
            new URLSearchParams("enhet=4806"),
        );
        expect(href).toBe("/forsendelse/9?enhet=4806");
    });

    it("legger ikke til enhet når URL-en mangler den", () => {
        const href = byggHref({ sti: "/sak/123", params: undefined }, new URLSearchParams("sessionState=abc"));
        expect(href).toBe("/sak/123?sessionState=abc");
    });
});

describe("finnStandardReturMål", () => {
    it("treffer sakas indeksside eksakt", () => {
        expect(finnStandardReturMål("/sak/123", { saksnummer: "123" })).toEqual({
            label: "Sak",
            sti: "/bisys/sak",
            params: { saksnr: "123" },
        });
    });

    it("treffer sakas egne undersider (f.eks. reskontro)", () => {
        expect(finnStandardReturMål("/sak/123/reskontro", { saksnummer: "123" })).toEqual({
            label: "Sak",
            sti: "/bisys/sak",
            params: { saksnr: "123" },
        });
    });

    it("faller ikke tilbake på Sak for undersider av sakshistorikk", () => {
        // /sak/123/behandling ligger under Sakshistorikk, ikke direkte under Sak,
        // selv om stien starter med /sak/123. Uten from=bisys går den til
        // sakshistorikk i denne appen.
        expect(finnStandardReturMål("/sak/123/behandling", { saksnummer: "123" })).toEqual({
            label: "Sakshistorikk",
            sti: "/sak/123/sakshistorikk",
        });
    });

    it("treffer sakshistorikkens undersider", () => {
        expect(finnStandardReturMål("/sak/123/vedtak", { saksnummer: "123" })).toEqual({
            label: "Sakshistorikk",
            sti: "/sak/123/sakshistorikk",
        });
    });

    it("ruter sakshistorikk-undersider tilbake til Bisys når from=bisys", () => {
        expect(
            finnStandardReturMål("/sak/123/behandling", { saksnummer: "123" }, new URLSearchParams({ from: "bisys" })),
        ).toEqual({
            label: "Sakshistorikk",
            sti: "/bisys/sakshistorikk",
            params: { saksnr: "123" },
        });
    });

    it("treffer nøstede stier under en named underside", () => {
        // erSammeEllerUnder skal fortsatt gjelde for navngitte undersider,
        // slik at f.eks. /sak/123/behandling/rediger også havner under Sakshistorikk.
        expect(finnStandardReturMål("/sak/123/behandling/detaljer", { saksnummer: "123" })).toEqual({
            label: "Sakshistorikk",
            sti: "/sak/123/sakshistorikk",
        });
    });

    it("treffer brukeroversiktens indeksside eksakt", () => {
        expect(finnStandardReturMål("/bruker/456", { brukerid: "456" })).toEqual({
            label: "Brukeroversikt",
            sti: "/bisys/brukeroversikt",
            params: { ident: "456" },
        });
    });

    it("treffer brukeroversiktens undersider", () => {
        expect(finnStandardReturMål("/bruker/456/reskontro", { brukerid: "456" })).toEqual({
            label: "Brukeroversikt",
            sti: "/bisys/brukeroversikt",
            params: { ident: "456" },
        });
    });

    it("returnerer null når ingen kontekst passer", () => {
        expect(finnStandardReturMål("/en/annen/side", {})).toBeNull();
    });

    it("returnerer null når stien ikke matcher noen undersider", () => {
        expect(finnStandardReturMål("/sak/123/ukjent-side", { saksnummer: "123" })).toBeNull();
    });

    it("journalvisning utenfor sakskontekst faller til Oppgaveliste", () => {
        expect(finnStandardReturMål("/journal/456", {})).toEqual({
            label: "Oppgaveliste",
            sti: "/bisys/oppgaveliste",
        });
    });

    it("registrering av journalpost under en sak faller til Sakshistorikk", () => {
        expect(finnStandardReturMål("/sak/123/journalpost/456", { saksnummer: "123" })).toEqual({
            label: "Sakshistorikk",
            sti: "/sak/123/sakshistorikk",
        });
    });

    it("ny sak uten saksnummer går tilbake til Bisys", () => {
        expect(finnStandardReturMål("/sak/ny", { saksnummer: "ny" })).toEqual({
            label: "Bisys",
            sti: "/bisys/oppgaveliste",
        });
    });

    it("registrering av journalpost utenfor sakskontekst faller til Oppgaveliste", () => {
        expect(finnStandardReturMål("/journalpost/456", {})).toEqual({
            label: "Oppgaveliste",
            sti: "/bisys/oppgaveliste",
        });
    });
});
