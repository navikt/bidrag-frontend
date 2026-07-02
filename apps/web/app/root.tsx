import { FaroErrorBoundary } from "@grafana/faro-react";
import { useEffect } from "react";
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useRouteError } from "react-router";
import { QueryClientWrapper } from "~/common/QueryClientWrapper";
import { authMiddleware } from "~/server/auth/auth.middleware.server.ts";
import { userContext } from "~/server/context.ts";
import { getFaro } from "./faro.client";
import "./index.css";
import { Loader } from "@navikt/ds-react";
import { bisysParamsMiddleware } from "~/common/bisys/bisys-params.middleware.ts";
import { ClientOnly } from "~/common/ClientOnly.tsx";
import { AppLayout } from "~/common/header/AppLayout.tsx";
import type { Route } from "./+types/root.ts";
import ErrorPage from "~/common/components/errorpage/ErrorPage.tsx";

export const middleware = [authMiddleware];
export const clientMiddleware = [bisysParamsMiddleware];

export async function loader({ context }: Route.LoaderArgs) {
    const navUser = context.get(userContext);
    return { navUser };
}

export default function App({ loaderData }: Route.ComponentProps) {
    const { navUser } = loaderData;

    useEffect(() => {
        if (navUser?.NAVident) {
            getFaro()?.api.setUser({ id: navUser.NAVident });
        }
    }, [navUser]);

    return (
        <QueryClientWrapper>
            <FaroErrorBoundary fallback={<ErrorBoundary />}>
                <AppLayout bruker={navUser}>
                    <ClientOnly fallback={<Loader size="large" />}>
                        <Outlet />
                    </ClientOnly>
                </AppLayout>
            </FaroErrorBoundary>
        </QueryClientWrapper>
    );
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

export function ErrorBoundary() {
    const error = useRouteError();

    return (
        <QueryClientWrapper>
            <AppLayout>
                <ErrorPage error={error} />
            </AppLayout>
        </QueryClientWrapper>
    );
}
