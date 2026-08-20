import { FaroErrorBoundary } from "@grafana/faro-react";
import { FlagProvider } from "@unleash/proxy-client-react";
import { useEffect, useMemo } from "react";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { UnleashClient } from "unleash-proxy-client";
import { QueryClientWrapper } from "~/common/QueryClientWrapper";
import { env } from "~/env.server.ts";
import { authMiddleware } from "~/server/auth/auth.middleware.server.ts";
import { userContext } from "~/server/context.ts";
import { getNaisConfig } from "~/server/naisConfig.server.ts";
import { getFaro, initFaro } from "./faro.client";
import "./index.css";
import { Loader } from "@navikt/ds-react";
import { bisysParamsMiddleware } from "~/common/bisys/bisys-params.middleware.ts";
import { ClientOnly } from "~/common/ClientOnly.tsx";
import ErrorPage from "~/common/components/errorpage/ErrorPage.tsx";
import { AppLayout } from "~/common/header/AppLayout.tsx";
import { UnleashContextUpdater } from "~/common/unleash/UnleashContextUpdater.tsx";
import type { Route } from "./+types/root.ts";
import faviconUrl from "./assets/bisys_favicon.ico";

export const middleware = [authMiddleware];
export const clientMiddleware = [bisysParamsMiddleware];

export async function loader({ context }: Route.LoaderArgs) {
    const navUser = context.get(userContext);
    const naisConfig = await getNaisConfig();
    return {
        navUser,
        naisConfig,
        bisysUrl: env.BISYS_URL,
    };
}

/** Klienten snakker med vår egen server-side Unleash-proxy, ikke Unleash direkte. */
const UNLEASH_PROXY_PATH = "/unleash/proxy";

export default function App({ loaderData }: Route.ComponentProps) {
    const { navUser, naisConfig, bisysUrl } = loaderData;
    const unleashClient = useMemo(
        () =>
            new UnleashClient({
                url:
                    typeof window === "undefined"
                        ? `http://localhost${UNLEASH_PROXY_PATH}`
                        : `${window.location.origin}${UNLEASH_PROXY_PATH}`,
                // Proxyen autentiseres med saksbehandlerens sesjon, ikke med clientKey
                clientKey: "bidrag-frontend",
                appName: "bidrag-frontend",
                disableMetrics: true,
            }),
        [],
    );

    useEffect(() => {
        initFaro(naisConfig);
    }, [naisConfig]);

    useEffect(() => {
        if (navUser?.NAVident) {
            getFaro()?.api.setUser({ id: navUser.NAVident });
        }
    }, [navUser]);

    useEffect(() => {
        void unleashClient.start();

        return () => {
            unleashClient.stop();
        };
    }, [unleashClient]);

    return (
        <QueryClientWrapper>
            <FaroErrorBoundary fallback={(error) => <RootErrorBoundary error={error} />}>
                <FlagProvider unleashClient={unleashClient} startClient={false}>
                    <UnleashContextUpdater />
                    <AppLayout bruker={navUser} bisysUrl={bisysUrl}>
                        <ClientOnly fallback={<Loader size="large" />}>
                            <Outlet />
                        </ClientOnly>
                    </AppLayout>
                </FlagProvider>
            </FaroErrorBoundary>
        </QueryClientWrapper>
    );
}

export function Layout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="nb">
            <head>
                <title>Bidrag</title>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href={faviconUrl} type="image/x-icon" />
                <Meta />
                <Links />
            </head>
            <body>
                {children}
                <ScrollRestoration />
                <Scripts />
            </body>
        </html>
    );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
    return <RootErrorBoundary error={error} />;
}

function RootErrorBoundary({ error }: { error: unknown }) {
    return (
        <QueryClientWrapper>
            <AppLayout>
                <ErrorPage error={error} />
            </AppLayout>
        </QueryClientWrapper>
    );
}
