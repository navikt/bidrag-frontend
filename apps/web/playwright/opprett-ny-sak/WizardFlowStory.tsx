import { NyOpprettSakFlytContext, OpprettSakFlytModal } from "@bidrag/common";
import { BidragCommonsProviderMock } from "@bidrag/common/playwright/testing/BidragCommonsProviderMock.tsx";
import { Button } from "@navikt/ds-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import BarnebidragFlyt from "../../app/routes/sak/saksroller/opprett-ny-sak/flyt/Barnebidrag/BarnebidragFlyt";
import EktefellebidragFlyt from "../../app/routes/sak/saksroller/opprett-ny-sak/flyt/Ektefellebidrag/EktefellebidragFlyt";
import EnPartMedBarnFlyt from "../../app/routes/sak/saksroller/opprett-ny-sak/flyt/EnPartMedBarn/EnPartMedBarnFlyt";
import type { InngangRolle } from "../../app/routes/sak/saksroller/opprett-ny-sak/inngang";
import OpprettSakFlyt from "../../app/routes/sak/saksroller/opprett-ny-sak/OpprettSakFlyt";
import OpprettSakFlytInnbygget from "../../app/routes/sak/saksroller/opprett-ny-sak/OpprettSakFlytInnbygget";
import type { PartISaken } from "../../app/routes/sak/saksroller/opprett-ny-sak/opprett-sak-schema";
import {
    type OpprettSakFlytValg,
    SaksrolleroversiktProvider,
    useSaksrolleroversikt,
} from "../../app/routes/sak/saksroller/opprett-ny-sak/saksrolleroversiktContext";
import { testpersoner } from "./fixtures";
import { seedStatiskEnhetsinfo } from "./queryCacheSeed";

type Scenario =
    | {
          sakstype: "BARNEBIDRAG";
          partISaken: PartISaken;
          flow: "BARNEBIDRAG";
          barnkurver: import("@bidrag/api/PersonApi").MotpartBarnRelasjon[];
      }
    | {
          sakstype: "EKTEFELLEBIDRAG";
          partISaken: PartISaken;
          flow: "EKTEFELLEBIDRAG";
          motpart: import("@bidrag/api/PersonApi").PersonDto[] | null;
      }
    | {
          sakstype: "FARSKAP";
          partISaken: PartISaken;
          flow: "FARSKAP";
          barnkurver: import("@bidrag/api/PersonApi").MotpartBarnRelasjon[];
      }
    | {
          sakstype: "OPPFOSTRINGSBIDRAG";
          partISaken: PartISaken;
          flow: "OPPFOSTRINGSBIDRAG";
          barnkurver: import("@bidrag/api/PersonApi").MotpartBarnRelasjon[];
      };

function ScenarioBootstrap({ scenario }: { scenario: Scenario }) {
    const { setPartISaken, setPartISakenAlder, setSakstype, setSakskategori, setSaksrolleFlyt } =
        useSaksrolleroversikt();

    useEffect(() => {
        setSakstype(scenario.sakstype);
        setSakskategori("Nasjonal");
        setPartISaken(scenario.partISaken);
        setPartISakenAlder(
            scenario.partISaken.rolle === "barn_under_18" ? 10 : scenario.partISaken.rolle === "barn_over_18" ? 23 : 40,
        );

        switch (scenario.flow) {
            case "BARNEBIDRAG":
                setSaksrolleFlyt({ key: 1, type: scenario.flow, barnkurver: scenario.barnkurver });
                break;
            case "EKTEFELLEBIDRAG":
                setSaksrolleFlyt({ key: 1, type: scenario.flow, motpart: scenario.motpart });
                break;
            case "FARSKAP":
            case "OPPFOSTRINGSBIDRAG":
                setSaksrolleFlyt({ key: 1, type: scenario.flow, barnkurver: scenario.barnkurver });
                break;
        }
    }, [scenario, setPartISaken, setPartISakenAlder, setSakskategori, setSakstype, setSaksrolleFlyt]);

    switch (scenario.flow) {
        case "BARNEBIDRAG":
            return <BarnebidragFlyt />;
        case "EKTEFELLEBIDRAG":
            return <EktefellebidragFlyt />;
        case "FARSKAP":
        case "OPPFOSTRINGSBIDRAG":
            return <EnPartMedBarnFlyt />;
    }
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
    const valg = useMemo<OpprettSakFlytValg>(
        () => ({
            inngang: { ident, rolle },
            onOpprettet: settSaksnummer,
            onAvbryt: () => settAvbrutt(true),
        }),
        [ident, rolle],
    );

    return (
        <>
            <form hidden>
                <input data-testid="opprettet-saksnummer" readOnly value={saksnummer} />
                <input data-testid="avbrutt" readOnly value={String(avbrutt)} />
            </form>
            <StoryRouter content={<OpprettSakFlyt />} valg={valg} />
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

function StoryRouter({ content, valg }: { content: ReactNode; valg?: OpprettSakFlytValg }) {
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
                                    personer={Object.fromEntries(
                                        Object.values(testpersoner).map((person) => [person.ident, person]),
                                    )}
                                >
                                    <SaksrolleroversiktProvider {...valg}>{content}</SaksrolleroversiktProvider>
                                </BidragCommonsProviderMock>
                            </QueryClientProvider>
                        ),
                    },
                ],
                { initialEntries: ["/sak/ny"] },
            ),
        [content, queryClient, valg],
    );

    return <RouterProvider router={router} />;
}

export type { Scenario };
