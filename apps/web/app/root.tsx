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
import { serverUnleashContext } from "~/server/unleash/featureToggles.server.ts";
import { evaluerAlleToggles } from "~/server/unleash/unleash.server.ts";
import { getFaro, initFaro } from "./faro.client";
import "./index.css";
import { BidragProgressbarFullScreen, type NavUser } from "@bidrag/common";
import { bisysParamsMiddleware } from "~/common/bisys/bisys-params.middleware.ts";
import { ClientOnly } from "~/common/ClientOnly.tsx";
import ErrorPage from "~/common/components/errorpage/ErrorPage.tsx";
import { AppLayout } from "~/common/header/AppLayout.tsx";
import { UnleashContextUpdater } from "~/common/unleash/UnleashContextUpdater.tsx";
import type { Route } from "./+types/root.ts";
import faviconUrl from "./assets/bisys_favicon.ico";

export const middleware = [authMiddleware];
export const clientMiddleware = [bisysParamsMiddleware];

export async function loader({ context, request }: Route.LoaderArgs) {
    const navUser = context.get(userContext);
    const naisConfig = await getNaisConfig();
    const url = new URL(request.url);

    // Evaluerer toggles på serveren, slik at riktig verdi finnes allerede ved første
    // render. Uten dette ville useFlag returnert false til proxy-fetchen var ferdig.
    const unleashToggles = await evaluerAlleToggles(
        serverUnleashContext({
            bruker: navUser,
            saksnummer: url.pathname.match(/\/sak\/([^/]+)/)?.[1],
            enhet: url.searchParams.get("enhet") ?? undefined,
        }),
    );

    return {
        navUser,
        naisConfig,
        unleashToggles,
        bisysUrl: env.BISYS_URL,
    };
}

/** Klienten snakker med vår egen server-side Unleash-proxy, ikke Unleash direkte. */
const UNLEASH_PROXY_PATH = "/unleash/proxy";

export default function App({ loaderData }: Route.ComponentProps) {
    const { navUser, naisConfig, unleashToggles, bisysUrl } = loaderData;
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
                // Verdiene fra serveren gjelder med én gang, og overstyrer det som
                // måtte ligge lagret i nettleseren fra en tidligere sesjon
                bootstrap: unleashToggles,
                bootstrapOverride: true,
            }),
        [unleashToggles],
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
            <FlagProvider unleashClient={unleashClient} startClient={false}>
                <FaroErrorBoundary fallback={(error) => <RootErrorBoundary error={error} bruker={navUser} />}>
                    <UnleashContextUpdater />
                    <AppLayout bruker={navUser} bisysUrl={bisysUrl}>
                        <ClientOnly fallback={<BidragProgressbarFullScreen />}>
                            <Outlet />
                        </ClientOnly>
                    </AppLayout>
                </FaroErrorBoundary>
            </FlagProvider>
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
    return <RootErrorBoundary error={error} bruker={null} />;
}

function RootErrorBoundary({ error, bruker, bisysUrl }: { error: unknown; bruker: NavUser | null; bisysUrl?: string }) {
    return (
        <QueryClientWrapper>
            <AppLayout bruker={bruker} bisysUrl={bisysUrl}>
                <ErrorPage error={error} />
            </AppLayout>
        </QueryClientWrapper>
    );
}
