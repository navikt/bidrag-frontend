import {Links, Meta, Outlet, Scripts, ScrollRestoration} from "react-router";
import {useEffect} from "react";
import {FaroErrorBoundary} from "@grafana/faro-react";
import {authMiddleware} from "~/server/auth/auth.middleware.server.ts";
import {userContext} from "~/server/context.ts";
import {getFaro} from "./faro.client";
import {QueryClientWrapper} from "~/common/QueryClientWrapper";
import "./index.css";
import {bisysParamsMiddleware} from "~/common/bisys/bisys-params.middleware.ts";
import {AppLayout} from "~/common/header/AppLayout.tsx";
import {Loader} from "@navikt/ds-react";
import {ClientOnly} from "~/routes/ClientOnly.tsx";
import {Route} from "./+types/root.ts";
import {NavUser} from "~/server/auth/NavUser.ts";

export const middleware = [authMiddleware];
export const clientMiddleware = [bisysParamsMiddleware];

export async function loader({context}: Route.LoaderArgs) {
    const user = context.get(userContext);
    // TODO flytte token ut av userContext
    const navUser = {...user, token: ""} as NavUser
    const bisysUrl = process.env.BISYS_URL;
    return {navUser, bisysUrl};
}

export default function App({loaderData}: Route.ComponentProps) {
    const {navUser, bisysUrl} = loaderData

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
    )

}

export function Layout({children}: { children: React.ReactNode }) {
    return (
        <html lang="nb">
        <head>
            <meta charSet="utf-8"/>
            <meta name="viewport" content="width=device-width, initial-scale=1"/>
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
