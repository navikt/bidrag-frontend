import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    authTokenContext: Symbol("authTokenContext"),
    debug: vi.fn(),
    trace: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    getApiConfig: vi.fn(),
    getOnBehalfOfToken: vi.fn(),
}));

vi.mock("~/api.env.ts", () => ({ getApiConfig: mocks.getApiConfig }));
vi.mock("~/server/auth/auth.context.ts", () => ({ authTokenContext: mocks.authTokenContext }));
vi.mock("~/server/auth/auth.utils.server.ts", () => ({ getOnBehalfOfToken: mocks.getOnBehalfOfToken }));
vi.mock("~/server/logger/navLogger.ts", () => ({
    navLogger: { debug: mocks.debug, trace: mocks.trace, warn: mocks.warn, error: mocks.error },
}));

import { kjørMedLoggerKontekst } from "~/server/logger/loggerContext.ts";

describe("proxy", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.getApiConfig.mockReturnValue({ audience: "api://backend", url: "https://backend.example/api" });
        mocks.getOnBehalfOfToken.mockResolvedValue("obo-token");
    });

    /** Middleware har normalt åpnet konteksten før proxyen kjører. */
    async function proxyRequest(request: Request, correlationId = "ABCDE-12345") {
        const { loader } = await import("./proxy.ts");

        return kjørMedLoggerKontekst({ correlationId, user: "Z994321" }, () =>
            loader({
                params: { app: "bidrag-sak" },
                request,
                context: new Map([[mocks.authTokenContext, "user-token"]]),
            } as never),
        );
    }

    it("videresender korrelasjons-ID fra konteksten til backend og respons", async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            new Response("ok", {
                headers: { "X-Correlation-ID": "backend-id", "X-Backend-Header": "behold" },
            }),
        );
        vi.stubGlobal("fetch", fetchMock);

        const response = await proxyRequest(new Request("http://frontend/proxy/bidrag-sak/vedtak"), "KLIEN-T0001");

        const backendRequest = fetchMock.mock.calls[0]?.[1];
        expect(new Headers(backendRequest?.headers).get("X-Correlation-ID")).toBe("KLIEN-T0001");
        expect(response.headers.get("X-Correlation-ID")).toBe("KLIEN-T0001");
        expect(response.headers.get("X-Backend-Header")).toBe("behold");
        expect(await response.text()).toBe("ok");
        expect(mocks.trace).toHaveBeenCalledWith(
            expect.objectContaining({ app: "bidrag-sak", method: "GET", status: 200 }),
            "Proxy-kall fullført",
        );
    });

    it("genererer en gyldig ID når proxyen kalles uten kontekst", async () => {
        const fetchMock = vi.fn().mockResolvedValue(new Response("ok"));
        vi.stubGlobal("fetch", fetchMock);

        const { loader } = await import("./proxy.ts");
        const response = (await loader({
            params: { app: "bidrag-sak" },
            request: new Request("http://frontend/proxy/bidrag-sak/vedtak"),
            context: new Map([[mocks.authTokenContext, "user-token"]]),
        } as never)) as Response;

        const correlationId = response.headers.get("X-Correlation-ID");
        expect(correlationId).toMatch(/^[0-9A-Z]{5}-[0-9A-Z]{5}$/);

        const backendRequest = fetchMock.mock.calls[0]?.[1];
        expect(new Headers(backendRequest?.headers).get("X-Correlation-ID")).toBe(correlationId);
    });

    it("logger og beholder korrelasjons-ID når backend-kallet feiler", async () => {
        const fetchMock = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));
        vi.stubGlobal("fetch", fetchMock);

        const feil = await proxyRequest(new Request("http://frontend/proxy/bidrag-sak/vedtak"), "KLIEN-T0001").catch(
            (thrown: unknown) => thrown,
        );

        expect(feil).toBeInstanceOf(Response);
        expect((feil as Response).headers.get("X-Correlation-ID")).toBe("KLIEN-T0001");
        expect(mocks.error).toHaveBeenCalledWith(expect.objectContaining({ app: "bidrag-sak" }), "Proxy-kall feilet");
    });
});
