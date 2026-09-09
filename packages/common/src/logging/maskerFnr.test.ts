import { describe, expect, it } from "vitest";
import { erFodselsnummer, maskerFnr, maskerFnrITekst, maskerVerdi } from "./maskerFnr.ts";

/**
 * Testdata genereres, ikke kopieres. Ingen fnr-liknende litteraler fra virkelige data
 * skal ligge i repoet, heller ikke i tester.
 */

const VEKTER_K1 = [3, 7, 6, 1, 8, 9, 4, 5, 2];
const VEKTER_K2 = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

function kontrollsiffer(sifre: number[], vekter: number[]): number | null {
    const sum = vekter.reduce((akk, vekt, i) => akk + vekt * (sifre[i] ?? 0), 0);
    const rest = sum % 11;
    if (rest === 0) return 0;
    const siffer = 11 - rest;
    return siffer === 10 ? null : siffer;
}

/**
 * Lager et syntetisk fødselsnummer med gyldige kontrollsiffer.
 * Prøver seg fram på individnummer til kontrollsifrene går opp.
 */
function lagFnr(dag: number, måned: number, år: number): string {
    for (let individ = 0; individ < 1000; individ++) {
        const base = [
            ...String(dag).padStart(2, "0"),
            ...String(måned).padStart(2, "0"),
            ...String(år).padStart(2, "0"),
            ...String(individ).padStart(3, "0"),
        ].map(Number);

        const k1 = kontrollsiffer(base, VEKTER_K1);
        if (k1 === null) continue;
        const k2 = kontrollsiffer([...base, k1], VEKTER_K2);
        if (k2 === null) continue;

        return [...base, k1, k2].join("");
    }
    throw new Error("Klarte ikke lage syntetisk fnr");
}

/**
 * 11 siffer med gyldige mod-11-kontrollsiffer, men ugyldig dato.
 * Representerer kontonummer og andre mod-11-baserte identifikatorer.
 */
function lagIkkeFnrMedGyldigMod11(): string {
    // Måned 88 er aldri gyldig, heller ikke som NPID (41–52).
    for (let individ = 0; individ < 1000; individ++) {
        const base = [...`8888${String(individ).padStart(5, "0")}`.slice(0, 9)].map(Number);
        const k1 = kontrollsiffer(base, VEKTER_K1);
        if (k1 === null) continue;
        const k2 = kontrollsiffer([...base, k1], VEKTER_K2);
        if (k2 === null) continue;
        return [...base, k1, k2].join("");
    }
    throw new Error("Klarte ikke lage testdata");
}

const FNR = lagFnr(15, 6, 85);
const DNUMMER = lagFnr(55, 6, 85); // dag + 40
const NPID = lagFnr(15, 46, 85); // måned + 40
const IKKE_FNR = lagIkkeFnrMedGyldigMod11();

describe("erFodselsnummer", () => {
    it("godtar et gyldig fødselsnummer", () => {
        expect(erFodselsnummer(FNR)).toBe(true);
    });

    it("godtar D-nummer, der dag er lagt til 40", () => {
        expect(erFodselsnummer(DNUMMER)).toBe(true);
    });

    it("godtar NPID, der måned er lagt til 40", () => {
        expect(erFodselsnummer(NPID)).toBe(true);
    });

    it("avviser 11 siffer med gyldig mod-11 men ugyldig dato", () => {
        // Kontonummer bruker også mod-11. Uten datosjekk maskerer vi bankkontoer
        // og ødelegger feilsøking av betalingsflyten.
        expect(erFodselsnummer(IKKE_FNR)).toBe(false);
    });

    it("avviser et 11-sifret tidsstempel", () => {
        expect(erFodselsnummer("17257824000")).toBe(false);
    });

    it("avviser når kontrollsifrene ikke stemmer", () => {
        const ugyldig = FNR.slice(0, 10) + ((Number(FNR[10]) + 1) % 10);
        expect(erFodselsnummer(ugyldig)).toBe(false);
    });

    it("avviser dag 0 og måned 0", () => {
        expect(erFodselsnummer("00000000000")).toBe(false);
    });
});

describe("maskerVerdi", () => {
    it("beholder de to første tegnene", () => {
        expect(maskerVerdi("12345678901")).toBe("12*********");
    });

    it("maskerer helt når verdien er for kort til å skjules delvis", () => {
        expect(maskerVerdi("12")).toBe("**");
        expect(maskerVerdi("1")).toBe("*");
    });
});

describe("maskerFnrITekst", () => {
    it("maskerer fødselsnummer i fritekst", () => {
        const { verdi, antall } = maskerFnrITekst(`Fant ikke person ${FNR}`);

        expect(verdi).not.toContain(FNR);
        expect(verdi).toBe(`Fant ikke person ${FNR.slice(0, 2)}*********`);
        expect(antall).toBe(1);
    });

    it("maskerer flere treff i samme streng", () => {
        const { antall } = maskerFnrITekst(`${FNR} og ${DNUMMER}`);
        expect(antall).toBe(2);
    });

    it("maskerer fødselsnummer skrevet som 6 mellomrom 5", () => {
        const delt = `${FNR.slice(0, 6)} ${FNR.slice(6)}`;
        const { verdi, antall } = maskerFnrITekst(`Ident: ${delt}`);

        expect(antall).toBe(1);
        expect(verdi).not.toContain(delt);
    });

    it("lar tekst uten sifre være urørt", () => {
        const tekst = "Ingenting å se her";
        expect(maskerFnrITekst(tekst)).toEqual({ verdi: tekst, antall: 0 });
    });

    it("lar kontonummer være urørt", () => {
        const tekst = `Konto ${IKKE_FNR}`;
        expect(maskerFnrITekst(tekst)).toEqual({ verdi: tekst, antall: 0 });
    });
});

