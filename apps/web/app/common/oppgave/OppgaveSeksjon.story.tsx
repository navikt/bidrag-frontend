import { BidragCommonsProviderMock } from "@bidrag/common/playwright/testing/BidragCommonsProviderMock.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FlagProvider } from "@unleash/proxy-client-react";
import { useMemo } from "react";
import { MemoryRouter } from "react-router";
import { UnleashClient } from "unleash-proxy-client";
import { OppgaveSeksjon } from "./OppgaveSeksjon";

/** Dataene kommer fra nettverksmockene i spec-fila; storyene skiller seg bare på flagget. */
function Scenario({ oppgaverErPå }: { oppgaverErPå: boolean }) {
    const queryClient = useMemo(
        () => new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } } }),
        [],
    );
    const unleashClient = useMemo(
        () =>
            new UnleashClient({
                url: "http://localhost:3178/unleash/proxy",
                clientKey: "playwright",
                appName: "bidrag-frontend-playwright",
                disableMetrics: true,
                bootstrap: [
                    {
                        name: "frontend.oppgaver",
                        enabled: oppgaverErPå,
                        variant: { name: "disabled", enabled: false },
                        impressionData: false,
                    },
                ],
            }),
        [oppgaverErPå],
    );

    return (
        <MemoryRouter>
            <QueryClientProvider client={queryClient}>
                <FlagProvider unleashClient={unleashClient} startClient={false}>
                    <BidragCommonsProviderMock client={queryClient}>
                        <OppgaveSeksjon søk={{ saksnummer: "2400001" }} />
                    </BidragCommonsProviderMock>
                </FlagProvider>
            </QueryClientProvider>
        </MemoryRouter>
    );
}

export const FlaggPå = () => <Scenario oppgaverErPå />;

export const FlaggAv = () => <Scenario oppgaverErPå={false} />;
