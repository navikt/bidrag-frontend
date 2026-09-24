import { BidragCommonsProviderMock } from "@bidrag/common/playwright/testing/BidragCommonsProviderMock.tsx";
import { genererFnr } from "@bidrag/common/playwright/testing/fnrGenerator.ts";
import { Bleed, Box, Heading } from "@navikt/ds-react";
import { QueryClient } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import SakBaseLayout from "./SakBaseLayout";
import SakFullbreddeLayout from "./SakFullbreddeLayout";
import SakHeaderLayout from "./SakHeaderLayout";
import SakStandardLayout from "./SakStandardLayout";

const bidragsmottakerIdent = genererFnr();
const bidragspliktigIdent = genererFnr();
const barnIdent = genererFnr();

function FargetInnhold({ type }: { type: "standard" | "dokumenter" | "uten-sidemeny" }) {
    const innhold = {
        standard: { background: "success-soft" as const, tittel: "Standard sideinnhold" },
        dokumenter: { background: "warning-soft" as const, tittel: "Dokumentvisning" },
        "uten-sidemeny": { background: "neutral-soft" as const, tittel: "Side uten sidemeny" },
    }[type];

    return (
        <Box background={innhold.background} minHeight="40rem" data-testid="sideinnhold">
            <Heading level="2" size="small">
                {innhold.tittel}
            </Heading>
        </Box>
    );
}

function StoryProviders({ children, harTilgang = true }: { children: ReactNode; harTilgang?: boolean }) {
    const [queryClient] = useState(() => {
        const client = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                    refetchOnWindowFocus: false,
                    staleTime: Infinity,
                },
            },
        });
        if (harTilgang) {
            client.setQueryData(["hent_sak", "2024-1234", false], {
                eierfogd: "4803",
                saksnummer: "2024-1234",
                saksstatus: "AK",
                kategori: "N",
                begrensetTilgang: false,
                opprettetDato: "2024-01-01",
                levdeAdskilt: false,
                ukjentPart: false,
                vedtakssperre: false,
                avsluttet: false,
                arbeidsfordeling: {},
                roller: [
                    { type: "BM", fodselsnummer: bidragsmottakerIdent },
                    { type: "BP", fodselsnummer: bidragspliktigIdent },
                    { type: "BA", fodselsnummer: barnIdent },
                ],
            });
        }
        client.setQueryData(["fodselsdatoer", barnIdent], {
            identerTilDatoer: { [barnIdent]: "2015-01-01" },
        });
        client.setQueryData(["sjekkTilgangSakV2", "2024-1234"], {
            harTilgang,
            detaljer: [],
        });
        return client;
    });

    return (
        <Bleed marginInline="full" marginBlock="space-32">
            <BidragCommonsProviderMock
                client={queryClient}
                personer={{
                    [bidragsmottakerIdent]: { ident: bidragsmottakerIdent, visningsnavn: "Kari Nordmann" },
                    [bidragspliktigIdent]: { ident: bidragspliktigIdent, visningsnavn: "Ola Nordmann" },
                    [barnIdent]: { ident: barnIdent, visningsnavn: "Lille Nordmann" },
                }}
            >
                {children}
            </BidragCommonsProviderMock>
        </Bleed>
    );
}

function createStoryRouter(type: "standard" | "dokumenter") {
    const Layout = type === "standard" ? SakStandardLayout : SakFullbreddeLayout;

    return createMemoryRouter(
        [
            {
                path: "/sak/:saksnummer",
                Component: SakBaseLayout,
                children: [
                    {
                        Component: SakHeaderLayout,
                        children: [
                            {
                                Component: Layout,
                                children: [
                                    {
                                        path: type,
                                        handle: { sakSideTittel: "Dokumenter" },
                                        Component: () => <FargetInnhold type={type} />,
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        ],
        { initialEntries: [`/sak/2024-1234/${type}`] },
    );
}

export const StandardMedSidemeny = () => (
    <StoryProviders>
        <RouterProvider router={createStoryRouter("standard")} />
    </StoryProviders>
);

export const DokumenterMedSidemeny = () => (
    <StoryProviders>
        <RouterProvider router={createStoryRouter("dokumenter")} />
    </StoryProviders>
);

export const UtenFellesHeader = () => {
    const router = createMemoryRouter(
        [
            {
                path: "/sak/:saksnummer",
                Component: SakBaseLayout,
                children: [
                    {
                        path: "saksroller",
                        Component: () => <FargetInnhold type="uten-sidemeny" />,
                    },
                ],
            },
        ],
        { initialEntries: ["/sak/2024-1234/saksroller"] },
    );

    return (
        <StoryProviders>
            <RouterProvider router={router} />
        </StoryProviders>
    );
};

export const UtenTilgang = () => (
    <StoryProviders harTilgang={false}>
        <RouterProvider router={createStoryRouter("standard")} />
    </StoryProviders>
);
