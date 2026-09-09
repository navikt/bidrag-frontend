import { TilgangsFeilError } from "@bidrag/api";
import type { BidragssakDto, RolleDto } from "@bidrag/api/SakApi";
import { Arbeidsfordeling, Rolletype } from "@bidrag/api/SakApi";
import { describe, expect, it } from "vitest";
import { beregnEksisterendeSakSjekk } from "./useEksisterendeSakSjekk.ts";

const bidragspliktigIdent = "11111111111";
const bidragsmottakerIdent = "22222222222";
const barnIdent = "33333333333";

function lagRolle(ident: string, type: Rolletype): RolleDto {
    return { fodselsnummer: ident, type, mottagerErVerge: false, rolleType: type, rollehistorikk: [] };
}

function lagSak(saksnummer: string, roller: RolleDto[]): BidragssakDto {
    return {
        eierfogd: "4806",
        saksnummer,
        saksstatus: "AK",
        kategori: "N",
        begrensetTilgang: false,
        opprettetDato: "2024-01-01",
        levdeAdskilt: false,
        ukjentPart: false,
        vedtakssperre: false,
        avsluttet: false,
        arbeidsfordeling: Arbeidsfordeling.EEN,
        roller,
    };
}

const partISaken = { ident: bidragspliktigIdent, navn: "Test Bidragspliktig", erKjent: true, rolle: "bidragspliktig" };
const motpart = { ident: bidragsmottakerIdent, navn: "Test Bidragsmottaker", erKjent: true, rolle: "bidragsmottaker" };

