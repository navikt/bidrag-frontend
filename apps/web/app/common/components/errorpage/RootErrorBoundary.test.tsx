import { CustomError } from "@bidrag/common";
import { UNSAFE_ErrorResponseImpl as ErrorResponseImpl } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RootErrorBoundary from "./RootErrorBoundary.tsx";

const mocks = vi.hoisted(() => ({
    loggerError: vi.fn(),
}));

vi.mock("@bidrag/common", async () => {
    const faktisk = await vi.importActual<typeof import("@bidrag/common")>("@bidrag/common");
    return {
        ...faktisk,
        LoggerService: { ...faktisk.LoggerService, error: mocks.loggerError },
    };
});

function sisteLoggkall() {
    const kall = mocks.loggerError.mock.calls.at(-1);
    if (!kall) {
        throw new Error("Forventet at LoggerService.error ble kalt");
    }
    const [message, error, context] = kall as [string, Error | undefined, Record<string, unknown>];
    return { message, error, context };
}

describe("RootErrorBoundary", () => {
    beforeEach(() => {
        mocks.loggerError.mockClear();
    });

    it("setter componentStack på error-objektet og logger det når children fanges", () => {
        const boundary = new RootErrorBoundary({ bruker: null, children: null });
        const error = new Error("Render-feil");

        boundary.componentDidCatch(error, { componentStack: "    at BeløpshistorikkTabell" });

        const { error: loggetError, context } = sisteLoggkall();
        expect((loggetError as Error & { componentStack?: string }).componentStack).toBe(
            "    at BeløpshistorikkTabell",
        );
        expect(context.correlationId).toEqual(expect.any(String));
    });

    it("logger error-prop når komponenten mottar error direkte (rute-nivå)", () => {
        const feil = new CustomError("ReactException", "correlation-id-fra-feilen", "Loader feilet");
        const boundary = new RootErrorBoundary({ bruker: null, error: feil });

        boundary.componentDidMount();

        const { message, context } = sisteLoggkall();
        expect(message).toBe("Loader feilet");
        expect(context.correlationId).toBe("correlation-id-fra-feilen");
        expect(context.status).toBe(500);
    });

    it("logger ikke samme feil to ganger ved påfølgende componentDidUpdate", () => {
        const feil = new CustomError("ReactException", "correlation-id-fra-feilen", "Loader feilet");
        const boundary = new RootErrorBoundary({ bruker: null, error: feil });

        boundary.componentDidMount();
        boundary.componentDidUpdate();

        expect(mocks.loggerError).toHaveBeenCalledTimes(1);
    });

    it("bruker samme correlationId til visning (render) som til logging", () => {
        const feil = new Error("Ukjent feil uten egen correlationId");
        const boundary = new RootErrorBoundary({ bruker: null, error: feil });

        boundary.componentDidMount();
        const { context } = sisteLoggkall();
        const loggetCorrelationId = context.correlationId;

        const element = boundary.render() as { props: { children: unknown } };
        // ErrorPage rendres innenfor QueryClientWrapper > AppLayout; naviger ned til ErrorPage sin prop.
        const errorPageElement = (
            (element.props.children as { props: { children: unknown } }).props.children as {
                props: { feil: { correlationId: string } };
            }
        ).props;

        expect(errorPageElement.feil.correlationId).toBe(loggetCorrelationId);
    });

    it("beholder stacktrace og status når feilen er en ErrorResponse (uventet loader/action-feil)", () => {
        // React Router pakker en uventet feil i loader/action inn i en ErrorResponse
        // (ErrorResponseImpl), ikke en ren Error. Den opprinnelige feilen — med full
        // stacktrace — er bevart på det private `.error`-feltet.
        const opprinneligFeil = new Error("Kunne ikke hente sak");
        const routeErrorResponse = new ErrorResponseImpl(500, "Internal Server Error", opprinneligFeil, true);

        const boundary = new RootErrorBoundary({ bruker: null, error: routeErrorResponse });
        boundary.componentDidMount();

        const { message, error: loggetError, context } = sisteLoggkall();
        expect(message).toBe("Kunne ikke hente sak");
        expect(loggetError).toBe(opprinneligFeil);
        expect(context.status).toBe(500);
        expect(context.name).toBe("Error");
    });

    it("faller tilbake til status/statusText for en ErrorResponse uten bevart Error (f.eks. 404)", () => {
        const routeErrorResponse = new ErrorResponseImpl(404, "Not Found", "Fant ingen sak med saksnummer 123456");

        const boundary = new RootErrorBoundary({ bruker: null, error: routeErrorResponse });
        boundary.componentDidMount();

        const { message, error: loggetError, context } = sisteLoggkall();
        expect(message).toBe("Fant ingen sak med saksnummer 123456");
        expect(loggetError).toBeUndefined();
        expect(context.status).toBe(404);
        expect(context.name).toBe("RouteErrorResponse");
    });
});