describe("maskerFnr", () => {
    it("maskerer fødselsnummer i en verdi", () => {
        const { verdi, antall } = maskerFnr({ melding: `Person ${FNR}` });

        expect(verdi.melding).not.toContain(FNR);
        expect(antall).toBe(1);
    });

    it("maskerer på grunn av nøkkelen selv når verdien er ugyldig", () => {
        // Et trunkert fnr er fortsatt personopplysning.
        const { verdi, antall } = maskerFnr({ fnr: "123456", annet: "123456" });

        expect(verdi.fnr).toBe("12****");
        expect(verdi.annet).toBe("123456");
        expect(antall).toBe(1);
    });

    it("maskerer nøkler som ident og fødselsnummer", () => {
        const { verdi } = maskerFnr({ barnIdent: "abcdef", fodselsnummer: "abcdef" });

        expect(verdi.barnIdent).toBe("ab****");
        expect(verdi.fodselsnummer).toBe("ab****");
    });

    it("maskerer fnr i en sti selv om nøkkelen ikke er sensitiv", () => {
        // Proxyen logger `path: subPath`. Nøkkelen `path` matcher ikke nøkkelmønsteret,
        // så dette fanges kun av verdibasert deteksjon.
        const { verdi, antall } = maskerFnr({ path: `/person/${FNR}` });

        expect(verdi.path).not.toContain(FNR);
        expect(antall).toBe(1);
    });

    it("maskerer i nøstede objekt", () => {
        const { verdi, antall } = maskerFnr({ a: { b: { c: { d: `x ${FNR}` } } } });

        expect(verdi.a.b.c.d).not.toContain(FNR);
        expect(antall).toBe(1);
    });

    it("maskerer i arrays", () => {
        const { verdi, antall } = maskerFnr({ identer: [FNR, DNUMMER] });

        expect(verdi.identer.join()).not.toContain(FNR);
        expect(antall).toBe(2);
    });

    it("maskerer et fødselsnummer som er lagret som tall", () => {
        const { verdi, antall } = maskerFnr({ ident: Number(FNR) });

        expect(verdi.ident).toBe(`${FNR.slice(0, 2)}*********`);
        expect(antall).toBe(1);
    });

    it("returnerer samme referanse når ingenting maskeres", () => {
        const original = { app: "bidrag-sak", status: 200 };
        const { verdi, antall } = maskerFnr(original);

        expect(verdi).toBe(original);
        expect(antall).toBe(0);
    });

    it("beholder Error som Error og maskerer melding og stacktrace", () => {
        const feil = new Error(`Fant ikke ${FNR}`);
        feil.stack = `Error: ${FNR}\n    at /person/${FNR}:1:1`;

        const { verdi, antall } = maskerFnr({ err: feil });

        expect(verdi.err).toBeInstanceOf(Error);
        expect(verdi.err.message).not.toContain(FNR);
        expect(verdi.err.stack).not.toContain(FNR);
        expect(antall).toBeGreaterThan(0);
    });

    it("maskerer cause på en Error", () => {
        const feil = new Error("Ytre", { cause: `Indre ${FNR}` });
        const { verdi } = maskerFnr({ err: feil });

        expect(String((verdi.err as Error).cause)).not.toContain(FNR);
    });

    it("terminerer på sykliske objekt", () => {
        const syklisk: Record<string, unknown> = { navn: `x ${FNR}` };
        syklisk.selv = syklisk;

        expect(() => maskerFnr(syklisk)).not.toThrow();
    });

    it("terminerer på objekt som er dypere enn dybdegrensen", () => {
        let dypt: Record<string, unknown> = { fnr: FNR };
        for (let i = 0; i < 50; i++) {
            dypt = { nivå: dypt };
        }

        expect(() => maskerFnr(dypt)).not.toThrow();
    });

    it("terminerer innenfor nodebudsjettet på store objekt", () => {
        const stort = Object.fromEntries(Array.from({ length: 5_000 }, (_, i) => [`n${i}`, `verdi ${i}`]));

        expect(() => maskerFnr(stort)).not.toThrow();
    });

    it("serialiserer ikke objekt med toJSON", () => {
        // AxiosError.toJSON() tar med config.data og Authorization-headeren.
        // Traverseringen skal aldri kalle den.
        const felle = {
            toJSON() {
                throw new Error("toJSON skal ikke kalles");
            },
            trygt: "ok",
        };

        expect(() => maskerFnr({ felle })).not.toThrow();
    });

    it("håndterer null, undefined og primitiver", () => {
        expect(maskerFnr(null).verdi).toBeNull();
        expect(maskerFnr(undefined).verdi).toBeUndefined();
        expect(maskerFnr(true).verdi).toBe(true);
    });

    it("maskerer en streng sendt direkte inn", () => {
        const { verdi, antall } = maskerFnr(`Person ${FNR}`);

        expect(verdi).not.toContain(FNR);
        expect(antall).toBe(1);
    });
});
