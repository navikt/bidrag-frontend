import { HendelseType, type SakshendelseDto } from "@bidrag/api/SakApi";
import { describe, expect, it } from "vitest";
import { filtrerFeilregistrerteHendelser } from "./feilregistrerteHendelser";

const hendelse = (hendelseId: string, overrides: Partial<SakshendelseDto> = {}) =>
    ({ hendelseId, type: HendelseType.SOKNADBM, ...overrides }) as SakshendelseDto;

const ider = (hendelser: SakshendelseDto[]) => hendelser.map((h) => h.hendelseId);

describe("filtrerFeilregistrerteHendelser", () => {
    const hendelser = [
        hendelse("soknad-a", { søknadsid: "A" }),
        hendelse("vedtak-a", { søknadsid: "A", type: HendelseType.VEDTAK }),
        hendelse("feil-a", { søknadsid: "A", type: HendelseType.FEILREGISTRERT }),
        hendelse("soknad-b", { søknadsid: "B" }),
        hendelse("uten-soknad"),
        hendelse("feil-uten-soknad", { type: HendelseType.FEILREGISTRERT }),
    ];

    it("skjuler feilregistrerte hendelser og andre hendelser med samme søknadsid", () => {
        expect(ider(filtrerFeilregistrerteHendelser(hendelser, false))).toEqual(["soknad-b", "uten-soknad"]);
    });

    it("skjuler ikke hendelser uten søknadsid selv om en feilregistrert hendelse mangler søknadsid", () => {
        const resultat = filtrerFeilregistrerteHendelser(
            [
                hendelse("uten-soknad"),
                hendelse("tom-soknad", { søknadsid: "" }),
                hendelse("feil", { type: HendelseType.FEILREGISTRERT, søknadsid: "" }),
            ],
            false,
        );
        expect(ider(resultat)).toEqual(["uten-soknad", "tom-soknad"]);
    });

    it("returnerer alle hendelser når feilregistrerte skal vises", () => {
        expect(ider(filtrerFeilregistrerteHendelser(hendelser, true))).toEqual(ider(hendelser));
    });
});
