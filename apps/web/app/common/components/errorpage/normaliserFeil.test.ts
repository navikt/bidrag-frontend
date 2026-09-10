import type { ProblemDetail } from "@bidrag/api";
import { ApiError, CustomError } from "@bidrag/common";
import { AxiosError } from "axios";
import { UNSAFE_ErrorResponseImpl as ErrorResponseImpl } from "react-router";
import { describe, expect, it } from "vitest";
import { normaliserFeil } from "./normaliserFeil.ts";

function axiosFeil(opts: {
    status?: number;
    statusText?: string;
    problemDetail?: ProblemDetail;
    correlationId?: string;
    message?: string;
}): AxiosError<ProblemDetail> {
    const headers = opts.correlationId ? { "x-correlation-id": opts.correlationId } : {};
    const response =
        opts.status !== undefined
            ? {
                  status: opts.status,
                  statusText: opts.statusText ?? "",
                  data: opts.problemDetail ?? {},
                  headers,
                  config: {} as never,
              }
            : undefined;

    return new AxiosError(opts.message ?? "Request failed", "ERR_BAD_REQUEST", undefined, undefined, response);
}

describe("normaliserFeil", () => {
    it("normaliserer en ren Error generisk", () => {
        const error = new Error("Noe gikk galt");

        const feil = normaliserFeil(error);

        expect(feil.message).toBe("Noe gikk galt");
        expect(feil.name).toBe("Error");
        expect(feil.status).toBe(500);
        expect(feil.realError).toBe(error);
        expect(feil.stackTrace).toBe(error.stack);
        expect(feil.correlationId).toEqual(expect.any(String));
    });

    it("normaliserer ukjent input (null/objekt) til 'Ukjent feil'", () => {
        for (const ukjent of [null, { foo: "bar" }, undefined]) {
            const feil = normaliserFeil(ukjent);
            expect(feil.message).toBe("Ukjent feil");
            expect(feil.name).toBe("UnknownError");
            expect(feil.status).toBe(500);
            expect(feil.realError).toBeUndefined();
        }
    });

    it("bruker en streng direkte som melding når feilen er en ren string", () => {
        const feil = normaliserFeil("Fant ingen sak med saksnummer 123456");

        expect(feil.message).toBe("Fant ingen sak med saksnummer 123456");
        expect(feil.name).toBe("Error");
        expect(feil.status).toBe(500);
        expect(feil.realError).toBeUndefined();
        expect(feil.correlationId).toEqual(expect.any(String));
    });

    it("behandler en tom streng som ukjent feil (ikke en gyldig melding)", () => {
        const feil = normaliserFeil("");
        expect(feil.message).toBe("Ukjent feil");
        expect(feil.name).toBe("UnknownError");
    });

    it("tar med componentStack fra feilobjektet uendret, uavhengig av feiltype", () => {
        const error = Object.assign(new Error("Render-feil"), { componentStack: "    at BeløpshistorikkTabell" });
        const feil = normaliserFeil(error);
        expect(feil.componentStack).toBe("    at BeløpshistorikkTabell");
    });

    describe("CustomError-familien", () => {
        it("bruker CustomError sin egen status og correlationId", () => {
            const feil = normaliserFeil(
                new CustomError("ReactException", "correlation-id-fra-feilen", "Loader feilet"),
            );

            expect(feil.message).toBe("Loader feilet");
            expect(feil.name).toBe("ReactException");
            expect(feil.status).toBe(500);
            expect(feil.correlationId).toBe("correlation-id-fra-feilen");
        });

        it("subklasse av CustomError (arver status/message-mønster) normaliseres på samme måte", () => {
            class LokalTestFeil extends CustomError {
                constructor(message: string) {
                    super("LokalTestFeil", null, message);
                }
            }

            const feil = normaliserFeil(new LokalTestFeil("Ugyldig input fra bruker"));

            expect(feil.message).toBe("Ugyldig input fra bruker");
            expect(feil.name).toBe("LokalTestFeil");
            expect(feil.status).toBe(500);
        });

        it("ApiError bruker egen message/status når de er satt, ikke .error", () => {
            const bevartAxiosFeil = axiosFeil({
                status: 404,
                problemDetail: { detail: "Fra bevart feil, skal ikke brukes" },
            });
            const apiError = new ApiError("Kunne ikke hente sak", "", "correlation-fra-apierror", 502, bevartAxiosFeil);

            const feil = normaliserFeil(apiError);

            expect(feil.message).toBe("Kunne ikke hente sak");
            expect(feil.status).toBe(502);
            expect(feil.correlationId).toBe("correlation-fra-apierror");
        });

        it("ApiError faller tilbake til .error sin message når egen message mangler", () => {
            const bevartAxiosFeil = axiosFeil({
                status: 404,
                problemDetail: { detail: "Detalj fra bevart feil" },
                message: "Detalj fra bevart feil",
            });
            const apiError = new ApiError("", "", undefined, 502, bevartAxiosFeil);

            const feil = normaliserFeil(apiError);

            expect(feil.message).toBe("Detalj fra bevart feil");
        });
    });

    describe("AxiosError", () => {
        it("bruker ProblemDetail.detail (RFC 7807) som melding når den finnes", () => {
            const error = axiosFeil({
                status: 404,
                statusText: "Not Found",
                problemDetail: { detail: "Fant ingen sak med saksnummer 123456", status: 404 },
                correlationId: "correlation-fra-header",
            });

            const feil = normaliserFeil(error);

            expect(feil.message).toBe("Fant ingen sak med saksnummer 123456");
            expect(feil.status).toBe(404);
            expect(feil.correlationId).toBe("correlation-fra-header");
            expect(feil.realError).toBe(error);
            expect(feil.stackTrace).toBe(error.stack);
        });

        it("faller tilbake til error.message når ProblemDetail.detail mangler", () => {
            const error = axiosFeil({ status: 500, message: "Request failed with status code 500" });

            const feil = normaliserFeil(error);

            expect(feil.message).toBe("Request failed with status code 500");
            expect(feil.status).toBe(500);
        });

        it("bruker status 500 ved nettverksfeil (ingen response i det hele tatt)", () => {
            const error = axiosFeil({ message: "Network Error" });

            const feil = normaliserFeil(error);

            expect(feil.message).toBe("Network Error");
            expect(feil.status).toBe(500);
            expect(feil.correlationId).toEqual(expect.any(String));
        });
    });

    describe("ErrorResponse (React Router)", () => {
        it("rekursiverer inn i bevart Error og beholder stacktrace", () => {
            const opprinneligFeil = new Error("Kunne ikke hente sak");
            const routeError = new ErrorResponseImpl(500, "Internal Server Error", opprinneligFeil, true);

            const feil = normaliserFeil(routeError);

            expect(feil.message).toBe("Kunne ikke hente sak");
            expect(feil.realError).toBe(opprinneligFeil);
            expect(feil.stackTrace).toBe(opprinneligFeil.stack);
            expect(feil.status).toBe(500);
            expect(feil.name).toBe("Error");
        });

        it("rekursiverer inn i bevart AxiosError og bruker ProblemDetail.detail", () => {
            const bevartAxiosFeil = axiosFeil({
                status: 404,
                problemDetail: { detail: "Fant ingen sak" },
                correlationId: "correlation-fra-axios",
            });
            const routeError = new ErrorResponseImpl(404, "Not Found", bevartAxiosFeil, true);

            const feil = normaliserFeil(routeError);

            expect(feil.message).toBe("Fant ingen sak");
            expect(feil.status).toBe(404);
            expect(feil.correlationId).toBe("correlation-fra-axios");
            expect(feil.realError).toBe(bevartAxiosFeil);
        });

        it("faller tilbake til status/statusText/data når ingen feil er bevart", () => {
            const routeError = new ErrorResponseImpl(404, "Not Found", "Fant ingen sak med saksnummer 123456");

            const feil = normaliserFeil(routeError);

            expect(feil.message).toBe("Fant ingen sak med saksnummer 123456");
            expect(feil.realError).toBeUndefined();
            expect(feil.status).toBe(404);
            expect(feil.name).toBe("RouteErrorResponse");
        });

        it("genererer en correlationId når verken RouteError eller en bevart feil har egen", () => {
            const routeError = new ErrorResponseImpl(404, "Not Found", "Fant ingen sak med saksnummer 123456");

            const feil = normaliserFeil(routeError);

            expect(feil.correlationId).toEqual(expect.any(String));
            expect(feil.correlationId.length).toBeGreaterThan(0);
        });

        it("genererer en correlationId når en bevart Error mangler egen correlationId", () => {
            const opprinneligFeil = new Error("Kunne ikke hente sak");
            const routeError = new ErrorResponseImpl(500, "Internal Server Error", opprinneligFeil, true);

            const feil = normaliserFeil(routeError);

            expect(feil.correlationId).toEqual(expect.any(String));
            expect(feil.correlationId.length).toBeGreaterThan(0);
        });
    });

    it("genererer ikke nødvendigvis samme correlationId ved gjentatte kall uten egen correlationId (memoisering er boundary sitt ansvar)", () => {
        const error = new Error("Uten egen correlationId");

        const første = normaliserFeil(error);
        const andre = normaliserFeil(error);

        expect(første.correlationId).toEqual(expect.any(String));
        expect(andre.correlationId).toEqual(expect.any(String));
    });
});
