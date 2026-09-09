import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Felter som automatisk følger alle logglinjer for én request.
 *
 * Legg ALDRI personopplysninger her — ikke fødselsnummer, navn, adresse eller saksnummer.
 * Feltene havner i hver eneste logglinje, også i dem vi ikke kontrollerer selv.
 * `user` er NAV-identen til saksbehandleren, ikke personen saken gjelder.
 */
export type RequestLogKontekst = {
    correlationId: string;
    user?: string;
};

const storage = new AsyncLocalStorage<RequestLogKontekst>();

/** Åpner et scope. Alt som skjer inne i `fn` — også etter `await` — ser konteksten. */
export function kjørMedLoggerKontekst<T>(kontekst: RequestLogKontekst, fn: () => T): T {
    return storage.run(kontekst, fn);
}

/** Leser gjeldende kontekst. Returnerer `{}` utenfor en request, for eksempel ved oppstart. */
export function hentRequestKontekst(): Partial<RequestLogKontekst> {
    return storage.getStore() ?? {};
}

/**
 * Fyller inn NAV-identen etter at tokenet er validert.
 *
 * Konteksten er mutérbar fordi korrelasjons-ID må settes før autentisering — ellers kan ikke
 * auth-feil spores — mens NAV-identen først er kjent etterpå. Mutasjonen treffer bare det scopet
 * `kjørMedRequestKontekst` åpnet for denne ene requesten.
 */
export function settBrukerPåRequestKontekst(navIdent: string): void {
    const kontekst = storage.getStore();
    if (kontekst) {
        kontekst.user = navIdent;
    }
}
