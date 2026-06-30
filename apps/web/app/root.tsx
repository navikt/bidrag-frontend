import { Links, Meta, Outlet, Scripts, ScrollRestoration, useRouteLoaderData } from "react-router";
import { useEffect } from "react";
import { FaroErrorBoundary } from "@grafana/faro-react";
import { authMiddleware } from "~/server/auth/auth.middleware.server.ts";
import type { Route } from "+/+types/root.ts";
import { userContext } from "~/server/context.ts";
import { getFaro } from "./faro.client";
import { QueryClientWrapper } from "~/common/QueryClientWrapper";
import "./index.css";
import {bisysParamsMiddleware} from "~/common/bisys/bisys-params.middleware.ts";
import {AppLayout} from "~/common/header/AppLayout.tsx";

export const middleware = [authMiddleware];
export const clientMiddleware = [bisysParamsMiddleware];

export async function loader({ context }: Route.LoaderArgs) {
    const user = context.get(userContext);
    return { user };
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
        if (data?.user?.NAVident) {
            getFaro()?.api.setUser({ id: data.user.NAVident });
        }
    }, [data?.user?.NAVident]);

    return (
        <QueryClientWrapper>
            <FaroErrorBoundary fallback={<ErrorBoundary />}>
                <AppLayout bruker={data?.user}>
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
