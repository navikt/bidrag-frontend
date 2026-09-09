import { beforeEach, describe, expect, it, vi } from "vitest";
import { CustomError } from "../types";
import { SecureLoggerService } from "./SecureLoggerService";

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
    return JSON.parse(request.body);
}

describe("SecureLoggerService", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("sender til /log/secure", async () => {
        const fetchMock = stubFetch();
        await SecureLoggerService.info("Hemmelig hendelse");

        expect(fetchMock).toHaveBeenCalledWith("/log/secure", expect.anything());
    });

    it("fjerner stack fra nettleseren, men beholder resten av feilen", async () => {
        const fetchMock = stubFetch();

        await SecureLoggerService.error("Feilet", {
            name: "TypeError",
            message: "x er undefined",
            stack: "at fn (app.js:1:2)",
            componentStack: "    at BeløpshistorikkTabell",
        });

        const logInfo = lesLogInfo(fetchMock);
        expect(logInfo.error.stack).toBeUndefined();
        expect(logInfo.error.name).toBe("TypeError");
        expect(logInfo.error.componentStack).toBe("    at BeløpshistorikkTabell");
    });

    it("rapporterer aldri til telemetri, selv om Faro er initialisert", async () => {
        stubFetch();
        const pushError = vi.fn();
        vi.stubGlobal("window", { faro: { api: { pushError } } });

        await SecureLoggerService.error(
            "Sensitiv feil",
            new CustomError("Feil", "correlation-id", "Skal ikke til Faro"),
        );

        expect(pushError).not.toHaveBeenCalled();
    });
});
