import { AxiosError, AxiosHeaders } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CustomError } from "../types";
import { beskrivCause } from "./beskrivCause.ts";
import { correlationIdHeader } from "./correlationId.utils.ts";
import { LoggerService } from "./LoggerService";

function stubFetch() {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
}

function lesLogInfo(fetchMock: ReturnType<typeof stubFetch>) {
    const request = fetchMock.mock.calls[0]?.[1];
    if (!request) {
        throw new Error("Forventet ett kall til loggendepunktet");
    }
    return { logInfo: JSON.parse(request.body), headers: request.headers };
}

describe("LoggerService", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it("sender korrelasjons-ID fra feilen til loggendepunktet", async () => {
        const fetchMock = stubFetch();

        await LoggerService.error(
            "Uventet frontend-feil",
            new CustomError("ReactException", "correlation-id", "Uventet frontend-feil"),
        );

        const {  headers } = lesLogInfo(fetchMock);
        expect(headers[correlationIdHeader]).toBe("correlation-id");
    });

    it("bruker pino-nivåene direkte", async () => {
        const fetchMock = stubFetch();
        await LoggerService.warn("Noe rart");
        expect(lesLogInfo(fetchMock).logInfo.level).toBe("warn");
    });

    it("logger tilbakemelding som info med egen hendelsestype", async () => {
        const fetchMock = stubFetch();
        await LoggerService.feedback("Tilbakemelding fra saksbehandler");

        const { logInfo } = lesLogInfo(fetchMock);
        expect(logInfo.level).toBe("info");
        expect(logInfo.context.kind).toBe("feedback");
    });

    it("tar med strukturert context fra kallstedet", async () => {
        const fetchMock = stubFetch();
        await LoggerService.info("Hentet sak", { saksnummer: "123456" });
        expect(lesLogInfo(fetchMock).logInfo.context).toEqual({ saksnummer: "123456" });
    });


    it("holder componentStack atskilt fra stack", async () => {
        const fetchMock = stubFetch();

        await LoggerService.error("React-feil", {
            name: "ReactException",
            message: "React-feil",
            stack: "at fn (app.js:1:2)",
            componentStack: "    at BeløpshistorikkTabell",
        });

        const { logInfo } = lesLogInfo(fetchMock);
        expect(logInfo.error.stack).toBeUndefined();
        expect(logInfo.error.componentStack).toBe("    at BeløpshistorikkTabell");
    });

    it("lekker ikke responsdata eller Authorization-header via cause", async () => {
        const fetchMock = stubFetch();

        const headers = new AxiosHeaders({ Authorization: "Bearer hemmelig-token" });
        const axiosFeil = new AxiosError("Request failed with status code 400", "ERR_BAD_REQUEST", {
            url: "/api/behandling",
            headers,
            data: JSON.stringify({ barnIdent: "12345678901" }),
        } as never);

        await LoggerService.error("Kall feilet", new Error("Ukjent feil", { cause: axiosFeil }));

        const { logInfo } = lesLogInfo(fetchMock);
        const serialisert = JSON.stringify(logInfo);

        expect(logInfo.error.cause).toBe("AxiosError: Request failed with status code 400");
        expect(serialisert).not.toContain("12345678901");
        expect(serialisert).not.toContain("hemmelig-token");
    });

    it("gjør objekt-cause om til typenavn i stedet for innhold", () => {
        expect(beskrivCause({ fnr: "12345678901" })).toBe("[object]");
    });

    it("velter ikke kallstedet når loggkallet feiler", async () => {
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Nettverksfeil")));
        vi.spyOn(console, "error").mockImplementation(() => {});

        await expect(LoggerService.info("Noe")).resolves.toBeUndefined();
    });
});

describe("LoggerService — feilrapportør (Faro)", () => {
    function stubFaro() {
        const pushError = vi.fn();
        vi.stubGlobal("window", { faro: { api: { pushError } } });
        return pushError;
    }

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        stubFetch();
    });

    it("sender ekte Error-instanser videre til window.faro, med melding og correlationId i kontekst", async () => {
        const pushError = stubFaro();

        const feil = new CustomError("ReactException", "correlation-id", "Nettverksfeil");
        await LoggerService.error("Kall feilet", feil);

        expect(pushError).toHaveBeenCalledWith(
            feil,
            expect.objectContaining({
                context: expect.objectContaining({ logMessage: "Kall feilet", correlationId: "correlation-id" }),
            }),
        );
    });

    it("rapporterer ikke objektformede feil uten ekte stack", async () => {
        const pushError = stubFaro();

        await LoggerService.error("Kall feilet", {
            name: "ReactException",
            message: "React-feil",
            stack: "at fn (app.js:1:2)",
        });

        expect(pushError).not.toHaveBeenCalled();
    });

    it("er en no-op når Faro ikke er initialisert", async () => {
        vi.stubGlobal("window", {});

        await expect(LoggerService.error("Kall feilet", new Error("x"))).resolves.toBeUndefined();
    });

    it("velter ikke kallstedet når window.faro.api.pushError selv kaster", async () => {
        vi.stubGlobal("window", {
            faro: {
                api: {
                    pushError: () => {
                        throw new Error("Faro er ikke initialisert");
                    },
                },
            },
        });
        vi.spyOn(console, "error").mockImplementation(() => {});

        await expect(LoggerService.error("Kall feilet", new Error("x"))).resolves.toBeUndefined();
    });
});
