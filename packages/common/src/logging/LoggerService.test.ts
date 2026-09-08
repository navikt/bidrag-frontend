import { beforeEach, describe, expect, it, vi } from "vitest";
import { CustomError } from "../types";
import { correlationIdHeader } from "../utils";
import { LoggerService } from "./LoggerService";

describe("LoggerService", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it("sender korrelasjons-ID fra feilen til loggendepunktet", async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ exceptionCode: "exception", errorCode: "error" }), {
                headers: { "Content-Type": "application/json" },
            }),
        );
        vi.stubGlobal("fetch", fetchMock);

        await LoggerService.error(
            "Uventet frontend-feil",
            new CustomError("ReactException", "correlation-id", "Uventet frontend-feil"),
        );

        const request = fetchMock.mock.calls[0]?.[1];
        if (!request) {
            throw new Error("Forventet ett kall til loggendepunktet");
        }
        const logInfo = JSON.parse(request.body);
        expect(request.headers[correlationIdHeader]).toBe("correlation-id");
        expect(logInfo.correlationId).toBe("correlation-id");
        expect(logInfo.error.correlationId).toBe("correlation-id");
    });
});
