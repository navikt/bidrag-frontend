/**
 * Maskering av fødselsnummer i logger og telemetri.
 *
 * Dette er et **sikkerhetsnett**, ikke en tillatelse til å logge PII. Regelen om at
 * fødselsnummer ikke skal logges står ved lag — denne modulen fanger opp det som
 * likevel slipper gjennom.
 *
 * Modulen er isomorf og skal ikke importere noe internt, slik at den kan brukes både
 * på serveren (navLogger) og i nettleseren (Faro) uten å dra med seg avhengigheter
 * eller gjenskape sirkulære importer i @bidrag/common.
 */

/** Antall ledende sifre som beholdes, slik at loggen fortsatt er litt gjenkjennbar. */
const SYNLIGE_TEGN = 2;
const MASKETEGN = "*";

/** Maks dybde i objekttreet. Dypere grener erstattes av `"[for dypt]"`. */
const MAKS_DYBDE = 6;
/** Maks antall noder vi besøker per loggkall. Beskytter mot store eller fiendtlige objekt. */
const MAKS_NODER = 500;

/**
 * Nøkler som alltid maskeres, uavhengig av om verdien er et gyldig fnr.
 * Et trunkert eller ugyldig fødselsnummer er fortsatt personopplysning.
 *
 * `identifikator` er bevisst utelatt — for generisk, ville gitt for mange falske treff.
 */
const SENSITIVE_NØKLER = /fnr|ident|f(ø|o)dselsnummer|personnummer/i;

/**
 * Kandidater til fødselsnummer: 11 sammenhengende sifre, eller 6+5 delt av mellomrom
 * eller bindestrek. Kandidatene valideres av `erFodselsnummer` før de maskeres.
 */
const KANDIDAT = /\b\d{6}[ -]?\d{5}\b/g;

/** Rask sjekk før vi bruker tid på regex med tilbakesporing. */
const HAR_SIFRE = /\d{6}/;

export type Maskeringsresultat<T> = {
    verdi: T;
    antall: number;
};

/**
 * Avgjør om en kandidat på 11 siffer faktisk er et fødselsnummer.
 *
 * To uavhengige krav, og **begge** må være oppfylt:
 *
 *  1. Mod-11 kontrollsiffer, begge to.
 *  2. Plausibel dato.
 *
 * Datosjekken er den viktige. Kontonummer bruker også mod-11, så uten steg 2 hadde vi
 * maskert bankkontoer og ødelagt feilsøking av betalingsflyten.
 *
 * @param kandidat 11 siffer uten skilletegn
 */
export function erFodselsnummer(kandidat: string): boolean {
    if (!/^\d{11}$/.test(kandidat)) {
        return false;
    }

    const sifre = [...kandidat].map(Number);

    return harPlausibelDato(sifre) && harGyldigeKontrollsifre(sifre);
}

/** Vekter for første kontrollsiffer, brukt på de 9 første sifrene. */
const VEKTER_K1 = [3, 7, 6, 1, 8, 9, 4, 5, 2];
/** Vekter for andre kontrollsiffer, brukt på de 10 første sifrene. */
const VEKTER_K2 = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

/**
 * Regner ut ett mod-11-kontrollsiffer.
 *
 * Rest 0 gir kontrollsiffer 0. Rest 1 ville gitt 10, som ikke får plass i ett siffer —
 * slike nummer eksisterer ikke, og vi returnerer `null`.
 */
function beregnKontrollsiffer(sifre: number[], vekter: number[]): number | null {
    const sum = vekter.reduce((akk, vekt, i) => akk + vekt * (sifre[i] ?? 0), 0);
    const rest = sum % 11;

    if (rest === 0) {
        return 0;
    }
    return rest === 1 ? null : 11 - rest;
}

function harGyldigeKontrollsifre(sifre: number[]): boolean {
    const k1 = beregnKontrollsiffer(sifre, VEKTER_K1);
    if (k1 === null || k1 !== sifre[9]) {
        return false;
    }

    const k2 = beregnKontrollsiffer(sifre, VEKTER_K2);
    return k2 !== null && k2 === sifre[10];
}

/**
 * Sjekker at de seks første sifrene kan være en dato.
 *
 * To lovlige forskyvninger:
 *  - **D-nummer** (utenlandske borgere): dag + 40, altså 41–71.
 *  - **NPID** (nasjonal personidentifikator): måned + 40, altså 41–52.
 *
 * Vi sjekker ikke at datoen finnes i kalenderen (31. februar slipper gjennom).
 * Poenget er å skille personidentifikatorer fra andre mod-11-nummer, ikke å validere
 * fødselsdatoer. En strengere regel ville økt risikoen for at et ekte fnr slipper forbi.
 */
