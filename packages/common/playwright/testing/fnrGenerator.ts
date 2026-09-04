/**
 * Genererer syntetiske, MOD11-gyldig-formaterte fødselsnummer til bruk i
 * Playwright component-testing (stories og specs). Tallene er tilfeldige og
 * har INGEN sammenheng med ekte personer - kun til testdata, slik at vi ikke
 * trenger å hardkode fnr-lignende strenger i kildekoden.
 *
 * Samme kontrollsiffer-algoritme som `bidrag-sak` (Kotlin) og
 * `bidrag-bisys` (JS) sine tilsvarende testverktøy.
 */
const K1_VEKTING = [3, 7, 6, 1, 8, 9, 4, 5, 2];
const K2_VEKTING = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

function tilfeldigInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pad2(tall: number): string {
    return tall.toString().padStart(2, "0");
}

function kontrollsiffer(siffer: number[], vekting: number[]): number {
    const sum = vekting.reduce((acc, vekt, i) => acc + vekt * (siffer[i] ?? 0), 0);
    const mod = 11 - (sum % 11);
    return mod === 11 ? 0 : mod;
}

/** Genererer et tilfeldig, gyldig-formatert fødselsnummer (11 siffer). */
export function genererFnr(): string {
    const år = tilfeldigInt(1940, 2020);
    const måned = tilfeldigInt(1, 12);
    const dag = tilfeldigInt(1, 28);
    const datoDel = pad2(dag) + pad2(måned) + pad2(år % 100);
    const individDel = pad2(tilfeldigInt(0, 4)) + tilfeldigInt(0, 9).toString();

    const utenKontrollsiffer = (datoDel + individDel).split("").map(Number);

    const kontrollsiffer1 = kontrollsiffer(utenKontrollsiffer, K1_VEKTING);
    const medFørsteKontrollsiffer = [...utenKontrollsiffer, kontrollsiffer1];
    const kontrollsiffer2 = kontrollsiffer(medFørsteKontrollsiffer, K2_VEKTING);

    const fnr = datoDel + individDel + kontrollsiffer1.toString() + kontrollsiffer2.toString();
    return fnr.length === 11 ? fnr : genererFnr();
}
