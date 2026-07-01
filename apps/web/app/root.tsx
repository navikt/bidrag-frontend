import {FaroErrorBoundary} from "@grafana/faro-react";
import {useEffect} from "react";
import {Links, Meta, Outlet, Scripts, ScrollRestoration} from "react-router";
import {QueryClientWrapper} from "~/common/QueryClientWrapper";
import {authMiddleware} from "~/server/auth/auth.middleware.server.ts";
import {userContext} from "~/server/context.ts";
import {getFaro} from "./faro.client";
import "./index.css";
import {Loader} from "@navikt/ds-react";
import {bisysParamsMiddleware} from "~/common/bisys/bisys-params.middleware.ts";
import {ClientOnly} from "~/common/ClientOnly.tsx";
import {AppLayout} from "~/common/header/AppLayout.tsx";
import type {Route} from "./+types/root.ts";

export const middleware = [authMiddleware];
export const clientMiddleware = [bisysParamsMiddleware];

export async function loader({context}: Route.LoaderArgs) {
    const navUser = context.get(userContext);
    return {navUser};
}

export default function App({loaderData}: Route.ComponentProps) {
    const {navUser} = loaderData;

    useEffect(() => {
        if (navUser?.NAVident) {
            getFaro()?.api.setUser({id: navUser.NAVident});
        }
    }, [navUser]);

    return (
        <QueryClientWrapper>
            <FaroErrorBoundary fallback={<ErrorBoundary/>}>
                <AppLayout bruker={navUser}>
                    <ClientOnly fallback={<Loader size="large"/>}>
                        <Outlet/>
                    </ClientOnly>
                </AppLayout>
            </FaroErrorBoundary>
        </QueryClientWrapper>
    );
}

export function Layout({children}: { children: React.ReactNode }) {
    return (
        <html lang="nb">
        <head>
            <meta charSet="utf-8"/>
            <meta
                name="viewport"
                content="width=device-width, initial-scale=1"
            />
            <Meta/>
            <Links/>
        </head>
        <body>
        {children}
        <ScrollRestoration/>
        <Scripts/>
        </body>
        </html>
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
