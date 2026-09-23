import { genererFnr } from "@bidrag/common/playwright/testing/fnrGenerator.ts";

export const testpersoner = {
    bidragsmottaker: {
        ident: genererFnr(),
        visningsnavn: "Test Bidragsmottaker",
        fødselsdato: "1987-06-21",
    },
    bidragspliktig: {
        ident: genererFnr(),
        visningsnavn: "Test Bidragspliktig",
        fødselsdato: "1985-02-14",
    },
    barn: {
        ident: genererFnr(),
        visningsnavn: "Test Barn",
        fødselsdato: "2015-04-12",
    },
} as const;

export function lagRolle(overrides: Record<string, unknown> = {}) {
    return {
        objektnummer: "1",
        reellMottager: null,
        reellMottaker: null,
        mottagerErVerge: false,
        foedselsnummer: null,
        rollehistorikk: [],
        ...overrides,
    };
}

export function lagSak(overrides: Record<string, unknown> = {}) {
    return {
        eierfogd: "4806",
        saksnummer: "2024/1",
        saksstatus: "AK",
        kategori: "N",
        begrensetTilgang: false,
        opprettetDato: "2024-01-01",
        levdeAdskilt: false,
        ukjentPart: false,
        vedtakssperre: false,
        avsluttet: false,
        arbeidsfordeling: { enhet: "4806" },
        roller: [
            lagRolle({ fodselsnummer: testpersoner.bidragsmottaker.ident, type: "BM", rolleType: "BM" }),
            lagRolle({ fodselsnummer: testpersoner.bidragspliktig.ident, type: "BP", rolleType: "BP" }),
            lagRolle({ fodselsnummer: testpersoner.barn.ident, type: "BA", rolleType: "BA" }),
        ],
        ...overrides,
    };
}
