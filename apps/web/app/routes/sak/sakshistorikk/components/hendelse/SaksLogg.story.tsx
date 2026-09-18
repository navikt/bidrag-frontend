import type { SakshendelseDto } from "@bidrag/api/SakApi";
import { HendelseType } from "@bidrag/api/SakApi";
import { BidragCommonsProviderMock } from "@bidrag/common/playwright/testing/BidragCommonsProviderMock.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FlagProvider } from "@unleash/proxy-client-react";
import type { PropsWithChildren } from "react";
import { useMemo } from "react";
import { MemoryRouter } from "react-router";
import { UnleashClient } from "unleash-proxy-client";
import SaksLogg from "./SaksLogg";

const saksnummer = "2024/1234";

function hendelse(overrides: Partial<SakshendelseDto>): SakshendelseDto {
    return {
        hendelseId: "hendelse-1",
        opprettetTidspunkt: "2024-05-10T12:00:00Z",
        enhet: "4803",
        type: HendelseType.SOKNADBM,
        typeBeskrivelse: "Søknad fra bidragsmottaker",
        resultat: "Mottatt",
        resultatIBisys: false,
        erBisysVedtakOgErOverført: false,
        erKlageberettigetVedtak: false,
        erLukket: false,
        fraBbm: false,
        barnObjektNumre: [],
        ...overrides,
    };
}

const hendelser: SakshendelseDto[] = [
    hendelse({
        hendelseId: "hendelse-soknad",
        type: HendelseType.SOKNADBM,
        typeBeskrivelse: "Søknad fra bidragsmottaker",
        søknadsid: "soknad-1",
    }),
    hendelse({
        hendelseId: "hendelse-vedtak",
        opprettetTidspunkt: "2024-05-11T12:00:00Z",
        type: HendelseType.VEDTAK,
        typeBeskrivelse: "Vedtak",
        resultat: "Fastsettelse",
        søknadsid: "soknad-2",
        behandlingsid: "behandling-2",
        vedtaksid: "vedtak-2",
    }),
    hendelse({
        hendelseId: "hendelse-indeks",
        opprettetTidspunkt: "2024-05-12T12:00:00Z",
        type: HendelseType.INDEKSREGULERT,
        typeBeskrivelse: "Indeksregulering",
        resultat: null,
        vedtaksid: "vedtak-3",
        behandlingsid: "behandling-3",
    }),
    hendelse({
        hendelseId: "hendelse-klage",
        opprettetTidspunkt: "2024-05-13T12:00:00Z",
        type: HendelseType.KLAGEVEDTAK,
        typeBeskrivelse: "Klagevedtak",
        resultat: "Klage behandlet",
        erKlageberettigetVedtak: true,
    }),
];

function StoryWrapper({ children }: PropsWithChildren) {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
    });
    const unleashClient = useMemo(
        () =>
            new UnleashClient({
                url: "http://localhost:3178/unleash/proxy",
                clientKey: "playwright",
                appName: "bidrag-frontend-playwright",
                disableMetrics: true,
                bootstrap: [],
            }),
        [],
    );

    return (
        <MemoryRouter initialEntries={["/sak/2024/1234?enhet=4803&sessionState=test"]}>
            <QueryClientProvider client={queryClient}>
                <FlagProvider unleashClient={unleashClient} startClient={false}>
                    <BidragCommonsProviderMock>{children}</BidragCommonsProviderMock>
                </FlagProvider>
            </QueryClientProvider>
        </MemoryRouter>
    );
}

export const ForskjelligeHendelser = () => (
    <StoryWrapper>
        <SaksLogg saksnummer={saksnummer} hendelser={hendelser} />
    </StoryWrapper>
);
