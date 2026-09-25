import type { MotpartBarnRelasjon, PersonDto } from "@bidrag/api/PersonApi";
import { NyOpprettSakFlytContext, OpprettSakFlytModal } from "@bidrag/common";
import { BidragCommonsProviderMock } from "@bidrag/common/playwright/testing/BidragCommonsProviderMock.tsx";
import { Button } from "@navikt/ds-react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { type ReactNode, Suspense, useEffect, useMemo, useState } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import type { InngangRolle } from "../../app/routes/sak/saksroller/opprett-ny-sak/inngang";
import OpprettSakFlyt from "../../app/routes/sak/saksroller/opprett-ny-sak/OpprettSakFlyt";
import OpprettSakFlytInnbygget from "../../app/routes/sak/saksroller/opprett-ny-sak/OpprettSakFlytInnbygget";
import OpprettSakSkjema from "../../app/routes/sak/saksroller/opprett-ny-sak/OpprettSakSkjema";
import type { PartRolle } from "../../app/routes/sak/saksroller/opprett-ny-sak/opprett-sak-schema";
import type { Sakstype } from "../../app/routes/sak/saksroller/opprett-ny-sak/saksrolleroversiktContext";
import { testpersoner } from "./fixtures";
import { seedStatiskEnhetsinfo } from "./queryCacheSeed";

type Scenario = {
    sakstype: Sakstype;
    person: Pick<PersonDto, "ident" | "visningsnavn" | "fødselsdato">;
    rolle: PartRolle;
    relasjoner: MotpartBarnRelasjon[];
};

function ScenarioBootstrap({ scenario }: { scenario: Scenario }) {
    const queryClient = useQueryClient();
    const [start] = useState(() => {
        queryClient.setQueryData(["hent_person_motpart_barn_relasjon", scenario.person.ident], {
            personensMotpartBarnRelasjon: scenario.relasjoner,
        });
        return { person: scenario.person as PersonDto, rolle: scenario.rolle, sakstype: scenario.sakstype };
    });

    return <OpprettSakSkjema start={start} />;
}

export function WizardFlowStory({ scenario }: { scenario: Scenario }) {
    return <StoryRouter content={<ScenarioBootstrap scenario={scenario} />} />;
}

export function WizardPageStory() {
    return <StoryRouter content={<OpprettSakFlyt />} />;
}

/** Flyten bygd inn av en kaller. Callbacks lagres i skjulte felt, siden CT-props må kunne serialiseres. */
export function WizardInnbyggetStory({ ident, rolle }: { ident: string; rolle?: InngangRolle }) {
    const [saksnummer, settSaksnummer] = useState("");
    const [avbrutt, settAvbrutt] = useState(false);
    return (
        <>
            <form hidden>
                <input data-testid="opprettet-saksnummer" readOnly value={saksnummer} />
                <input data-testid="avbrutt" readOnly value={String(avbrutt)} />
            </form>
            <StoryRouter
                content={
                    <OpprettSakFlytInnbygget
                        ident={ident}
                        rolle={rolle}
                        onOpprettet={settSaksnummer}
                        onAvbryt={() => settAvbrutt(true)}
                    />
                }
            />
        </>
    );
}

type ModalStoryProps = {
    ident: string;
    rolle?: InngangRolle;
    initialForelderIdent?: string;
    eierfogd?: string;
    medNyFlyt?: boolean;
};

/** Modalen slik behandling og dokument åpner den. Resultatet lagres i skjulte felt. */
export function WizardModalStory(props: ModalStoryProps) {
    return <StoryRouter content={<ModalHarness {...props} />} />;
}

function ModalHarness({ ident, rolle, initialForelderIdent, eierfogd, medNyFlyt = true }: ModalStoryProps) {
    const [open, settOpen] = useState(false);
    const [saksnummer, settSaksnummer] = useState("");
    const [lukket, settLukket] = useState(false);

    return (
        <NyOpprettSakFlytContext value={medNyFlyt ? OpprettSakFlytInnbygget : null}>
            <form hidden>
                <input data-testid="opprettet-saksnummer" readOnly value={saksnummer} />
                <input data-testid="lukket" readOnly value={String(lukket)} />
            </form>
            <Button type="button" onClick={() => settOpen(true)}>
                Åpne opprett sak
            </Button>
            <OpprettSakFlytModal
                open={open}
                onClose={() => {
                    settOpen(false);
                    settLukket(true);
                }}
                ident={ident}
                rolle={rolle}
                initialForelder={initialForelderIdent ? { ident: initialForelderIdent, rolle: "BP" } : undefined}
                eierfogd={eierfogd}
                onOpprettet={(nytt) => {
                    settSaksnummer(nytt);
                    settOpen(false);
                }}
            />
        </NyOpprettSakFlytContext>
    );
}

function StoryRouter({ content }: { content: ReactNode }) {
    const queryClient = useMemo(() => {
        const client = new QueryClient({
            defaultOptions: {
                queries: { retry: false, staleTime: Infinity },
                mutations: { retry: false },
            },
        });
        seedStatiskEnhetsinfo(client);
        return client;
    }, []);
    const router = useMemo(
        () =>
            createMemoryRouter(
                [
                    {
                        id: "root",
                        path: "*",
                        loader: () => ({ bisysUrl: "" }),
                        element: (
                            <QueryClientProvider client={queryClient}>
                                <BidragCommonsProviderMock
                                    client={queryClient}
                                    personer={Object.fromEntries(
                                        Object.values(testpersoner).map((person) => [person.ident, person]),
                                    )}
                                >
                                    {content}
                                </BidragCommonsProviderMock>
                            </QueryClientProvider>
                        ),
                    },
                ],
                { initialEntries: ["/sak/ny"] },
            ),
        [content, queryClient],
    );

    return <RouterProvider router={router} />;
}

export type { Scenario };
