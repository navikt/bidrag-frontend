import { HendelseType } from "@bidrag/api/SakApi";
import { describe, expect, it } from "vitest";
import { hendelseTekst } from "./hendelseTekst";

describe("hendelseTekst", () => {
    it("viser tydeligere tekst for hendelsestyper med uklar tekst fra Bisys", () => {
        expect(hendelseTekst({ type: HendelseType.GJELDER_ENDRET, typeBeskrivelse: "Gjelder endret" })).toBe(
            "Landtilknytning endret",
        );
        expect(hendelseTekst({ type: HendelseType.G4, typeBeskrivelse: "G4" })).toBe("Avsluttet – G4-land");
    });

    it("viser teksten fra backend for andre hendelsestyper", () => {
        expect(hendelseTekst({ type: HendelseType.VEDTAK, typeBeskrivelse: "Vedtak" })).toBe("Vedtak");
    });
});
