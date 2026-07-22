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
import type { Route } from "./+types/root.ts";

export const middleware = [authMiddleware];
export const clientMiddleware = [bisysParamsMiddleware];

export async function loader({ context }: Route.LoaderArgs) {
    const navUser = context.get(userContext);
    const naisConfig = await getNaisConfig();
    return {
        navUser,
        naisConfig,
        unleashConfig:
            env.UNLEASH_PROXY_URL && env.UNLEASH_PROXY_CLIENT_KEY
                ? {
                      url: env.UNLEASH_PROXY_URL,
                      clientKey: env.UNLEASH_PROXY_CLIENT_KEY,
                  }
                : null,
    };
}

export default function App({ loaderData }: Route.ComponentProps) {
    const { navUser, naisConfig, unleashConfig } = loaderData;
    const unleashClient = useMemo(
        () =>
            new UnleashClient({
                url: unleashConfig?.url ?? "http://localhost",
                clientKey: unleashConfig?.clientKey ?? "local",
                appName: "bidrag-frontend",
                disableRefresh: true,
                disableMetrics: true,
            }),
        [unleashConfig],
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
        if (!unleashConfig) {
            return;
        }

        void unleashClient.start();

        return () => {
            unleashClient.stop();
        };
    }, [unleashClient, unleashConfig]);

    return (
        <QueryClientWrapper>
            <FaroErrorBoundary fallback={(error) => <RootErrorBoundary error={error} />}>
                <FlagProvider unleashClient={unleashClient} startClient={false}>
                    <AppLayout bruker={navUser}>
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
