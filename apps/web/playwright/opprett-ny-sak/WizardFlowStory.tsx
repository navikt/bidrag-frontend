import { BidragCommonsProviderMock } from "@bidrag/common/playwright/testing/BidragCommonsProviderMock.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useEffect, useMemo } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import BarnebidragFlyt from "../../app/routes/sak/saksroller/opprett-ny-sak/flyt/Barnebidrag/BarnebidragFlyt";
import EktefellebidragFlyt from "../../app/routes/sak/saksroller/opprett-ny-sak/flyt/Ektefellebidrag/EktefellebidragFlyt";
import EnPartMedBarnFlyt from "../../app/routes/sak/saksroller/opprett-ny-sak/flyt/EnPartMedBarn/EnPartMedBarnFlyt";
import OpprettSakFlyt from "../../app/routes/sak/saksroller/opprett-ny-sak/OpprettSakFlyt";
import type { PartISaken } from "../../app/routes/sak/saksroller/opprett-ny-sak/opprett-sak-schema";
import {
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
                                    personer={Object.fromEntries(
                                        Object.values(testpersoner).map((person) => [person.ident, person]),
                                    )}
                                >
                                    <SaksrolleroversiktProvider>{content}</SaksrolleroversiktProvider>
                                </BidragCommonsProviderMock>
                            </QueryClientProvider>
                        ),
                    },
                ],
                { initialEntries: ["/sak/ny/saksroller"] },
            ),
        [content, queryClient],
    );

    return <RouterProvider router={router} />;
}

export type { Scenario };
