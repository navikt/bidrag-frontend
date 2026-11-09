import { HendelseType, type SakshendelseDto } from "@bidrag/api/SakApi";

/**
 * Tydeligere tekster for hendelsestyper der teksten fra Bisys er uklar for saksbehandler. Andre
 * hendelsestyper viser teksten fra backend.
 */
const TYDELIGERE_TEKST: Partial<Record<HendelseType, string>> = {
    [HendelseType.G4]: "Avsluttet – G4-land",
    [HendelseType.VEDTAK_FTK]: "Vedtak fylkestrygdekontor",
    [HendelseType.GJELDER_ENDRET]: "Landtilknytning endret",
    [HendelseType.KONVENSJONSKOДЕREGISTRERT]: "Bidragskonvensjon registrert",
    [HendelseType.REFERANSENUMMER_REGISTRERT]: "Utl. referansenr. registrert",
    [HendelseType.OPPJUSTERING11AR]: "Forskudd oppjustert, barn 11 år",
};

export function hendelseTekst(hendelse: Pick<SakshendelseDto, "type" | "typeBeskrivelse">): string {
    return TYDELIGERE_TEKST[hendelse.type] ?? hendelse.typeBeskrivelse;
}
