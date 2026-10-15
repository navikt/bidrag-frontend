import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BidragLenke } from "./useBidragLenker.ts";

const mocks = vi.hoisted(() => ({
    flagg: {} as Record<string, boolean>,
    søkeparametre: "",
    rotdata: { bisysUrl: "https://bisys.example/context/" } as { bisysUrl: string } | undefined,
    lagring: {} as Record<string, string>,
}));

vi.mock("@unleash/proxy-client-react", () => ({
    useFlag: (flagg: string) => mocks.flagg[flagg] ?? false,
}));

vi.mock("react-router", async (importOriginal) => ({
    ...(await importOriginal<typeof import("react-router")>()),
    useRouteLoaderData: () => mocks.rotdata,
    useSearchParams: () => [new URLSearchParams(mocks.søkeparametre)],
}));

import { useBidragLenker } from "./useBidragLenker.ts";

function byggLenke(mål: keyof ReturnType<typeof useBidragLenker>, identifikator: string): BidragLenke | undefined {
    let resultat: BidragLenke | undefined;
    function Lenkeutdata() {
        resultat = useBidragLenker()[mål](identifikator);
        return createElement("output", null, resultat?.href);
    }
    renderToStaticMarkup(createElement(Lenkeutdata));
    return resultat;
}

describe("Bygging av bidragslenker", () => {
    beforeEach(() => {
        mocks.flagg = {};
        mocks.søkeparametre = "";
        mocks.rotdata = { bisysUrl: "https://bisys.example/context/" };
        mocks.lagring = {};
        vi.stubGlobal("window", {
            sessionStorage: { getItem: (key: string) => mocks.lagring[key] ?? null },
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("bygger standard Bisys-lenke for sak og beholder ekstra søkeparametere uten returkontekst", () => {
        mocks.søkeparametre =
            "?ident=gammel-person&saksnr=gammel-sak&from=behandling&returSaksnr=gammel-sak&ekstra=en&ekstra=to";
        expect(byggLenke("sakLenke", "1234567")).toEqual({
            href: "https://bisys.example/context/Sak.do?ekstra=en&ekstra=to&saksnr=1234567",
            ekstern: true,
        });
    });

    it("bygger standard Bisys-lenke for obfuskert person og beholder tom query-verdi", () => {
        mocks.søkeparametre = "?saksnr=gammel-sak&ident=gammel-person&tom=";
        expect(byggLenke("brukerLenke", "obfuskert-person")).toEqual({
            href: "https://bisys.example/context/Brukeroversikt.do?ident=obfuskert-person",
            ekstern: true,
        });
    });

    it("prioriterer sessionState fra URL og fyller ut manglende enhet", () => {
        mocks.søkeparametre = "?sessionState=url-tilstand";
        mocks.lagring = { "bisys.sessionState": "lagret-tilstand", "bisys.enhet": "4806" };
        expect(byggLenke("sakLenke", "1234567")).toEqual({
            href: "https://bisys.example/context/Sak.do?sessionState=url-tilstand&saksnr=1234567&enhet=4806",
            ekstern: true,
        });
    });

    it("bygger brukerlenke med sessionState og ident, uten andre parametere", () => {
        mocks.søkeparametre = "?sessionState=url-tilstand&enhet=4806&from=behandling&returSaksnr=1234567";
        mocks.lagring = { "bisys.sessionState": "lagret-tilstand", "bisys.enhet": "4806" };
        expect(byggLenke("brukerLenke", "obfuskert-person")).toEqual({
            href: "https://bisys.example/context/Brukeroversikt.do?sessionState=url-tilstand&ident=obfuskert-person",
            ekstern: true,
        });
    });

    it("beholder context-stien når Bisys-URL mangler avsluttende skråstrek", () => {
        mocks.rotdata = { bisysUrl: "https://wasapp-q2.adeo.no/rtv-bidrag" };
        mocks.søkeparametre = "?sessionState=test-session";

        expect(byggLenke("brukerLenke", "cEDJV7LI0")).toEqual({
            href: "https://wasapp-q2.adeo.no/rtv-bidrag/Brukeroversikt.do?sessionState=test-session&ident=cEDJV7LI0",
            ekstern: true,
        });
    });

    it("bygger intern lenke for sak når nytt saksflagg er aktivert", () => {
        mocks.flagg = { "bisys.ny_sakside": true };
        expect(byggLenke("sakLenke", "1234567")).toEqual({
            href: "/sak/1234567",
            ekstern: false,
        });
    });

    it("bygger intern lenke for obfuskert person når nytt brukerflagg er aktivert", () => {
        mocks.flagg = { "bisys.ny_brukeroversikt": true };
        expect(byggLenke("brukerLenke", "obfuskert-person")).toEqual({
            href: "/bruker/obfuskert-person",
            ekstern: false,
        });
    });

    it("bygger tvunget Bisys-lenke for sak og prioriterer URL-sessionState", () => {
        mocks.flagg = { "bisys.ny_sakside": true, "bisys.ny_brukeroversikt": true };
        mocks.søkeparametre = "?ident=gammel-person&saksnr=gammel-sak&sessionState=url-tilstand&ekstra=en";
        mocks.lagring = { "bisys.sessionState": "lagret-tilstand", "bisys.enhet": "4806" };
        expect(byggLenke("bisysSakLenke", "1234567")).toEqual({
            href: "https://bisys.example/context/Sak.do?sessionState=url-tilstand&ekstra=en&saksnr=1234567&enhet=4806",
            ekstern: true,
        });
    });

    it("bygger tvunget Bisys-lenke for obfuskert person med bare sessionState og ident", () => {
        mocks.flagg = { "bisys.ny_sakside": true, "bisys.ny_brukeroversikt": true };
        mocks.søkeparametre = "?ident=gammel-person&saksnr=gammel-sak&from=behandling";
        mocks.lagring = { "bisys.sessionState": "lagret-tilstand", "bisys.enhet": "4806" };
        expect(byggLenke("bisysBrukerLenke", "obfuskert-person")).toEqual({
            href: "https://bisys.example/context/Brukeroversikt.do?sessionState=lagret-tilstand&ident=obfuskert-person",
            ekstern: true,
        });
    });

    it("returnerer ingen Bisys-lenke når rotens loader-data mangler", () => {
        mocks.rotdata = undefined;
        expect(byggLenke("sakLenke", "1234567")).toBeUndefined();
    });

    it("bygger lenke under SSR uten window", () => {
        vi.stubGlobal("window", undefined);
        mocks.søkeparametre = "?sessionState=url-tilstand&enhet=4806";
        expect(byggLenke("sakLenke", "1234567")).toEqual({
            href: "https://bisys.example/context/Sak.do?sessionState=url-tilstand&enhet=4806&saksnr=1234567",
            ekstern: true,
        });
    });
});
