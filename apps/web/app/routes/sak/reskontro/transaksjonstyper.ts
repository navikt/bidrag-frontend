interface TransaksjonType {
    tekst: string;
    kommentar?: string;
}

const TRANSAKSJON_TYPE_MAP: Record<string, TransaksjonType> = {
    A1: {
        tekst: "Forskudd",
        kommentar: "Nytt vedtak om forskudd",
    },
    A2: {
        tekst: "Forskudd korrigering",
        kommentar:
            "Benyttes ved ulike former for justering av opprinnelig beløp. Benyttes også i tilfeller hvor man øker forskudd i ettertid og BM har fått utbetalt forskudd. Korrigering uten utbetaling til BM",
    },
    A3: {
        tekst: "Forskudd endringsvedtak",
        kommentar: "Motpost til opprinnelig krav ved nytt vedtak",
    },
    A4: {
        tekst: "Forskudd utbetaling",
        kommentar: "Motpost til forskuddskrav. Dannes når utbetalingen foregår",
    },
    A5: {
        tekst: "Forskudd feilutbetaling",
        kommentar:
            "Posten produseres av ELIN ved tolking av endringsvedtak forskudd tilbake tid. Betyr potensiell feilutbetaling",
    },
    A6: {
        tekst: "Forskudd erstatningsutbetaling (Dobbelt forskudd)",
        kommentar:
            "Legges inn manuelt der BM påstår ikke å ha fått forskudd. Egen type da den ikke må forveksles med ordinært forskudd",
    },
    A7: {
        tekst: "Forskudd returføring utbetaling",
        kommentar:
            "Benyttes der hvor UR ikke greier å gjennomføre utbetalingen. Den må da returføres i brukerreskontro",
    },
    A10: {
        tekst: "Midlertidig lagring av forskuddssats",
        kommentar:
            "Oppdrag sender forskuddssats sammen med neste mnd bidragssats. A10 benyttes til å lagre satsen inntil forskuttering skal kjøres. Evt endringvedtak i mellomtiden vil oppdatere A10. Ved forskuttering behandles alle barn med A10. Korrekt A1 lagres (også med evt. verdi=0) og A10 slettes. Er bare en teknisk trans for å ta vare på forskuddssats. Skal ikke vises til bruker. Påvirker heller ikke saldo",
    },
    B1: {
        tekst: "Privat bidrag",
        kommentar: "Nytt vedtak om barnebidrag",
    },
    B2: {
        tekst: "Privat bidrag korrigering",
        kommentar:
            "Benyttes typisk ved justering mellom privat og offentlig bidragskrav og ved andre korrigeringer til opprinnelig beløp",
    },
    B3: {
        tekst: "Privat bidrag endringsvedtak",
        kommentar: "Motpost til opprinnelig krav ved nytt vedtak",
    },
    B4: {
        tekst: "Privat bidrag, privat oppgjør",
        kommentar:
            "For mye utbetalt BM. Oppstår ved tolking av endringsvedtak bidrag tilbake tid der hvor bidragset settes ned og BP er helt eller delvis ajour",
    },
    B10: {
        tekst: "Privat bidrag utbetaling",
        kommentar:
            "Ingen egen transaksjon i ELIN. Utbetalingen oppdaterer egne felt på innbetalingen som er krysset mot kravet. Ved retur til skj",
    },
    C1: {
        tekst: "Offentlig bidrag",
        kommentar:
            "Benyttes ved flytting av bidragsgjeld fra privat til offentlig. Er det offentlige kravet som etableres",
    },
    C2: {
        tekst: "Offentlig bidrag korrigering",
        kommentar:
            "Benyttes ved korrigeringer og feil hvor offentlig gjeld skal reduseres. NB! Her trenger man ikke noen type for endringsvedtak",
    },
    C4: {
        tekst: "Offentlig bidrag BP tilbakebetalt forskudd (Offentlig oppgjør)",
        kommentar:
            "Benyttes der BP er ajour og bidrag reduseres til under forskudds sats. Skal i utgangspunkt tilbakebetales",
    },
    C5: {
        tekst: "Offentlig bidrag tilbakeført innkrevingssak",
        kommentar:
            "Benyttes for å vise at motsvarende kreditpost er overført til innkrevningssaken. Benyttes for å utligne C4. Vil være grunnlag for å lage en 309 innbetaling i Innkrevingssaken da dette er penger som enten tilbakebetales eller som fordeles til andre krav og der kan gi utbetaling til BM",
    },
    D1: {
        tekst: "Bidrag privat 18 år",
        kommentar: "Nytt vedtak om 18 års bidrag",
    },
    D2: {
        tekst: "Bidrag privat 18 år korrigering",
        kommentar: "Kan benyttes ved korrigeringer til opprinnelig beløp ved feil. Brukes manuelt",
    },
    D3: {
        tekst: "Bidrag privat 18 år endringsvedtak",
        kommentar: "Motpost til opprinnelig krav ved nytt vedtak",
    },
    D4: {
        tekst: "Bidrag privat 18 år privat oppgjør",
        kommentar:
            "For mye utbetalt BM. Oppstår ved tolking av endringsvedtak bidrag tilbake tid der hvor bidragset settes ned og BP er helt eller delvis ajour",
    },
    D10: {
        tekst: "Bidrag privat 18 år utbetaling",
        kommentar: "Ref B10",
    },
    E1: {
        tekst: "Særtilskudd",
        kommentar: "Nytt vedtak særtilskudd",
    },
    E2: {
        tekst: "Særtilskudd korrigering",
        kommentar: "Kan benyttes ved korrigeringer til opprinnelig beløp ved feil. Brukes manuelt",
    },
    E3: {
        tekst: "Særtilskudd endringsvedtak",
        kommentar: "Motpost til opprinnelig krav ved nytt vedtak",
    },
    E4: {
        tekst: "Særtilskudd privat oppgjør",
        kommentar:
            "For mye utbetalt BM. Oppstår ved tolking av endringsvedtak bidrag tilbake tid der hvor bidragset settes ned og BP er helt eller delvis ajour",
    },
    E10: {
        tekst: "Særtilskudd utbetaling",
        kommentar: "Ref B10",
    },
    F1: {
        tekst: "Ektefellebidrag",
        kommentar: 'Nytt vedtak ektefellebidrag. Egentlig BM som er "konto". Angir dummy barn',
    },
    F2: {
        tekst: "Ektefellebidrag korrigering",
        kommentar: "Kan benyttes ved korrigeringer til opprinnelig beløp ved feil. Brukes manuelt",
    },
    F3: {
        tekst: "Ektefellebidrag endringsvedtak",
        kommentar: "Motpost til opprinnelig krav ved nytt vedtak",
    },
    F4: {
        tekst: "Ektefellebidrag privat oppgjør",
        kommentar:
            "For mye utbetalt BM. Oppstår ved tolking av endringsvedtak bidrag tilbake tid der hvor bidragset settes ned og BP er helt eller delvis ajour",
    },
    F10: {
        tekst: "Ektefellebidrag utbetaling",
        kommentar: "Ref B10",
    },
    G1: {
        tekst: "Fastsettelsesgebyr",
        kommentar:
            "Nytt vedtak fastsettelsesgebyr. Forhold mellom stat og BM/BP/barn. Angir dummy barn da fastsettelsesgebyr ikke er knyttet til barn. Ved barn over 18 brukes reelt barn som skyldner",
    },
    G2: {
        tekst: "Fastsettelsesgebyr korrigering",
        kommentar: "Benyttes ved diverse korrigeringer til opprinnelig beløp",
    },
    G3: {
        tekst: "Fastsettelsesgebyr endringsvedtak",
        kommentar: "Motpost til opprinnelig krav ved nytt vedtak",
    },
    G4: {
        tekst: "Fastsettelsesgebyr tilbakebetaling",
        kommentar:
            "Dersom BM får innvilget klage på gebyret og det ert betalt ved trekk i bidrag skal det utbetales direkte",
    },
    G5: {
        tekst: "Fastsettelsesgebyr tilbakeføring innkrevingssak",
        kommentar:
            "Benyttes for å vise at motsvarende kreditpost er overført til innkrevningssaken. Benyttes for å utligne G4. Vil være grunnlag for å lage en 309 innbetaling i Innkrevingssaken da dette er penger som enten tilbakebetales eller som fordeles til andre krav og der kan gi utbetaling til BM",
    },
    H1: {
        tekst: "Tilbakekrevd forskudd",
        kommentar:
            "Nyttes ved nytt tilbakekrevingsvedtak (feilutbetalt forskudd). Føres ikke pr barn i reskontro, men det fattes pr barn slik at det kommer transer pr barn. Benytter enperiode",
    },
    H2: {
        tekst: "Tilbakekrevd forskudd korrigering",
        kommentar: "Benyttes ved diverse korrigeringer til opprinnelig beløp",
    },
    H3: {
        tekst: "Tilbakekrevd forskudd endringsvedtak",
        kommentar: "Motpost til opprinnelig krav ved nytt vedtak",
    },
    H5: {
        tekst: "Tilbakekrevd forskudd tilbakeføring innkrevingssak",
        kommentar: "Benyttes for å vise at motsvarende kreditpost er overført til innkrevningssaken",
    },
    I1: {
        tekst: "Motregning",
        kommentar:
            "Nyttes ved nye vedtak. Danner kredittransaksjoner som krysses mot Bidrag privat, 18 år og ektefellebidrag slik at beløp overført til innkrevingssaken (og til fakturering) blir lavere",
    },
    I2: {
        tekst: "Motregning korrigering",
        kommentar:
            "Vedtaket fattes aldri med tilbakevirkende kraft. Dersom det skal endres gjøres en ny manuell utregning og nytt vedtak fattes for senere perioder. Transkoden her dekker diverse korrigering, f.eks ved feil. Maskinelt benyttes den til å korrigere vekk I1 dersom hele motregningen ikke kan benyttes mot privat gjeld",
    },
    J1: {
        tekst: "Kommunale forskuddskrav (dagens 31 krav)",
        kommentar:
            "Utgått kravtype, ingen nye krav vil oppstå. Her vil det alltid være en annen mottaker på kravet, her en kommune. Intet behov for korrigeringstrans. Disse skal enten dekkes eller avskrives. Kommune som RM",
    },
    J2: {
        tekst: "Kommunale stønadskrav (dagens 41 krav)",
        kommentar: "Tilsvarende som forskuddskrav. Alltid en kommune som RM. Utgått kravtype",
    },
    J3: {
        tekst: "Folketrygdens stønadskrav (dagens 42 krav)",
        kommentar:
            "Tilsvarende som forskuddskrav bortsett fra at kravtypen kan føres på egen kontorelasjon tilsvarende som dagens offentlig bidragsgjeld. Det er staten som skal ha pengene. Utgått kravtype",
    },
    J10: {
        tekst: "Gamle krav utbetaling",
        kommentar: "Ref B10. Samme transaksjon for både J1 og J2. J3 skaper ingen utbetalinger",
    },
    K1: {
        tekst: "Ettergivelse NAV Forvaltning bidrag",
        kommentar:
            "Gjelder kun barnebidrag og 18år. Benyttes der NAV Forvaltning gjør vedtak om ettergivelse. Fordeling kommer ferdig pr barn. Eget regelverk i ELIN for å plassere på perioder. (maskinell)",
    },
    K2: {
        tekst: "Bidrag mottatt direkte fra BP",
        kommentar:
            "Benyttes i tilfeller der man godtar å skrive ned BPs gjeld grunnet direkte oppgjør. Kan både legges inn manuelt og komme sammen med bidragsvedtak. (maskinell ved første gang og manuell ved endringer på et senere tidspunkt)",
    },
    K3: {
        tekst: "Ettergivelse NAV Forvaltning tilbakekreving",
        kommentar:
            "Gjelder kun Tilbakekreving. Benyttes der NAV Forvaltning gjør vedtak om ettergivelse. Beløpet kommer pr barn, men alle beløp føres mot samme konto. Ref H1. (maskinell)",
    },
    K10: {
        tekst: "Ettergivelse korrigering",
        kommentar:
            "Benyttes maskinelt i feilsituasjoner hvor hvor man får inn en K1, K2 eller K3 som er større enn den gjeld som kan ettergis",
    },
    "301": {
        tekst: "OCR innbetaling",
        kommentar: "Innbetalinger fra ulike kilder",
    },
    "302": {
        tekst: "Trygdetrekk",
    },
    "303": {
        tekst: "Trekk i utbetaling",
    },
    "304": {
        tekst: "Aetat innbetaling",
    },
    "305": {
        tekst: "Innbetaling Adra",
    },
    "307": {
        tekst: "Tilbakeført fra reskontro",
    },
    "309": {
        tekst: "Manuelt ført innbetaling",
        kommentar:
            "I reskontroen må alle innbetalinger være knyttet til en kontorelasjon. Frie og uplasserte innbetalinger finnes ikke. Innbetalinger som hentes fra reskontro. Akonto fra innkrevingssaken",
    },
    "371": {
        tekst: "Tilbakebetaling",
        kommentar:
            "Egen transaksjon i innkrevingssaken. Koden speiler opprinnelig innbetaling. 301 gir 371, 302 gir 372 etc. Man viser ikke som egen trans innbetalingen som var bakgrunn for utbetaling",
    },
    "390": {
        tekst: "Innbetaling tilbakeføring/annulering",
        kommentar:
            "Tilbakeføringer skjer fra Innkrevingssaken. Betalinger (korrigeringer) uten faktiske penger. Vil aldri gi utbetaling",
    },
    "400": {
        tekst: "Avskrivning",
        kommentar:
            "Benyttes av NAVI ved foreldelse, dødsbo, konkurs, gjeldsordning, ettergivelse NAV Forvaltning, ettergivelse BM, bidrag mottatt direkte, tilbakekreving ettergivelse eller uerholdelige krav. Alle manuelle nedskrivningene har samme transkode. Benytter behandlingskode for å skille på årsak til avskrivningen. Legg de manuelle til 400 med behandlingskode for årsak. K for de maskinelle",
    },
};

export type Transaksjonskode = keyof typeof TRANSAKSJON_TYPE_MAP | string;

export function visningsnavnForTransaksjonskode(kode: Transaksjonskode): string | null {
    return TRANSAKSJON_TYPE_MAP[kode]?.tekst ?? null;
}

export function kommentarForTransaksjonskode(kode: Transaksjonskode): string | null {
    return TRANSAKSJON_TYPE_MAP[kode]?.kommentar ?? null;
}

export function isTransaksjonGruppe(kode: string) {
    return Object.keys(transaksjonstypeGrupper).includes(kode);
}

export const transaksjonstypeGrupper: Record<string, { visningsnavn: string; transKoder?: Transaksjonskode[] }> = {
    Innbetalinger: {
        visningsnavn: "Alle innbetalinger",
        transKoder: ["301", "302", "303", "304", "305", "306", "307", "308", "309"],
    },
    Utbetalinger: {
        visningsnavn: "Alle utbetalinger",
        transKoder: ["A4", "A6", "A7", "B10", "D10", "E10", "J10", "K10"],
    },
    Tilbakebetalinger: {
        visningsnavn: "Alle tilbakebetalinger",
        transKoder: ["371", "372", "373", "374", "375", "376", "377", "378", "379"],
    },
};
