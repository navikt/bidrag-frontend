import {Links, Meta, Outlet, Scripts, ScrollRestoration, useRouteLoaderData} from "react-router";
import "@navikt/ds-css";
import {AppLayout} from "@bidrag/ui";
import {authMiddleware} from "~/auth/auth.middleware.server.ts";
import type {Route} from "../.react-router/types/app/+types/root.ts";
import {userContext} from "~/context.ts";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";

export const middleware = [authMiddleware];


export async function loader({request, context}: Route.LoaderArgs) {
    const user = context.get(userContext);
    return {user};
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

export default function App() {
    const data = useRouteLoaderData<typeof loader>("root");

    return (
        <QueryClientProvider client={new QueryClient()}>
            <AppLayout brukerNavn={data?.user?.name}>
                <Outlet/>
            </AppLayout>
        </QueryClientProvider>
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
