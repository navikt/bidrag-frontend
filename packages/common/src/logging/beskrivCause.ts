const MAKS_CAUSE_LENGDE = 200;

/**
 * Gjør en ukjent `cause` om til en trygg tekst.
 */
export function beskrivCause(cause: unknown): string | undefined {
    if (cause === null || cause === undefined) {
        return undefined;
    }
    if (cause instanceof Error) {
        return `${cause.name}: ${cause.message}`.slice(0, MAKS_CAUSE_LENGDE);
    }
    if (typeof cause === "string") {
        return cause.slice(0, MAKS_CAUSE_LENGDE);
    }
    if (typeof cause === "number" || typeof cause === "boolean") {
        return String(cause);
    }
    return `[${typeof cause}]`;
}
