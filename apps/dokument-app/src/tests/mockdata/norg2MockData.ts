import type { ResponseData } from "./types";

// Source https://norg2.dev.intern.nav.no/norg2/api/v1/enhet/XXXX

export const norg2MockData: Map<string, ResponseData<unknown>> = new Map([
    [
        "4817",
        {
            status: 200,
            data: {
                enhetNavn: "NAV Familie- og pensjonsytelser Steinkjer",
                enhetIdent: "4817",
            },
        },
    ],
    [
        "4815",
        {
            status: 200,
            data: {
                enhetNavn: "NAV Familie- og pensjonsytelser Ålesund",
                enhetIdent: "4815",
            },
        },
    ],
    [
        "2103",
        {
            status: 200,
            data: {
                enhetNavn: "NAV Vikafossen",
                enhetIdent: "2103",
            },
        },
    ],
]);
