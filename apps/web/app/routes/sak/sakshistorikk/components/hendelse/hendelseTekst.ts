import { HendelseType, type SakshendelseDto } from "@bidrag/api/SakApi";

/**
 * Tydeligere tekster for hendelsestyper der teksten fra Bisys er uklar for saksbehandler. Andre
 * hendelsestyper viser teksten fra backend.
 */
const TYDELIGERE_TEKST: Partial<Record<HendelseType, string>> = {
    [HendelseType.G4]: "Kan ikke behandles foreløpig – G4",
    [HendelseType.VEDTAK_FTK]: "Vedtak fylkestrygdekontor",
    [HendelseType.GJELDER_ENDRET]: "Landtilknytning endret",
    [HendelseType.KONVENSJONSKOДЕREGISTRERT]: "Bidragskonvensjon registrert",
    [HendelseType.REFERANSENUMMER_REGISTRERT]: "Utl. referansenr. registrert",
    [HendelseType.OPPJUSTERING11AR]: "Forskudd oppjustert, barn 11 år",
};

export function hendelseTekst(
    hendelse: Pick<SakshendelseDto, "type" | "typeBeskrivelse">,
    tydeligere: boolean,
): string {
    if (!tydeligere) return hendelse.typeBeskrivelse;
    return TYDELIGERE_TEKST[hendelse.type] ?? hendelse.typeBeskrivelse;
}

/** Sorterer hendelser på teksten som vises i kolonnen Hendelse. */
export function sammenlignHendelseTekst(tydeligere: boolean) {
    return (
        a: Pick<SakshendelseDto, "type" | "typeBeskrivelse">,
        b: Pick<SakshendelseDto, "type" | "typeBeskrivelse">,
    ) => hendelseTekst(a, tydeligere).localeCompare(hendelseTekst(b, tydeligere), "nb");
}
