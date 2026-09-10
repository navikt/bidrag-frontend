import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Felter som automatisk følger alle logglinjer for én request.
 *

 */
export type RequestLogKontekst = {
    correlationId: string;
    user?: string;
};

const storage = new AsyncLocalStorage<RequestLogKontekst>();

export function kjørMedLoggerKontekst<T>(kontekst: RequestLogKontekst, fn: () => T): T {
    return storage.run(kontekst, fn);
}

export function hentRequestKontekst(): Partial<RequestLogKontekst> {
    return storage.getStore() ?? {};
}

export function settBrukerPåRequestKontekst(navIdent: string): void {
    const kontekst = storage.getStore();
    if (kontekst) {
        kontekst.user = navIdent;
    }
}