function harPlausibelDato(sifre: number[]): boolean {
    const dag = (sifre[0] ?? 0) * 10 + (sifre[1] ?? 0);
    const måned = (sifre[2] ?? 0) * 10 + (sifre[3] ?? 0);

    const reellDag = dag > 40 ? dag - 40 : dag;
    const reellMåned = måned > 40 ? måned - 40 : måned;

    return reellDag >= 1 && reellDag <= 31 && reellMåned >= 1 && reellMåned <= 12;
}

/**
 * Går gjennom et vilkårlig loggobjekt og maskerer fødselsnummer.
 *
 * Grener uten treff returneres by reference, slik at vanlig logging ikke betaler for
 * kopiering. Ved treff bygges bare den delen av treet som faktisk endret seg.
 *
 * @returns `verdi` (ny hvis noe ble maskert, ellers samme referanse) og antall treff.
 */
export function maskerFnr<T>(verdi: T): Maskeringsresultat<T> {
    const tilstand: Tilstand = { antall: 0, noder: 0, besøkt: new WeakSet() };
    const resultat = gåGjennom(verdi, 0, tilstand, false);

    return { verdi: resultat as T, antall: tilstand.antall };
}

type Tilstand = {
    antall: number;
    noder: number;
    besøkt: WeakSet<object>;
};

/** Erstatning når treet er dypere enn vi tør å gå. */
const FOR_DYPT = "[for dypt]";
/** Erstatning når nodebudsjettet er brukt opp. */
const FOR_STORT = "[for stort]";
/** Erstatning når vi ser samme objekt på nytt i samme gren. */
const SYKLUS = "[syklus]";

/**
 * Rekursiv traversering.
 *
 * `sensitivNøkkel` betyr at verdien kom fra en nøkkel som `fnr` eller `barnIdent`.
 * Da maskeres den uansett om den validerer, fordi et trunkert eller ugyldig
 * fødselsnummer fortsatt er en personopplysning.
 */
function gåGjennom(verdi: unknown, dybde: number, tilstand: Tilstand, sensitivNøkkel: boolean): unknown {
    tilstand.noder += 1;
    if (tilstand.noder > MAKS_NODER) {
        return FOR_STORT;
    }

    if (typeof verdi === "string") {
        return maskerStreng(verdi, tilstand, sensitivNøkkel);
    }

    if (typeof verdi === "number") {
        return maskerTall(verdi, tilstand, sensitivNøkkel);
    }

    if (verdi === null || typeof verdi !== "object") {
        return verdi;
    }

    if (tilstand.besøkt.has(verdi)) {
        return SYKLUS;
    }
    if (dybde >= MAKS_DYBDE) {
        // Vi vet ikke hva som ligger under, så vi kan ikke slippe det gjennom umaskert.
        return FOR_DYPT;
    }

    tilstand.besøkt.add(verdi);
    try {
        if (verdi instanceof Error) {
            return maskerFeil(verdi, dybde, tilstand);
        }
        if (Array.isArray(verdi)) {
            return maskerArray(verdi, dybde, tilstand, sensitivNøkkel);
        }
        return maskerObjekt(verdi as Record<string, unknown>, dybde, tilstand, sensitivNøkkel);
    } finally {
        // Fjernes igjen slik at samme objekt brukt to steder ikke feilaktig blir "[syklus]".
        // Det er bare sykler i samme gren vi vil stoppe.
        tilstand.besøkt.delete(verdi);
    }
}

function maskerStreng(verdi: string, tilstand: Tilstand, sensitivNøkkel: boolean): string {
    if (sensitivNøkkel) {
        if (verdi === "") {
            return verdi;
        }
        tilstand.antall += 1;
        return maskerVerdi(verdi);
    }

    const { verdi: maskert, antall } = maskerFnrITekst(verdi);
    tilstand.antall += antall;
    return antall === 0 ? verdi : maskert;
}

/**
 * Tall må også vurderes: `12345678901` er godt innenfor `Number.MAX_SAFE_INTEGER`, så et
 * fødselsnummer kan komme inn som tall fra et JSON-svar. Et maskert tall blir en streng.
 */
function maskerTall(verdi: number, tilstand: Tilstand, sensitivNøkkel: boolean): string | number {
    if (!Number.isFinite(verdi)) {
        return verdi;
    }

    const tekst = String(verdi);

    if (sensitivNøkkel) {
        tilstand.antall += 1;
        return maskerVerdi(tekst);
    }

    if (!/^\d{11}$/.test(tekst) || !erFodselsnummer(tekst)) {
        return verdi;
    }

    tilstand.antall += 1;
    return maskerVerdi(tekst);
}

