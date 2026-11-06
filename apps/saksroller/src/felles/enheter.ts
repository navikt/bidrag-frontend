export const ADRESSEBESKYTTELSE_ENHET = "2103";
export const EGEN_ANSATT_ENHET = "4883";

const SKJERMEDE_ENHETER = [ADRESSEBESKYTTELSE_ENHET, EGEN_ANSATT_ENHET];

export function erSkjermetEnhet(enhet: string): boolean {
    return SKJERMEDE_ENHETER.includes(enhet);
}

/**
 * Enhetene saken sendes til i stedet for, når arbeidsfordelingen gir en annen enhet enn saksbehandlerens
 * enhet eller eierfogd. Tom liste betyr at saken blir der den hører hjemme.
 */
export function enheterSakenFlyttesFra({
    enhet,
    innloggetEnhet,
    eierfogd,
}: {
    enhet: string | null | undefined;
    innloggetEnhet: string | null | undefined;
    eierfogd: string | null | undefined;
}): string[] {
    if (!enhet) return [];
    return [...new Set([innloggetEnhet, eierfogd])].filter((annen): annen is string => !!annen && annen !== enhet);
}

/** Sann når saksbehandler må bekrefte at saken sendes til `enhet`. */
export function måBekrefteEnhet(args: {
    enhet: string | null | undefined;
    innloggetEnhet: string | null | undefined;
    eierfogd: string | null | undefined;
}): boolean {
    if (!args.enhet) return false;
    if (enheterSakenFlyttesFra(args).length > 0) return true;
    return !args.innloggetEnhet && erSkjermetEnhet(args.enhet);
}
