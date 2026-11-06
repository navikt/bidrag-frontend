/**
 * Sann når Folkeregisteret har en annen forelder til barnet enn valgt BP eller BM:
 * registrerte og valgte foreldre er til sammen flere enn to personer.
 * Én registrert forelder og ukjent motpart er ufullstendig relasjon, ikke annen forelder.
 */
export function harAnnenRegistrertForelder(
    registrerteForeldre: (string | null | undefined)[],
    valgteForeldre: (string | null | undefined)[],
): boolean {
    const foreldre = new Set([...registrerteForeldre, ...valgteForeldre].filter((ident): ident is string => !!ident));
    return foreldre.size > 2;
}
