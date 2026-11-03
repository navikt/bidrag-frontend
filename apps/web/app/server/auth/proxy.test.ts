import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { kjørMedLoggerKontekst } from "~/server/logger/loggerContext.ts";
import { loader } from "./proxy.ts";

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
    navCombinedLogger: { debug: mocks.debug, trace: mocks.trace, warn: mocks.warn, error: mocks.error },
}));

describe("proxy", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.getApiConfig.mockReturnValue({ audience: "api://backend", url: "https://backend.example/api" });
        mocks.getOnBehalfOfToken.mockResolvedValue("obo-token");
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    /** Middleware har normalt åpnet konteksten før proxyen kjører. */
    async function proxyRequest(request: Request, correlationId = "ABCDE-12345") {
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
    });

    describe("X-Enhet", () => {
        async function backendHeaders(headers: HeadersInit) {
            const fetchMock = vi.fn().mockResolvedValue(new Response("ok"));
            vi.stubGlobal("fetch", fetchMock);
            await proxyRequest(new Request("http://frontend/proxy/bidrag-sak/vedtak", { headers }));
            return new Headers(fetchMock.mock.calls[0]?.[1]?.headers);
        }

        it("beholder X-Enhet fra klienten", async () => {
            const headers = await backendHeaders({
                "X-Enhet": "4806",
                Referer: "http://frontend/sak/123?enhet=4833",
            });
            expect(headers.get("X-Enhet")).toBe("4806");
        });

        it("henter enhet fra Referer når headeren mangler", async () => {
            const headers = await backendHeaders({ Referer: "http://frontend/sak/123?enhet=4833" });
            expect(headers.get("X-Enhet")).toBe("4833");
        });

        it("setter ikke X-Enhet når Referer mangler enhet eller er ugyldig", async () => {
            expect((await backendHeaders({ Referer: "http://frontend/sak/123" })).has("X-Enhet")).toBe(false);
            expect((await backendHeaders({ Referer: "ikke en url" })).has("X-Enhet")).toBe(false);
        });
    });

    it("genererer en gyldig ID når proxyen kalles uten kontekst", async () => {
        const fetchMock = vi.fn().mockResolvedValue(new Response("ok"));
        vi.stubGlobal("fetch", fetchMock);

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

    it("returnerer 504 med korrelasjons-ID når backend-kallet timer ut", async () => {
        const timeoutError = new DOMException("The operation timed out", "TimeoutError");
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(timeoutError));

        const response = await proxyRequest(new Request("http://frontend/proxy/bidrag-sak/vedtak"), "KLIEN-T0001");

        expect(response.status).toBe(504);
        expect(response.headers.get("X-Correlation-ID")).toBe("KLIEN-T0001");
        expect(await response.text()).toBe("Proxy-kall timeout mot bidrag-sak");
        expect(mocks.error).toHaveBeenCalledWith(
            expect.objectContaining({
                app: "bidrag-sak",
                path: "/vedtak",
                status: 504,
            }),
            "Proxy-kall timeout mot bidrag-sak",
        );
    });
});
