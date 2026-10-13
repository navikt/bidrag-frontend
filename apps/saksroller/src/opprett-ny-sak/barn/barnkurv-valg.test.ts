import { describe, expect, it } from "vitest";
import type { Barnkurv, BarnMedAlder } from "../skjema/opprett-sak-schema";
import { beregnBarnkurvValg } from "./barnkurv-valg";

const barn = (ident: string, manuellLagtTil = false): BarnMedAlder => ({
    ident,
    navn: ident,
    alder: 10,
    erMyndig: false,
    manuellLagtTil,
});

const kurv = (id: string, barn: BarnMedAlder[]): Barnkurv => ({ id, barn }) as Barnkurv;

describe("beregnBarnkurvValg", () => {
    it("beholder manuelt tillagte barn når brukeren bytter kurv", () => {
        const gammeltKurvBarn = barn("11111111111");
        const manueltBarn = barn("22222222222", true);
        const nyttKurvBarn = barn("33333333333");

        const resultat = beregnBarnkurvValg(
            [kurv("gammel", [gammeltKurvBarn]), kurv("ny", [nyttKurvBarn])],
            [gammeltKurvBarn, manueltBarn],
            [nyttKurvBarn.ident],
            "ny",
        );

        expect(resultat?.valgteBarn).toEqual([manueltBarn, { ...nyttKurvBarn, manuellLagtTil: false }]);
    });
});
