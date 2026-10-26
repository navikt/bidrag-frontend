import { describe, expect, it } from "vitest";
import type { Sakstype } from "./saksregler.ts";
import { finnRolleadvarsler, lagSakRedigeringSchema, type Rolle, type SakRedigeringData } from "./sakvisning-schema.ts";

const BM = "11111111111";
const BP = "22222222222";
const BARN = "10987654321";
const BARN_2 = "10987654322";

function rolle(type: Rolle["type"], fodselsnummer: string, felter: Partial<Rolle> = {}): Rolle {
    return { fodselsnummer, type, rolleType: type, objektnummer: "", mottagerErVerge: false, ...felter };
}

function valider(sakstype: Sakstype, roller: Rolle[]) {
    const sak: SakRedigeringData = { saksnummer: "2300123", roller };
    const resultat = lagSakRedigeringSchema(sakstype).safeParse(sak);
    return resultat.error?.issues.map(({ path, message }) => ({ path, message })) ?? [];
}

describe("lagSakRedigeringSchema", () => {
    it("godtar barnebidrag med BM, BP og barn uten reell mottaker", () => {
        expect(valider("Barnebidrag", [rolle("BM", BM), rolle("BP", BP), rolle("BA", BARN)])).toEqual([]);
    });

    it("krever reell mottaker for myndig barn, men ikke når bare BM mangler", () => {
        expect(
            valider("Barnebidrag", [rolle("BM", ""), rolle("BA", BARN), rolle("BA", BARN_2, { erMyndig: true })]),
        ).toEqual([
            {
                path: ["roller", 2, "reellMottaker"],
                message: "Reell mottaker må registreres for barn over 18 år",
            },
        ]);
    });

    it("krever minst ett barn i barnebidrag uten BM", () => {
        expect(valider("Barnebidrag", [rolle("BP", BP)])).toEqual([
            { path: ["roller", "root"], message: "Du må velge minst ett barn." },
        ]);
    });

    it("avviser samme person som BP og BM, og barn som forelder", () => {
        expect(valider("Barnebidrag", [rolle("BP", BARN), rolle("BM", BARN), rolle("BA", BARN)])).toEqual([
            { path: ["roller", 0, "fodselsnummer"], message: "Et barn kan ikke være forelder i saken" },
            { path: ["roller", 1, "fodselsnummer"], message: "Et barn kan ikke være forelder i saken" },
            { path: ["roller", 1, "fodselsnummer"], message: "Samme person kan ikke være begge parter" },
        ]);
    });

    it("følger sakstypen fra saken, ikke rollene: farskap med BP, BM og flere barn gir advarsel, ikke sperre", () => {
        const roller = [rolle("BM", BM), rolle("BP", BP), rolle("BA", BARN), rolle("BA", BARN_2)];
        expect(valider("Farskap", roller)).toEqual([]);
        expect(finnRolleadvarsler(roller, "Farskap")).toEqual(["En farskapssak bør bare gjelde ett barn."]);
        expect(finnRolleadvarsler(roller, "Barnebidrag")).toEqual([]);
    });

    it("krever bidragspliktig og samhandler med ident for hvert barn i oppfostringsbidrag", () => {
        expect(
            valider("Oppfostringsbidrag", [
                rolle("BA", BARN),
                rolle("BA", BARN_2, { reellMottakerType: "samhandler" }),
            ]),
        ).toEqual([
            { path: ["roller", "root"], message: "Du må registrere bidragspliktig" },
            { path: ["roller", 0, "reellMottaker"], message: "Reell mottaker må registreres for hvert barn" },
            { path: ["roller", 1, "reellMottaker"], message: "Du må registrere reell mottaker" },
        ]);
    });
});
