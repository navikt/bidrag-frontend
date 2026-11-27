import type { ForelderBarnRelasjonDto } from "@bidrag/api/PersonApi";
import { type UseQueryResult, useQueries } from "@tanstack/react-query";
import { AxiosError, type AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useBarnMedUfullstendigRelasjon } from "./useBarnMedUfullstendigRelasjon";

vi.mock("@tanstack/react-query", () => ({
    useQueries: vi.fn(),
}));

type TestQueryOptions = {
    enabled?: boolean;
    retry?: (failureCount: number, error: unknown) => boolean;
};

type TestUseQueriesOptions = {
    queries: TestQueryOptions[];
};

type MockQueryResult = {
    data?: ForelderBarnRelasjonDto;
    error?: Error;
    isError: boolean;
    isFetching?: boolean;
};

const queryOptionsPerCall: TestQueryOptions[][] = [];

function feilMedStatus(status: number): AxiosError {
    const error = new AxiosError(`Request failed with status code ${status}`);
    error.response = { status } as AxiosResponse;
    return error;
}

function relasjon(...foreldre: string[]): ForelderBarnRelasjonDto {
    return {
        forelderBarnRelasjon: foreldre.map((relatertPersonsIdent) => ({
            minRolleForPerson: "BARN",
            relatertPersonsIdent,
        })),
    } as ForelderBarnRelasjonDto;
}

function mockResultater(resultater: MockQueryResult[]) {
    const queryResults = resultater as unknown as UseQueryResult<ForelderBarnRelasjonDto, Error>[];
    vi.mocked(useQueries).mockImplementation((options) => {
        queryOptionsPerCall.push((options as unknown as TestUseQueriesOptions).queries);
        return queryResults;
    });
}

describe("useBarnMedUfullstendigRelasjon", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        queryOptionsPerCall.length = 0;
    });

    it("skiller 401 fra tekniske oppslagsfeil og prøver ikke 401 på nytt", () => {
        const barnIdenter = ["barn-401", "barn-403", "barn-500"];
        mockResultater([
            { isError: true, error: feilMedStatus(401) },
            { isError: true, error: feilMedStatus(403) },
            { isError: true, error: feilMedStatus(500) },
        ]);

        const resultat = useBarnMedUfullstendigRelasjon({
            barnIdenter,
            bidragsmottakerIdent: "bm",
            bidragspliktigIdent: "bp",
            harSak: true,
        });

        expect(resultat.barnMedInnloggingsfeil).toEqual(["barn-401"]);
        expect(resultat.barnMedOppslagsfeil).toEqual(["barn-403", "barn-500"]);

        const query = queryOptionsPerCall[0]?.[0];
        if (!query) throw new Error("Forventet oppsettsalternativer for første spørring");
        const retry = query.retry;
        expect(typeof retry).toBe("function");
        if (typeof retry === "function") {
            expect(retry(0, feilMedStatus(401))).toBe(false);
            expect(retry(0, feilMedStatus(403))).toBe(true);
            expect(retry(0, new Error("network error"))).toBe(true);
            expect(retry(3, new Error("network error"))).toBe(false);
        }
    });

    it("ignorerer utdatert data fra spørringer som nå feiler", () => {
        mockResultater([
            { isError: true, error: feilMedStatus(403), data: relasjon("bm", "bp", "annen") },
            { isError: true, error: feilMedStatus(500), data: relasjon("bm") },
        ]);

        const resultat = useBarnMedUfullstendigRelasjon({
            barnIdenter: ["barn-annen", "barn-ufullstendig"],
            bidragsmottakerIdent: "bm",
            bidragspliktigIdent: "bp",
            harSak: true,
        });

        expect(resultat.barnMedAnnenForelder).toEqual([]);
        expect(resultat.barnMedUfullstendigRelasjon).toEqual([]);
        expect(resultat.barnMedOppslagsfeil).toEqual(["barn-annen", "barn-ufullstendig"]);
    });

    it("klassifiserer relasjoner per barn når oppslagene lykkes", () => {
        mockResultater([
            { isError: false, data: relasjon("bm", "bp") },
            { isError: false, data: relasjon("bm", "bp", "annen") },
            { isError: false, data: relasjon("bm") },
        ]);

        const resultat = useBarnMedUfullstendigRelasjon({
            barnIdenter: ["barn-komplett", "barn-annen", "barn-ufullstendig"],
            bidragsmottakerIdent: "bm",
            bidragspliktigIdent: "bp",
            harSak: true,
        });

        expect(resultat.barnMedAnnenForelder).toEqual(["barn-annen"]);
        expect(resultat.barnMedUfullstendigRelasjon).toEqual(["barn-ufullstendig"]);
        expect(resultat.barnMedOppslagsfeil).toEqual([]);
        expect(resultat.barnMedInnloggingsfeil).toEqual([]);
    });

    it("holder oppslag feilfrie når oppslag er deaktivert eller partene mangler", () => {
        mockResultater([{ isError: false }, { isError: false }]);

        const utenSak = useBarnMedUfullstendigRelasjon({ barnIdenter: ["barn-1", "barn-2"], harSak: false });
        expect(utenSak.barnMedUfullstendigRelasjon).toEqual([]);
        expect(utenSak.barnMedOppslagsfeil).toEqual([]);
        expect(utenSak.barnMedInnloggingsfeil).toEqual([]);

        const utenParter = useBarnMedUfullstendigRelasjon({ barnIdenter: ["barn-1", "barn-2"], harSak: true });
        expect(utenParter.barnMedUfullstendigRelasjon).toEqual(["barn-1", "barn-2"]);
        expect(utenParter.barnMedOppslagsfeil).toEqual([]);
        expect(utenParter.barnMedInnloggingsfeil).toEqual([]);

        const latestQueries = queryOptionsPerCall.at(-1);
        expect(latestQueries?.every((query: TestQueryOptions) => query.enabled === false)).toBe(true);
    });

    it("utelater barn med feilende oppslag fra ufullstendige relasjoner når en part mangler", () => {
        mockResultater([
            { isError: true, error: feilMedStatus(401) },
            { isError: false, data: relasjon("bm") },
        ]);

        const resultat = useBarnMedUfullstendigRelasjon({
            barnIdenter: ["barn-feil", "barn-vellykket"],
            bidragsmottakerIdent: "bm",
            harSak: true,
        });

        expect(resultat.barnMedUfullstendigRelasjon).toEqual(["barn-vellykket"]);
        expect(resultat.barnMedInnloggingsfeil).toEqual(["barn-feil"]);
    });
});
