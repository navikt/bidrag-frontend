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

        const { logInfo, headers } = lesLogInfo(fetchMock);
        expect(headers[correlationIdHeader]).toBe("correlation-id");
        expect(logInfo.correlationId).toBe("correlation-id");
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

    it("beholder én stacktrace, ikke tre sammenlimte", async () => {
        const fetchMock = stubFetch();
        const feil = new Error("Feilet");
        feil.stack = "Error: Feilet\n    at fn (app.js:1:2)";

        await LoggerService.error("Feilet", feil);

        const { logInfo } = lesLogInfo(fetchMock);
        expect(logInfo.error.stack).toBe(feil.stack);
        expect(logInfo.error.stack_trace).toBeUndefined();
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
        expect(logInfo.error.stack).toBe("at fn (app.js:1:2)");
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
