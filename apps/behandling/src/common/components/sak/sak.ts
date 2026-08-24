import type { BidragssakDto, RolleDto } from "@bidrag/api/SakApi";
import { Sakskategori } from "../../../forskudd/enum/Sakskategori";
import type { Saksstatus } from "../../../forskudd/enum/Saksstatus";

export interface Sak extends BidragssakDto {
    enhetInformasjon?: string;
    motsattRolle?: RolleDto & { navn: string };
    rolle?: RolleDto;
    ferdigRegistrert?: boolean;
    tilknyttetJournalpost?: boolean;
    feil?: boolean;
    erIkkeBidragSak?: boolean;
}

export const SakStatusDisplayValue: Record<Saksstatus, string> = {
    AK: "Aktiv",
    IN: "Inaktiv",
    NY: "Journalsak",
    SA: "Sanert",
    SO: "Åpen søknad",
};

export const KategoriNavnDisplayValue: Record<Sakskategori, string> = {
    [Sakskategori.NASJONAL]: "Nasjonal",
    [Sakskategori.UTLAND]: "Utland",
};
