import { Links, Meta, Outlet, Scripts, ScrollRestoration, useRouteLoaderData } from "react-router";
import { useEffect } from "react";
import "@navikt/ds-css";
import { AppLayout } from "@bidrag/ui";
import { FaroErrorBoundary } from "@grafana/faro-react";
import { authMiddleware } from "~/auth/auth.middleware.server.ts";
import type { Route } from "../.react-router/types/app/+types/root.ts";
import { userContext } from "~/context.ts";
import { initFaro, getFaro } from "./faro.client";
import { QueryClientWrapper } from "~/common/QueryClientWrapper";

export const middleware = [authMiddleware];

export async function loader({ request, context }: Route.LoaderArgs) {
    const user = context.get(userContext);
    return {
        user,
        faroConfig: { appName: process.env.NAIS_APP_NAME ?? "" },
    };
}

export function Layout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="nb">
            <head>
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

export default function App() {
    const data = useRouteLoaderData<typeof loader>("root");

    useEffect(() => {
        if (data?.faroConfig) {
            initFaro(data.faroConfig);
        }
    }, [data?.faroConfig]);

    useEffect(() => {
        if (data?.user?.NAVident) {
            getFaro()?.api.setUser({ id: data.user.NAVident });
        }
    }, [data?.user?.NAVident]);

    return (
        <QueryClientWrapper>
            <FaroErrorBoundary fallback={<div>Noe gikk galt</div>}>
                <AppLayout brukerNavn={data?.user?.name}>
                    <Outlet />
                </AppLayout>
            </FaroErrorBoundary>
        </QueryClientWrapper>
    );
}

export function ErrorBoundary() {
    return (
        <AppLayout>
            <div role="alert">
                <h1>Noe gikk galt</h1>
                <p>Det oppsto en uventet feil. Prøv å laste siden på nytt.</p>
            </div>
        </AppLayout>
    );
}
