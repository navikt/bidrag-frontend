import type { MotpartBarnRelasjon, PersonDto } from "@bidrag/api/PersonApi";
import { NyOpprettSakFlytContext, OpprettSakFlytModal } from "@bidrag/common";
import { BidragCommonsProviderMock } from "@bidrag/common/playwright/testing/BidragCommonsProviderMock.tsx";
import { Button } from "@navikt/ds-react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useMemo, useState } from "react";
import { createMemoryRouter, RouterProvider, useLocation } from "react-router";
import OpprettSakSkjema from "../../app/routes/sak/saksroller/opprett-ny-sak/skjema/OpprettSakSkjema";
import type { Sakstype } from "../../app/routes/sak/saksroller/opprett-ny-sak/skjema/OpprettSakStartContext";
import type { PartRolle } from "../../app/routes/sak/saksroller/opprett-ny-sak/skjema/opprett-sak-schema";
import type { InngangRolle } from "../../app/routes/sak/saksroller/opprett-ny-sak/start/inngang";
import OpprettSakFlyt from "../../app/routes/sak/saksroller/opprett-ny-sak/start/OpprettSakFlyt";
import OpprettSakFlytInnbygget from "../../app/routes/sak/saksroller/opprett-ny-sak/start/OpprettSakFlytInnbygget";
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

export function OpprettSakSkjemaStory({ scenario }: { scenario: Scenario }) {
    return <StoryRouter content={<ScenarioBootstrap scenario={scenario} />} />;
}

export function OpprettSakFlytStory() {
    return <StoryRouter content={<OpprettSakFlyt />} />;
}

/** Flyten bygd inn av en kaller. Callbacks lagres i skjulte felt, siden CT-props må kunne serialiseres. */
export function OpprettSakFlytInnbyggetStory({ ident, rolle }: { ident: string; rolle?: InngangRolle }) {
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
export function OpprettSakFlytModalStory(props: ModalStoryProps) {
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
            <YtreSkjema>
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
            </YtreSkjema>
        </NyOpprettSakFlytContext>
    );
}

/** Journalpostregistreringen i dokument legger modalen inne i sitt eget skjema. */
function YtreSkjema({ children }: { children: ReactNode }) {
    const [innsendt, settInnsendt] = useState(false);
    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                settInnsendt(true);
            }}
        >
            <input data-testid="ytre-skjema-innsendt" readOnly hidden value={String(innsendt)} />
            {children}
        </form>
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
                                    <RoutePath />
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

function RoutePath() {
    const { pathname } = useLocation();
    return (
        <form hidden>
            <input data-testid="route-path" readOnly value={pathname} />
        </form>
    );
}

export type { Scenario };