describe("beregnEksisterendeSakSjekk", () => {
    it("returnerer ingen treff når skalHente er false, selv om det finnes en cachet feil", () => {
        const resultat = beregnEksisterendeSakSjekk({
            partISaken,
            motpart,
            skalHente: false,
            isLoading: false,
            error: new Error("gammel feil fra forrige query-key"),
            sakForPartISaken: undefined,
        });

        expect(resultat).toEqual({ harEksisterendeSak: false, eksisterendeSak: null, infoMelding: null });
    });

    it("viser TilgangsFeilError-melding som type error", () => {
        const resultat = beregnEksisterendeSakSjekk({
            partISaken,
            motpart,
            skalHente: true,
            isLoading: false,
            error: new TilgangsFeilError("Ingen tilgang til person"),
            sakForPartISaken: undefined,
        });

        expect(resultat.harEksisterendeSak).toBe(false);
        expect(resultat.infoMelding).toEqual({ type: "error", melding: "Ingen tilgang til person" });
    });

    it("viser generisk feilmelding som type warning for andre feil", () => {
        const resultat = beregnEksisterendeSakSjekk({
            partISaken,
            motpart,
            skalHente: true,
            isLoading: false,
            error: new Error("nettverksfeil"),
            sakForPartISaken: undefined,
        });

        expect(resultat.infoMelding).toEqual({
            type: "warning",
            melding: "Feil ved henting av eksisterende sak. Kontakt support.",
        });
    });

    it("returnerer ingen treff mens data lastes", () => {
        const resultat = beregnEksisterendeSakSjekk({
            partISaken,
            motpart,
            skalHente: true,
            isLoading: true,
            error: null,
            sakForPartISaken: undefined,
        });

        expect(resultat).toEqual({ harEksisterendeSak: false, eksisterendeSak: null, infoMelding: null });
    });

    it("viser infomelding når personen ikke har noen saker", () => {
        const resultat = beregnEksisterendeSakSjekk({
            partISaken,
            motpart,
            skalHente: true,
            isLoading: false,
            error: null,
            sakForPartISaken: [],
        });

        expect(resultat.harEksisterendeSak).toBe(false);
        expect(resultat.infoMelding?.type).toBe("info");
        expect(resultat.infoMelding?.melding).toContain(partISaken.navn);
    });

    it("finner eksisterende sak med begge parter og barn (barnebidrag)", () => {
        const sak = lagSak("100001", [
            lagRolle(bidragspliktigIdent, Rolletype.BP),
            lagRolle(bidragsmottakerIdent, Rolletype.BM),
            lagRolle(barnIdent, Rolletype.BA),
        ]);

        const resultat = beregnEksisterendeSakSjekk({
            partISaken,
            motpart,
            skalHente: true,
            isLoading: false,
            error: null,
            sakForPartISaken: [sak],
        });

        expect(resultat).toEqual({ harEksisterendeSak: true, eksisterendeSak: sak, infoMelding: null });
    });

    it("krever IKKE barn for ektefellebidrag, og avviser saker med barn", () => {
        const sakUtenBarn = lagSak("100002", [
            lagRolle(bidragspliktigIdent, Rolletype.BP),
            lagRolle(bidragsmottakerIdent, Rolletype.BM),
        ]);
        const sakMedBarn = lagSak("100003", [
            lagRolle(bidragspliktigIdent, Rolletype.BP),
            lagRolle(bidragsmottakerIdent, Rolletype.BM),
            lagRolle(barnIdent, Rolletype.BA),
        ]);

        const resultat = beregnEksisterendeSakSjekk({
            partISaken,
            motpart,
            erEktefellebidrag: true,
            skalHente: true,
            isLoading: false,
            error: null,
            sakForPartISaken: [sakMedBarn, sakUtenBarn],
        });

        expect(resultat.harEksisterendeSak).toBe(true);
        expect(resultat.eksisterendeSak?.saksnummer).toBe("100002");
    });

    it("viser info når ingen sak matcher begge roller med samme motpart", () => {
        const sak = lagSak("100004", [
            lagRolle(bidragspliktigIdent, Rolletype.BP),
            lagRolle("99999999999", Rolletype.BM),
        ]);

        const resultat = beregnEksisterendeSakSjekk({
            partISaken,
            motpart,
            skalHente: true,
            isLoading: false,
            error: null,
            sakForPartISaken: [sak],
        });

        expect(resultat.harEksisterendeSak).toBe(false);
        expect(resultat.infoMelding).toEqual({
            type: "info",
            melding: "Ingen sak funnet mellom disse to partene med samme roller. Du kan opprette en ny sak.",
        });
    });

    it("varsler om sak(er) med ukjent motpart når motpart.erKjent er false", () => {
        const sakUtenMotpart = lagSak("100005", [lagRolle(bidragspliktigIdent, Rolletype.BP)]);
        const ukjentMotpart = { ...motpart, erKjent: false };

        const resultat = beregnEksisterendeSakSjekk({
            partISaken,
            motpart: ukjentMotpart,
            skalHente: true,
            isLoading: false,
            error: null,
            sakForPartISaken: [sakUtenMotpart],
        });

        expect(resultat.harEksisterendeSak).toBe(false);
        expect(resultat.infoMelding?.type).toBe("warning");
        expect(resultat.infoMelding?.melding).toContain("sak 100005");
    });

    it("slår sammen flere saksnumre i meldingen når flere saker har ukjent motpart", () => {
        const sak1 = lagSak("100006", [lagRolle(bidragspliktigIdent, Rolletype.BP)]);
        const sak2 = lagSak("100007", [lagRolle(bidragspliktigIdent, Rolletype.BP)]);
        const ukjentMotpart = { ...motpart, erKjent: false };

        const resultat = beregnEksisterendeSakSjekk({
            partISaken,
            motpart: ukjentMotpart,
            skalHente: true,
            isLoading: false,
            error: null,
            sakForPartISaken: [sak1, sak2],
        });

        expect(resultat.infoMelding?.melding).toContain("sakene 100006, 100007");
    });

    it("gir ingen treff når motpart er ukjent, men alle saker allerede har en motpart registrert", () => {
        const sakMedMotpart = lagSak("100008", [
            lagRolle(bidragspliktigIdent, Rolletype.BP),
            lagRolle(bidragsmottakerIdent, Rolletype.BM),
        ]);
        const ukjentMotpart = { ...motpart, erKjent: false };

        const resultat = beregnEksisterendeSakSjekk({
            partISaken,
            motpart: ukjentMotpart,
            skalHente: true,
            isLoading: false,
            error: null,
            sakForPartISaken: [sakMedMotpart],
        });

        expect(resultat).toEqual({ harEksisterendeSak: false, eksisterendeSak: null, infoMelding: null });
    });
});
