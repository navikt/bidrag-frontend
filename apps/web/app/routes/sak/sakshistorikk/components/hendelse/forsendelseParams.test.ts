import {
    type SakshendelseDto,
    SoknadGruppeKombinasjon,
    SoktAvType,
    Stonadstype,
    Vedtakstype,
} from "@bidrag/api/SakApi";
import { describe, expect, it } from "vitest";
import { erFattetBeregnet, lagForsendelseParams } from "./forsendelseParams";

const hendelse = (overrides: Partial<SakshendelseDto> = {}) =>
    ({ søknadsid: "42", fraBbm: false, barnObjektNumre: [], ...overrides }) as SakshendelseDto;

describe("erFattetBeregnet", () => {
    it("er sann for fraBbm og for vedtak i ny løsning", () => {
        expect(erFattetBeregnet(hendelse({ fraBbm: true }))).toBe(true);
        expect(erFattetBeregnet(hendelse({ vedtaksid: "1", behandlingsid: "2" }))).toBe(true);
    });

    it("er usann ellers", () => {
        expect(erFattetBeregnet(hendelse())).toBe(false);
        expect(erFattetBeregnet(hendelse({ vedtaksid: "1" }))).toBe(false);
        expect(erFattetBeregnet(hendelse({ behandlingsid: "2" }))).toBe(false);
    });
});

describe("lagForsendelseParams", () => {
    it("tar med alle parametre", () => {
        const params = lagForsendelseParams(
            hendelse({
                vedtaksid: "7",
                behandlingsid: "8",
                stonadType: Stonadstype.BIDRAG,
                søktAv: SoktAvType.BIDRAGSMOTTAKER,
                vedtakType: Vedtakstype.FASTSETTELSE,
                barnObjektNumre: ["1", "2"],
            }),
            "42",
            "4806",
            "sess",
        );

        expect(Object.fromEntries(params)).toMatchObject({
            enhet: "4806",
            sessionState: "sess",
            soknadId: "42",
            vedtakId: "7",
            behandlingId: "8",
            stonadType: "BIDRAG",
            erFattetBeregnet: "true",
            soknadFra: "BIDRAGSMOTTAKER",
            vedtakType: "FASTSETTELSE",
        });
        expect(params.has("behandlingType")).toBe(false);
        expect(params.getAll("barn_obj_nr")).toEqual(["1", "2"]);
    });

    it("sender behandlingType for søknadsgrupper uten stønads-/engangsbeløptype", () => {
        const params = lagForsendelseParams(
            hendelse({ søknadsgruppe: SoknadGruppeKombinasjon.FARSKAP }),
            "42",
            null,
            null,
        );

        expect(params.get("behandlingType")).toBe("FARSKAP");
        expect(params.has("erFattetBeregnet")).toBe(false);
        expect(params.has("enhet")).toBe(false);
    });
});
