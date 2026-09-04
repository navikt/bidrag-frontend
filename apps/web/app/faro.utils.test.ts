import { describe, expect, it } from "vitest";

import { maskPathnameForPageId } from "./faro.utils.ts";

describe("maskPathnameForPageId", () => {
    it("maskerer route-parameter for sak og journal", () => {
        expect(maskPathnameForPageId("/sak/1234567/journal/987654321")).toBe("/sak/:saksnummer/journal/:journalpostId");
    });

    it("maskerer route-parameter for dokument med dokumentreferanse", () => {
        expect(maskPathnameForPageId("/dokument/123456789/ABC123")).toBe("/dokument/:journalpostId/:dokumentreferanse");
    });

    it("maskerer bruker-reskontro med generisk id ", () => {
        expect(maskPathnameForPageId("/bruker/iN68zIOuP/reskontro")).toBe("/bruker/:id/reskontro");
    });
    it("maskerer bruker-sumprsak med generisk id ", () => {
        expect(maskPathnameForPageId("/bruker/gXB1FPhMp/sumprsak")).toBe("/bruker/:id/sumprsak");
    });

    it("maskerer bruker-reskontro med generisk id når segmentet er numerisk", () => {
        expect(maskPathnameForPageId("/bruker/42/reskontro")).toBe("/bruker/:id/reskontro");
    });

    it("bruker fallback for uuid, fnr, saksnummer og numerisk id i path-segmenter", () => {
        expect(maskPathnameForPageId("/x/550e8400-e29b-41d4-a716-446655440000/12345678901/7654321/42")).toBe(
            "/x/:uuid/:fnr/:saksnummer/:id",
        );
    });

    it("bevarer segmenter som ikke matcher fallback-regexp", () => {
        expect(maskPathnameForPageId("/x/abc123/123abc")).toBe("/x/abc123/123abc");
    });

    it("maskerer samhandler-id, men ikke den statiske søk-ruten", () => {
        expect(maskPathnameForPageId("/samhandler/889123456")).toBe("/samhandler/:samhandlerId");
        expect(maskPathnameForPageId("/samhandler/søk")).toBe("/samhandler/søk");
    });

    it("maskerer forsendelse-id, men ikke den statiske brukerveiledning-ruten", () => {
        expect(maskPathnameForPageId("/forsendelse/aB3xQ9")).toBe("/forsendelse/:forsendelseId");
        expect(maskPathnameForPageId("/forsendelse/brukerveiledning")).toBe("/forsendelse/brukerveiledning");
    });

    it("maskerer journalpost under sak (tidligere udekket av journal-regelen)", () => {
        expect(maskPathnameForPageId("/sak/1234567/journalpost/987654321")).toBe(
            "/sak/:saksnummer/journalpost/:journalpostId",
        );
    });

    it("maskerer rediger/masker med forsendelseId og dokumentreferanse", () => {
        expect(maskPathnameForPageId("/rediger/masker/aB3xQ9/ABC123")).toBe(
            "/rediger/masker/:forsendelseId/:dokumentreferanse",
        );
    });

    it("maskerer sammensatt behandling-begrunnelse-rute under sak", () => {
        expect(maskPathnameForPageId("/sak/1234567/behandling/42/begrunnelse/mainWindow")).toBe(
            "/sak/:saksnummer/behandling/:behandlingId/begrunnelse/:broadcastChannel",
        );
    });

    it("maskerer topnivå behandling-notat", () => {
        expect(maskPathnameForPageId("/behandling/42/notat")).toBe("/behandling/:behandlingId/notat");
    });
});
