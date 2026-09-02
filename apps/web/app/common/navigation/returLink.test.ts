import { describe, expect, it } from "vitest";
import { finnStandardReturMål } from "./returLink.ts";

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
        // selv om stien starter med /sak/123.
        expect(finnStandardReturMål("/sak/123/behandling", { saksnummer: "123" })).toEqual({
            label: "Sakshistorikk",
            sti: "/bisys/sakshistorikk",
            params: { saksnr: "123" },
        });
    });

    it("treffer sakshistorikkens undersider", () => {
        expect(finnStandardReturMål("/sak/123/vedtak", { saksnummer: "123" })).toEqual({
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
            sti: "/bisys/sakshistorikk",
            params: { saksnr: "123" },
        });
    });

    it("treffer brukeroversiktens indeksside eksakt", () => {
        expect(finnStandardReturMål("/bruker/456", { brukerid: "456" })).toEqual({
            label: "Brukeroversikt",
            sti: "/bisys/brukeroversikt",
        });
    });

    it("treffer brukeroversiktens undersider", () => {
        expect(finnStandardReturMål("/bruker/456/reskontro", { brukerid: "456" })).toEqual({
            label: "Brukeroversikt",
            sti: "/bisys/brukeroversikt",
        });
    });

    it("returnerer null når ingen kontekst passer", () => {
        expect(finnStandardReturMål("/en/annen/side", {})).toBeNull();
    });

    it("returnerer null når stien ikke matcher noen undersider", () => {
        expect(finnStandardReturMål("/sak/123/ukjent-side", { saksnummer: "123" })).toBeNull();
    });
});
