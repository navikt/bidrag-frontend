import { HendelseType, type SakshendelseDto } from "@bidrag/api/SakApi";

/**
 * Filtrerer bort feilregistrerte hendelser og alle andre hendelser som tilhører samme søknad,
 * med mindre `visFeilregistrerte` er satt.
 */
export function filtrerFeilregistrerteHendelser(
    hendelser: SakshendelseDto[],
    visFeilregistrerte: boolean,
): SakshendelseDto[] {
    if (visFeilregistrerte) return hendelser;

    const feilregistrerteSøknadsider = new Set(
        hendelser
            .filter((h) => h.type === HendelseType.FEILREGISTRERT && h.søknadsid)
            .map((h) => h.søknadsid as string),
    );

    return hendelser.filter(
        (h) => h.type !== HendelseType.FEILREGISTRERT && !(h.søknadsid && feilregistrerteSøknadsider.has(h.søknadsid)),
    );
}
