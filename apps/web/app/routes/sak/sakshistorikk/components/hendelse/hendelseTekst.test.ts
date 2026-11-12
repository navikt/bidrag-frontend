import { HendelseType } from "@bidrag/api/SakApi";
import { describe, expect, it } from "vitest";
import { hendelseTekst, sammenlignHendelseTekst } from "./hendelseTekst";

describe("hendelseTekst", () => {
    it("viser tydeligere tekst for hendelsestyper med uklar tekst fra Bisys", () => {
        expect(hendelseTekst({ type: HendelseType.GJELDER_ENDRET, typeBeskrivelse: "Gjelder endret" }, true)).toBe(
            "Landtilknytning endret",
        );
        expect(hendelseTekst({ type: HendelseType.G4, typeBeskrivelse: "G4" }, true)).toBe(
            "Kan ikke behandles foreløpig – G4",
        );
    });

    it("viser teksten fra backend for andre hendelsestyper", () => {
        expect(hendelseTekst({ type: HendelseType.VEDTAK, typeBeskrivelse: "Vedtak" }, true)).toBe("Vedtak");
    });

    it("viser teksten fra backend når tydeligere tekster er slått av", () => {
        expect(hendelseTekst({ type: HendelseType.GJELDER_ENDRET, typeBeskrivelse: "Gjelder endret" }, false)).toBe(
            "Gjelder endret",
        );
    });

    it("sorterer på teksten som vises", () => {
        const hendelser = [
            { type: HendelseType.GJELDER_ENDRET, typeBeskrivelse: "Gjelder endret" },
            { type: HendelseType.INDEKSREGULERT, typeBeskrivelse: "Indeksregulering" },
        ];

        expect([...hendelser].sort(sammenlignHendelseTekst(true)).map((h) => h.type)).toEqual([
            HendelseType.INDEKSREGULERT,
            HendelseType.GJELDER_ENDRET,
        ]);
        expect([...hendelser].sort(sammenlignHendelseTekst(false)).map((h) => h.type)).toEqual([
            HendelseType.GJELDER_ENDRET,
            HendelseType.INDEKSREGULERT,
        ]);
    });
});
