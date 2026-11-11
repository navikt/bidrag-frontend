import { genererFnr } from "@bidrag/common/playwright/testing/fnrGenerator.ts";

export const testpersoner = {
    bidragspliktig: {
        ident: genererFnr(),
        visningsnavn: "Test Bidragspliktig",
        fødselsdato: "1985-02-14",
    },
    bidragsmottaker: {
        ident: genererFnr(),
        visningsnavn: "Test Bidragsmottaker",
        fødselsdato: "1987-06-21",
    },
    annenForelder: {
        ident: genererFnr(),
        visningsnavn: "Test Annen Forelder",
        fødselsdato: "1983-10-03",
    },
    barnUnder18: {
        ident: genererFnr(),
        visningsnavn: "Test Barn Under 18",
        fødselsdato: "2015-04-12",
    },
    barnUnder18NummerTo: {
        ident: genererFnr(),
        visningsnavn: "Test Barn Nummer To",
        fødselsdato: "2017-08-09",
    },
    barnOver18: {
        ident: genererFnr(),
        visningsnavn: "Test Barn Over 18",
        fødselsdato: "2002-01-15",
    },
    ektefelle: {
        ident: genererFnr(),
        visningsnavn: "Test Ektefelle",
        fødselsdato: "1986-11-30",
    },
} as const;

export const samhandler = {
    samhandlerId: "80000000001",
    offentligId: "999999999",
    navn: "Test Kommune",
    kontonummer: { norskKontonummer: "86011117947" },
} as const;

export const barnkurver = [
    {
        forelderrolleMotpart: "MOR" as const,
        motpart: testpersoner.bidragsmottaker,
        fellesBarn: [testpersoner.barnUnder18],
    },
    {
        forelderrolleMotpart: "MOR" as const,
        motpart: testpersoner.annenForelder,
        fellesBarn: [testpersoner.barnUnder18NummerTo],
    },
];

export const ukjentBarnkurv = [
    {
        forelderrolleMotpart: "UKJENT" as const,
        motpart: null,
        fellesBarn: [testpersoner.barnOver18],
    },
];
