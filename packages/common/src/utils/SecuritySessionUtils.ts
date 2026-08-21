// import { context, propagation, Span, trace } from "@opentelemetry/api";
import { context } from "@opentelemetry/api";
import { v4 as uuidV4 } from "uuid";

import { SessionStorage } from "./Storage";

const _tracerName = "bidrag-ui-session";

interface RequestTraceContext {
    correlationId: string;
    headers: Record<string, string>;
    // span: Span;
}

export class SecuritySessionUtils {
    // static async hentSecuritySessionTokenFromBackend() {
    //     const tokenReq = await fetch("/session", { method: "GET" });
    //     return (await tokenReq.json()).id_token;
    // }
    //
    // static async isLoggedIn(): Promise<boolean> {
    //     return fetch("/me", { method: "GET" })
    //         .then((res) => res.status == 200)
    //         .catch(() => false);
    // }

    // @deprecated
    static async getSecurityTokenForApp(app: string, cluster?: string, scope?: string) {
        const tokenReq = await fetch("/token", {
            method: "POST",
            body: JSON.stringify({ app, cluster, scope }),
            headers: { "Content-type": "application/json; charset=UTF-8" },
        });
        return await tokenReq.text();
    }

    static getCorrelationId(): string {
        return SessionStorage.getOrDefault("traceparent", `${SecuritySessionUtils.getAppName()}/${uuidV4()}`);
    }

    static createRequestTrace(_spanName: string): RequestTraceContext {
        // const tracer = trace.getTracer(tracerName);

        // context er fra @opentelemetry/api — aktiveres når OTel-integrasjonen tas i bruk
        const _parentContext = window.__otelSessionContext || context.active();

        // const span = tracer.startSpan(spanName, undefined, parentContext);
        // const traceContext = trace.setSpan(parentContext, span);
        const headers: Record<string, string> = {};

        // propagation.inject(traceContext, headers);

        return {
            correlationId: headers.traceparent ?? SecuritySessionUtils.getCorrelationId(),
            headers,
            // span,
        };
    }

    static getAppModuleName() {
        // if (window.appName) {
        //     return `${window.appName}/${window.moduleName ?? "ukjent"}`;
        // }
        return "bidrag-ui";
    }

    static getAppName() {
        return "bidrag-frontend";
    }

    static async getSession(): Promise<SessionResponse> {
        return {
            user_id: "",
            correlation_id: SecuritySessionUtils.getCorrelationId(),
        };
    }

    static async hentSaksbehandler(): Promise<NavUser | undefined> {
        const response = await fetch("/me", { method: "GET", headers: { Accept: "application/json" } });

        // Ved utløpt sesjon redirecter Wonderwall til innloggingssiden. fetch følger
        // redirecten, så vi må sjekke innholdstypen og ikke bare response.ok.
        if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) {
            return undefined;
        }

        return (await response.json()) as NavUser;
    }

    static async hentSaksbehandlerNavn(): Promise<string | undefined> {
        return (await SecuritySessionUtils.hentSaksbehandler())?.name;
    }

    static async hentSaksbehandlerId(): Promise<string | undefined> {
        return (await SecuritySessionUtils.hentSaksbehandler())?.NAVident;
    }
}

/** Innlogget saksbehandler slik /me returnerer den. */
export interface NavUser {
    NAVident: string;
    name: string;
    username: string;
}

interface SessionResponse {
    user_id: string;
    correlation_id: string;
}
