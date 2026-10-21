import { genererFnr } from "@bidrag/common/playwright/testing/fnrGenerator.ts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FlagProvider } from "@unleash/proxy-client-react";
import { useMemo } from "react";
import { createMemoryRouter, Outlet, RouterProvider, useLocation, useRouteLoaderData } from "react-router";
import { UnleashClient } from "unleash-proxy-client";
import type { NavUser } from "~/common/NavUser.ts";
import { AppHeader } from "./AppHeader.tsx";

const startsti = "/sak/2024123/reskontro?from=behandling&returSaksnr=gammel-sak&sessionState=test-session&enhet=4806";
const testident = genererFnr();
const testbruker: NavUser = { NAVident: "Z123456", name: "Test Saksbehandler", username: "testsaksbehandler" };

function hentRotdata() {
    return { bisysUrl: "https://bisys.example/context/" };
}

function HeaderRute() {
    const rotdata = useRouteLoaderData<typeof hentRotdata>("root");

    return (
        <>
            <AppHeader bisysUrl={rotdata?.bisysUrl} bruker={testbruker} />
            <Outlet />
        </>
    );
}

function GjeldendeAdresse() {
    const adresse = useLocation();

    return (
        <>
            <output data-testid="gjeldende-adresse">
                {adresse.pathname}
                {adresse.search}
            </output>
            <input hidden readOnly data-testid="testident" value={testident} />
        </>
    );
}

function HeaderScenario({ scenario }: { scenario: "person" | "sak" }) {
    const queryKlient = useMemo(() => new QueryClient({ defaultOptions: { queries: { retry: false } } }), []);
    const unleashKlient = useMemo(
        () =>
            new UnleashClient({
                url: `${window.location.origin}/unleash/proxy/${scenario}`,
                clientKey: "playwright",
                appName: "bidrag-frontend-playwright",
                disableMetrics: true,
                bootstrap: [
                    {
                        name: "frontend.sok-fnr-sak",
                        enabled: true,
                        impressionData: false,
                        variant: { name: "disabled", enabled: false },
                    },
                    {
                        name: "bisys.ny_sakside",
                        enabled: scenario === "sak",
                        impressionData: false,
                        variant: { name: "disabled", enabled: false },
                    },
                    {
                        name: "bisys.ny_brukeroversikt",
                        enabled: false,
                        impressionData: false,
                        variant: { name: "disabled", enabled: false },
                    },
                ],
            }),
        [scenario],
    );
    const ruter = useMemo(
        () =>
            createMemoryRouter(
                [
                    {
                        id: "root",
                        loader: hentRotdata,
                        children: [
                            {
                                path: "/sak/:saksnummer",
                                Component: HeaderRute,
                                children: [
                                    { index: true, Component: GjeldendeAdresse },
                                    { path: "*", Component: GjeldendeAdresse },
                                ],
                            },
                            {
                                path: "/bruker/:ident",
                                Component: HeaderRute,
                                children: [{ index: true, Component: GjeldendeAdresse }],
                            },
                        ],
                    },
                ],
                { initialEntries: [startsti] },
            ),
        [],
    );

    return (
        <QueryClientProvider client={queryKlient}>
            <FlagProvider unleashClient={unleashKlient} startClient={false}>
                <RouterProvider router={ruter} />
            </FlagProvider>
        </QueryClientProvider>
    );
}

export const PersonsøkMedBrukerindeksAv = () => <HeaderScenario scenario="person" />;
export const SakssøkMedSaksindeksPå = () => <HeaderScenario scenario="sak" />;