function maskerArray(verdi: unknown[], dybde: number, tilstand: Tilstand, sensitivNøkkel: boolean): unknown[] {
    let endret = false;
    const resultat = verdi.map((element) => {
        const nytt = gåGjennom(element, dybde + 1, tilstand, sensitivNøkkel);
        if (nytt !== element) {
            endret = true;
        }
        return nytt;
    });

    return endret ? resultat : verdi;
}

function maskerObjekt(
    verdi: Record<string, unknown>,
    dybde: number,
    tilstand: Tilstand,
    sensitivNøkkel: boolean,
): Record<string, unknown> {
    let endret = false;
    const resultat: Record<string, unknown> = {};

    // Kun egne, tellbare nøkler. Vi kaller aldri `toJSON()` eller andre getters på
    // prototypen — det er nettopp slik AxiosError lekker `config.data` og Authorization.
    for (const [nøkkel, element] of Object.entries(verdi)) {
        const sensitiv = sensitivNøkkel || erSensitivNøkkel(nøkkel);
        const nytt = gåGjennom(element, dybde + 1, tilstand, sensitiv);
        if (nytt !== element) {
            endret = true;
        }
        resultat[nøkkel] = nytt;
    }

    return endret ? resultat : verdi;
}

/**
 * Maskerer en `Error` uten å miste identiteten.
 *
 * Prototypen kopieres, slik at `instanceof Error` fortsatt holder og pinos innebygde
 * `err`-serializer kjenner igjen objektet. Bygger vi et vanlig objekt i stedet, blir
 * stacktracen borte fra loggen.
 */
function maskerFeil(feil: Error, dybde: number, tilstand: Tilstand): Error {
    const melding = maskerStreng(feil.message ?? "", tilstand, false);
    const stack = typeof feil.stack === "string" ? maskerStreng(feil.stack, tilstand, false) : feil.stack;
    const cause = "cause" in feil ? gåGjennom(feil.cause, dybde + 1, tilstand, false) : undefined;

    const endret = melding !== feil.message || stack !== feil.stack || ("cause" in feil && cause !== feil.cause);
    if (!endret) {
        return feil;
    }

    const kopi = Object.create(Object.getPrototypeOf(feil)) as Error;
    Object.defineProperties(kopi, Object.getOwnPropertyDescriptors(feil));
    Object.defineProperty(kopi, "message", { value: melding, writable: true, configurable: true });
    Object.defineProperty(kopi, "stack", { value: stack, writable: true, configurable: true });
    if ("cause" in feil) {
        Object.defineProperty(kopi, "cause", { value: cause, writable: true, configurable: true });
    }

    return kopi;
}

/**
 * Maskerer en verdi ved å beholde de første sifrene og erstatte resten.
 * Verdier kortere enn `SYNLIGE_TEGN + 1` maskeres i sin helhet, slik at vi ikke
 * ender opp med å vise hele verdien.
 */
export function maskerVerdi(verdi: string): string {
    if (verdi.length <= SYNLIGE_TEGN) {
        return MASKETEGN.repeat(verdi.length);
    }

    return verdi.slice(0, SYNLIGE_TEGN) + MASKETEGN.repeat(verdi.length - SYNLIGE_TEGN);
}

/**
 * Maskerer fødselsnummer i en enkelt streng.
 *
 * Skilletegn i `6 5`-formen fjernes ikke — vi maskerer treffet slik det står, slik at
 * lengden på loggen ikke endres uventet.
 */
export function maskerFnrITekst(tekst: string): Maskeringsresultat<string> {
    if (!HAR_SIFRE.test(tekst)) {
        return { verdi: tekst, antall: 0 };
    }

    let antall = 0;
    const maskert = tekst.replace(KANDIDAT, (treff) => {
        const sifre = treff.replace(/[ -]/g, "");
        if (!erFodselsnummer(sifre)) {
            return treff;
        }
        antall += 1;
        return maskerVerdi(treff);
    });

    return { verdi: maskert, antall };
}

/** Sant når nøkkelen i seg selv tilsier at verdien er en personidentifikator. */
export function erSensitivNøkkel(nøkkel: string): boolean {
    return SENSITIVE_NØKLER.test(nøkkel);
}

export const _internt = {
    MAKS_DYBDE,
    MAKS_NODER,
    HAR_SIFRE,
    KANDIDAT,
};
