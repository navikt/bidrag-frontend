/**
 * Crockford Base32 — 32 tegn uten I, L, O og U, slik at ID-en er enkel å lese høyt og skrive av
 * uten å forveksle tegn. Alfabetet er nøyaktig 32 tegn, som går opp i 256, slik at `byte % 32`
 * gir en jevn fordeling uten skjevhet.
 */
const ALFABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const GRUPPE_STØRRELSE = 5;
const ANTALL_GRUPPER = 2;

export const correlationIdHeader = "X-Correlation-ID";

/**
 * Lager en generisk, ikke-identifiserende korrelasjons-ID på formen `A1B2C-D3E4F`.
 *
 * 10 tegn fra et alfabet på 32 gir 50 bits entropi. Det er kort nok til å leses opp og skrives av
 * ved kontakt med brukerstøtte, og kollisjonssjansen er neglisjerbar for volumet vi logger per døgn.
 */
export function generateCorrelationId(): string {
    const antallTegn = GRUPPE_STØRRELSE * ANTALL_GRUPPER;
    const tilfeldigeBytes = crypto.getRandomValues(new Uint8Array(antallTegn));
    const tegn = Array.from(tilfeldigeBytes, (byte) => ALFABET[byte % ALFABET.length]);

    return Array.from({ length: ANTALL_GRUPPER }, (_, gruppe) =>
        tegn.slice(gruppe * GRUPPE_STØRRELSE, (gruppe + 1) * GRUPPE_STØRRELSE).join(""),
    ).join("-");
}
