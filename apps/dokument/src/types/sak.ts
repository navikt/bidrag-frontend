import { type InternalRolleDto, Kategori, RolleType, type SakDto, SakStatus } from "./api/SakTypes";

export { Kategori, RolleType, SakStatus };
export interface Sak extends SakDto {
    enhetInformasjon?: string;
    motsattRolle?: InternalRolleDto;
    rolle?: InternalRolleDto;
    ferdigRegistrert?: boolean;
    tilknyttetJournalpost?: boolean;
    feil?: boolean;
    erIkkeBidragSak?: boolean;
}

export const SakStatusDisplayValue: Record<SakStatus, string> = {
    AK: "Aktiv",
    IN: "Inaktiv",
    NY: "Journalsak",
    SA: "Sanert",
    SO: "Åpen søknad",
};

export const KategoriNavnDisplayValue: Record<Kategori, string> = {
    [Kategori.N]: "Nasjonal",
    [Kategori.U]: "Utland",
};

export const NY_SAK_SAKSNUMMER = "Ny Sak";
export const isNySak = (sak: Sak) => sak.saksnummer === NY_SAK_SAKSNUMMER;
export const createNySak = (): Sak => ({
    saksnummer: NY_SAK_SAKSNUMMER,
    enhetInformasjon: "Ingen enhet å vise",
    eierfogd: "Roller velges i Bisys etter registrering",
    rolle: {},
    motsattRolle: { person: { navn: "Ingen personer å vise", ident: "" } },
    roller: [],
});
