import { type Enhet, EnhetType } from "../../../types/enhet";

const ENHET_IDENT_PERSON = "2103";

export function createEnhet(ident: string, navn: string, enhetType: EnhetType = EnhetType.FORVALTNING): Enhet {
    return {
        enhetIdent: ident,
        enhetNavn: navn,
        enhetType: enhetType,
    };
}

export const enhetPersonResponse = createEnhet(ENHET_IDENT_PERSON, "NAV Vikafossen", EnhetType.SPESIALENHETER);
export const enhetList: Enhet[] = [
    {
        enhetIdent: "4808",
        enhetNavn: "NAV Familie- og pensjonsytelser Porsgrunn",
    },
    {
        enhetIdent: "4815",
        enhetNavn: "NAV Familie- og pensjonsytelser Ålesund",
    },
];

export const enhetListJournalfoerende: Enhet[] = [
    {
        enhetIdent: "2103",
        enhetNavn: "NAV Vikafossen",
        enhetType: EnhetType.SPESIALENHETER,
    },
    {
        enhetIdent: "4250",
        enhetNavn: "NAV Klageinstans sør",
        enhetType: EnhetType.KLAGE,
    },
    {
        enhetIdent: "4808",
        enhetNavn: "NAV Familie- og pensjonsytelser Porsgrunn",
        enhetType: EnhetType.FORVALTNING,
    },
    {
        enhetIdent: "4815",
        enhetNavn: "NAV Familie- og pensjonsytelser Ålesund",
        enhetType: EnhetType.FORVALTNING,
    },
    {
        enhetIdent: "4833",
        enhetNavn: "NAV Familie- og pensjonsytelser Oslo 1",
        enhetType: EnhetType.FORVALTNING,
    },
    {
        enhetIdent: "4811",
        enhetNavn: "NAV Familie- og pensjonsytelser Sandnes",
        enhetType: EnhetType.FORVALTNING,
    },
    {
        enhetIdent: "4806",
        enhetNavn: "NAV Familie- og pensjonsytelser Drammen",
        enhetType: EnhetType.FORVALTNING,
    },
    {
        enhetIdent: "4812",
        enhetNavn: "NAV Familie- og pensjonsytelser Bergen",
        enhetType: EnhetType.FORVALTNING,
    },
    {
        enhetIdent: "4847",
        enhetNavn: "NAV Familie- og pensjonsytelser Levanger",
        enhetType: EnhetType.FORVALTNING,
    },
    {
        enhetIdent: "4849",
        enhetNavn: "NAV Familie- og pensjonsytelser Tromsø",
        enhetType: EnhetType.FORVALTNING,
    },
    {
        enhetIdent: "4820",
        enhetNavn: "NAV Familie- og pensjonsytelser Vadsø",
        enhetType: EnhetType.FORVALTNING,
    },
    {
        enhetIdent: "4860",
        enhetNavn: "NAV Familie- og pensjonsytelser Farskap",
        enhetType: EnhetType.FORVALTNING,
    },
    {
        enhetIdent: "4293",
        enhetNavn: "NAV Klageinstans øst",
        enhetType: EnhetType.KLAGE,
    },
    {
        enhetIdent: "4294",
        enhetNavn: "NAV Klageinstans vest",
        enhetType: EnhetType.KLAGE,
    },
    {
        enhetIdent: "4865",
        enhetNavn: "NAV Familie- og pensjonsytelser Bidrag utland",
        enhetType: EnhetType.SPESIALENHETER,
    },
];

export const enhetInfo = {
    enhetIdent: "4820",
    enhetNavn: "NAV Familie- og pensjonsytelser Vadsø",
};
