import { genererFnr } from "@bidrag/common/playwright/testing/fnrGenerator.ts";
import { describe, expect, it } from "vitest";
import { type SakParter, type Sakstype, validerSak } from "./saksregler.ts";
import { finnRolleadvarsler, lagSakRedigeringSchema, type Rolle, type SakRedigeringData } from "./sakvisning-schema.ts";

const BM = genererFnr();
const BP = genererFnr();
const BARN = genererFnr();
const BARN_2 = genererFnr();
const SAMHANDLER_FNR_IDENT = genererFnr();

function rolle(type: Rolle["type"], fodselsnummer: string, felter: Partial<Rolle> = {}): Rolle {
    return { fodselsnummer, type, rolleType: type, objektnummer: "", mottagerErVerge: false, ...felter };
}

function valider(sakstype: Sakstype, roller: Rolle[], opprinneligeRoller: Rolle[] = []) {
    const sak: SakRedigeringData = { saksnummer: "2300123", roller };
    const resultat = lagSakRedigeringSchema(sakstype, opprinneligeRoller).safeParse(sak);
    return resultat.error?.issues.map(({ path, message }) => ({ path, message })) ?? [];
}

function forventFeilForBarn(feil: ReturnType<typeof valider>, indeks: number) {
    expect(feil).toEqual(
        expect.arrayContaining([
            expect.objectContaining({
                path: ["roller", indeks, "reellMottaker"],
                message: expect.stringMatching(/\S/),
            }),
        ]),
    );
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

    it("godtar samhandler og avviser person eller ukjent mottakertype i oppfostringsbidrag", () => {
        const base = [rolle("BP", BP)];
        const samhandler = rolle("BA", BARN, {
            reellMottakerType: "samhandler",
            reellMottaker: SAMHANDLER_FNR_IDENT,
            reellMottakerEntitetstype: "SAMHANDLER",
        });
        const person = rolle("BA", BARN, {
            reellMottakerType: "samhandler",
            reellMottaker: SAMHANDLER_FNR_IDENT,
            reellMottakerEntitetstype: "PERSON",
        });
        const ukjent = rolle("BA", BARN, { reellMottakerType: "samhandler", reellMottaker: SAMHANDLER_FNR_IDENT });

        expect(valider("Oppfostringsbidrag", [...base, samhandler])).toEqual([]);
        forventFeilForBarn(valider("Oppfostringsbidrag", [...base, person]), 1);
        forventFeilForBarn(valider("Oppfostringsbidrag", [...base, ukjent]), 1);
    });

    it("lar uendrede lagrede mottakere med ukjent type passere ved andre endringer", () => {
        const opprinneligBarn = rolle("BA", BARN, {
            reellMottakerType: "samhandler",
            reellMottaker: "legacy-id",
        });
        const oppdatertBarn = { ...opprinneligBarn, reellMottakerNavn: "Hentet samhandlernavn" };

        expect(
            valider(
                "Oppfostringsbidrag",
                [rolle("BP", BP, { navn: "Oppdatert bidragspliktig" }), oppdatertBarn],
                [rolle("BP", BP), opprinneligBarn],
            ),
        ).toEqual([]);
    });

    it("bruker ikke legacy-unntaket ved opprettelse selv om markøren er satt", () => {
        const parter: SakParter = {
            bp: BP,
            bidragsmottakerErUkjent: false,
            barn: [
                {
                    ident: BARN,
                    erMyndig: false,
                    reellMottakerType: "samhandler",
                    reellMottaker: "legacy-id",
                    reellMottakerErUendret: true,
                },
            ],
        };

        expect(validerSak(parter, "Oppfostringsbidrag", "opprett")).toContainEqual({
            gjelder: "barn",
            indeks: 0,
            felt: "reellMottakerEntitetstype",
            melding: "Reell mottaker må være en registrert samhandler",
        });
    });

    it("avviser endret mottakerident på et lagret barn som fortsatt mangler entitetstype", () => {
        const opprinneligBarn = rolle("BA", BARN, {
            reellMottakerType: "samhandler",
            reellMottaker: "legacy-id",
        });
        const endretBarn = { ...opprinneligBarn, reellMottaker: "ny-ident" };

        forventFeilForBarn(
            valider("Oppfostringsbidrag", [rolle("BP", BP), endretBarn], [rolle("BP", BP), opprinneligBarn]),
            1,
        );
    });

    it("matcher lagret barn på fødselsnummer når rekkefølgen endres", () => {
        const opprinneligBarn = rolle("BA", BARN, {
            reellMottakerType: "samhandler",
            reellMottaker: "legacy-id",
        });
        const opprinneligBarnTo = rolle("BA", BARN_2, {
            reellMottakerType: "samhandler",
            reellMottaker: "annen-legacy-id",
        });

        expect(
            valider(
                "Oppfostringsbidrag",
                [rolle("BP", BP), opprinneligBarnTo, opprinneligBarn],
                [opprinneligBarn, rolle("BP", BP), opprinneligBarnTo],
            ),
        ).toEqual([]);
    });

    it("krever mottakertype når vergeinformasjonen på lagret barn endres", () => {
        const opprinneligBarn = rolle("BA", BARN, {
            reellMottakerType: "samhandler",
            reellMottaker: "legacy-id",
            reellMottakerErVerge: true,
        });
        const endretBarn = { ...opprinneligBarn, reellMottakerErVerge: false };

        forventFeilForBarn(
            valider("Oppfostringsbidrag", [rolle("BP", BP), endretBarn], [rolle("BP", BP), opprinneligBarn]),
            1,
        );
    });

    it("krever samhandler-type for ny mottaker selv når en annen lagret mottaker har samme ident", () => {
        const lagretBarn = rolle("BA", BARN, {
            reellMottakerType: "samhandler",
            reellMottaker: "legacy-id",
        });
        const nyttBarn = rolle("BA", BARN_2, {
            reellMottakerType: "samhandler",
            reellMottaker: "legacy-id",
        });

        forventFeilForBarn(
            valider("Oppfostringsbidrag", [rolle("BP", BP), lagretBarn, nyttBarn], [rolle("BP", BP), lagretBarn]),
            2,
        );
    });

    it("godtar at ukjent lagret mottakertype blir bekreftet som samhandler", () => {
        const opprinneligBarn = rolle("BA", BARN, {
            reellMottakerType: "samhandler",
            reellMottaker: "legacy-id",
        });
        const bekreftetBarn = { ...opprinneligBarn, reellMottakerEntitetstype: "SAMHANDLER" as const };

        expect(
            valider("Oppfostringsbidrag", [rolle("BP", BP), bekreftetBarn], [rolle("BP", BP), opprinneligBarn]),
        ).toEqual([]);
    });

    it("krever mottakertype selv om samme lagrede mottaker nå er bekreftet som person", () => {
        const opprinneligBarn = rolle("BA", BARN, {
            reellMottakerType: "samhandler",
            reellMottaker: "legacy-id",
        });
        const personBekreftetBarn = { ...opprinneligBarn, reellMottakerEntitetstype: "PERSON" as const };

        forventFeilForBarn(
            valider("Oppfostringsbidrag", [rolle("BP", BP), personBekreftetBarn], [rolle("BP", BP), opprinneligBarn]),
            1,
        );
    });
});
