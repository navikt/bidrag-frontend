import type { EnhetResponse } from "../../types/api/EnhetTypes";
import EnhetBuilder from "../builders/EnhetBuilder";
import { PERSON_ID_LIMITED_ACCESS, PERSON_ID_LIMITED_ACCESS_2 } from "./personMockData";
import type { ResponseData } from "./types";

export const geoEnhetMockDataMap: Map<string, ResponseData<EnhetResponse>> = new Map([
    [
        PERSON_ID_LIMITED_ACCESS,
        {
            status: 200,
            data: new EnhetBuilder.Builder("4817").withEnhetNavn("NAV Familie- og pensjonsytelser Steinkjer").build(),
        },
    ],
    [
        PERSON_ID_LIMITED_ACCESS_2,
        {
            status: 200,
            data: new EnhetBuilder.Builder("2103").withEnhetNavn("NAV Vikafossen").build(),
        },
    ],
]);

export const enhetList = [
    {
        enhetIdent: "2103",
        enhetNavn: "NAV Vikafossen",
        enhetType: "Spesialenheter",
    },
    {
        enhetIdent: "4250",
        enhetNavn: "NAV Klageinstans sør",
        enhetType: "Klage",
    },
    {
        enhetIdent: "4817",
        enhetNavn: "NAV Familie- og pensjonsytelser Steinkjer",
        enhetType: "Forvaltning",
    },
    {
        enhetIdent: "4833",
        enhetNavn: "NAV Familie- og pensjonsytelser Oslo 1",
        enhetType: "Forvaltning",
    },
    {
        enhetIdent: "4806",
        enhetNavn: "NAV Familie- og pensjonsytelser Drammen",
        enhetType: "Forvaltning",
    },
    {
        enhetIdent: "4812",
        enhetNavn: "NAV Familie- og pensjonsytelser Bergen",
        enhetType: "Forvaltning",
    },
    {
        enhetIdent: "4849",
        enhetNavn: "NAV Familie- og pensjonsytelser Tromsø",
        enhetType: "Forvaltning",
    },
    {
        enhetIdent: "4820",
        enhetNavn: "NAV Familie- og pensjonsytelser Vadsø",
        enhetType: "Forvaltning",
    },
    {
        enhetIdent: "4860",
        enhetNavn: "NAV Familie- og pensjonsytelser Farskap",
        enhetType: "Forvaltning",
    },
    {
        enhetIdent: "4293",
        enhetNavn: "NAV Klageinstans øst",
        enhetType: "Klage",
    },
    {
        enhetIdent: "4294",
        enhetNavn: "NAV Klageinstans vest",
        enhetType: "Klage",
    },
    {
        enhetIdent: "4865",
        enhetNavn: "NAV Familie- og pensjonsytelser Bidrag utland",
        enhetType: "Spesialenheter",
    },
];

export const enhetListJournalfoerende = [
    {
        enhetIdent: "2103",
        enhetNavn: "NAV Vikafossen",
        enhetType: "Spesialenheter",
    },
    {
        enhetIdent: "4250",
        enhetNavn: "NAV Klageinstans sør",
        enhetType: "Klage",
    },
    {
        enhetIdent: "4817",
        enhetNavn: "NAV Familie- og pensjonsytelser Steinkjer",
        enhetType: "Forvaltning",
    },
    {
        enhetIdent: "4833",
        enhetNavn: "NAV Familie- og pensjonsytelser Oslo 1",
        enhetType: "Forvaltning",
    },
    {
        enhetIdent: "4806",
        enhetNavn: "NAV Familie- og pensjonsytelser Drammen",
        enhetType: "Forvaltning",
    },
    {
        enhetIdent: "4812",
        enhetNavn: "NAV Familie- og pensjonsytelser Bergen",
        enhetType: "Forvaltning",
    },
    {
        enhetIdent: "4849",
        enhetNavn: "NAV Familie- og pensjonsytelser Tromsø",
        enhetType: "Forvaltning",
    },
    {
        enhetIdent: "4820",
        enhetNavn: "NAV Familie- og pensjonsytelser Vadsø",
        enhetType: "Forvaltning",
    },
    {
        enhetIdent: "4860",
        enhetNavn: "NAV Familie- og pensjonsytelser Farskap",
        enhetType: "Forvaltning",
    },
    {
        enhetIdent: "4293",
        enhetNavn: "NAV Klageinstans øst",
        enhetType: "Klage",
    },
    {
        enhetIdent: "4294",
        enhetNavn: "NAV Klageinstans vest",
        enhetType: "Klage",
    },
    {
        enhetIdent: "4865",
        enhetNavn: "NAV Familie- og pensjonsytelser Bidrag utland",
        enhetType: "Spesialenheter",
    },
];
