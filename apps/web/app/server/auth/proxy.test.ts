import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    authTokenContext: Symbol("authTokenContext"),
    debug: vi.fn(),
    getApiConfig: vi.fn(),
    getOnBehalfOfToken: vi.fn(),
}));

vi.mock("~/api.env.ts", () => ({ getApiConfig: mocks.getApiConfig }));
vi.mock("~/server/auth/auth.context.ts", () => ({ authTokenContext: mocks.authTokenContext }));
vi.mock("~/server/auth/auth.utils.server.ts", () => ({ getOnBehalfOfToken: mocks.getOnBehalfOfToken }));
vi.mock("~/server/logger/navLogger.ts", () => ({ navLogger: { debug: mocks.debug } }));

describe("proxy", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.getApiConfig.mockReturnValue({ audience: "api://backend", url: "https://backend.example/api" });
        mocks.getOnBehalfOfToken.mockResolvedValue("obo-token");
    });

    async function proxyRequest(request: Request) {
        const { loader } = await import("./proxy.ts");
        return loader({
            params: { app: "bidrag-sak" },
            request,
            context: new Map([[mocks.authTokenContext, "user-token"]]),
        } as never);
    }

    it("videresender klientens korrelasjons-ID til backend, respons og logg", async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            new Response("ok", {
                headers: { "X-Correlation-ID": "backend-id", "X-Backend-Header": "behold" },
            }),
        );
        vi.stubGlobal("fetch", fetchMock);

        const response = await proxyRequest(
            new Request("http://frontend/proxy/bidrag-sak/vedtak", {
                headers: { "X-Correlation-ID": "client-id" },
            }),
        );

        const backendRequest = fetchMock.mock.calls[0]?.[1];
        expect(new Headers(backendRequest?.headers).get("X-Correlation-ID")).toBe("client-id");
        expect(response.headers.get("X-Correlation-ID")).toBe("client-id");
        expect(response.headers.get("X-Backend-Header")).toBe("behold");
        expect(await response.text()).toBe("ok");
        expect(mocks.debug).toHaveBeenCalledWith(
            expect.objectContaining({ app: "bidrag-sak", callId: "client-id", method: "GET", status: 200 }),
            "Proxy request completed",
        );
    });

    it("genererer en kort URL-sikker ID når klienten ikke sender en", async () => {
        const fetchMock = vi.fn().mockResolvedValue(new Response("ok"));
        vi.stubGlobal("fetch", fetchMock);

        const response = await proxyRequest(new Request("http://frontend/proxy/bidrag-sak/vedtak"));
        const correlationId = response.headers.get("X-Correlation-ID");

        expect(correlationId).toMatch(/^[0-9A-Z]{5}-[0-9A-Z]{5}$/);
        const backendRequest = fetchMock.mock.calls[0]?.[1];
        expect(new Headers(backendRequest?.headers).get("X-Correlation-ID")).toBe(correlationId);
        expect(mocks.debug).toHaveBeenCalledWith(
            expect.objectContaining({ callId: correlationId }),
            "Proxy request completed",
        );
    });
});
