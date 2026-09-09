import { BidragCommonsProviderMock } from "@bidrag/common/playwright/testing/BidragCommonsProviderMock.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import BarnBeggeForeldreFlyt from "../flyt/BarnBeggeForeldreFlyt";
import BarnMedManglendeForeldreFlyt from "../flyt/BarnMedManglendeForeldreFlyt";
import EktefellebidragFlyt from "../flyt/EktefellebidragFlyt";
import FarskapsFlyt from "../flyt/FarskapsFlyt";
import ForelderMedBarnFlyt from "../flyt/ForelderMedBarnFlyt";
import ForelderUtenBarnFlyt from "../flyt/ForelderUtenBarnFlyt";
import OppfostringsbidragFlyt from "../flyt/OppfostringsbidragFlyt";
import OpprettSakFlyt from "../OpprettSakFlyt";
import type { PartISaken } from "../opprett-sak-schema";
import { SaksrolleroversiktProvider, useSaksrolleroversikt } from "../saksrolleroversiktContext";
import { testpersoner } from "./fixtures";
import { seedStatiskEnhetsinfo } from "./queryCacheSeed";

type Scenario =
    | { sakstype: "BARNEBIDRAG"; partISaken: PartISaken; flow: "FORELDER_UTEN_BARN" }
    | {
          sakstype: "BARNEBIDRAG";
          partISaken: PartISaken;
          flow: "FORELDER_MED_BARN";
          barnkurver: Parameters<ReturnType<typeof useSaksrolleroversikt>["setSaksrolleFlyt"]>[0] extends infer _T
              ? import("@bidrag/api/PersonApi").MotpartBarnRelasjon[]
              : never;
      }
    | {
          sakstype: "BARNEBIDRAG";
          partISaken: PartISaken;
          flow: "BARN_BEGGE_FORELDRE";
          foreldre: import("@bidrag/api/PersonApi").PersonDto[];
      }
    | {
          sakstype: "BARNEBIDRAG";
          partISaken: PartISaken;
          flow: "BARN_MANGLENDE_FORELDRE";
          forelder: import("@bidrag/api/PersonApi").PersonDto | null;
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
            case "FORELDER_MED_BARN":
                setSaksrolleFlyt({ key: 1, type: scenario.flow, barnkurver: scenario.barnkurver });
                break;
            case "FORELDER_UTEN_BARN":
                setSaksrolleFlyt({ key: 1, type: scenario.flow });
                break;
            case "BARN_BEGGE_FORELDRE":
                setSaksrolleFlyt({ key: 1, type: scenario.flow, foreldre: scenario.foreldre });
                break;
            case "BARN_MANGLENDE_FORELDRE":
                setSaksrolleFlyt({ key: 1, type: scenario.flow, forelder: scenario.forelder });
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
        case "FORELDER_MED_BARN":
            return <ForelderMedBarnFlyt />;
        case "FORELDER_UTEN_BARN":
            return <ForelderUtenBarnFlyt />;
        case "BARN_BEGGE_FORELDRE":
            return <BarnBeggeForeldreFlyt />;
        case "BARN_MANGLENDE_FORELDRE":
            return <BarnMedManglendeForeldreFlyt />;
        case "EKTEFELLEBIDRAG":
            return <EktefellebidragFlyt />;
        case "FARSKAP":
            return <FarskapsFlyt />;
        case "OPPFOSTRINGSBIDRAG":
            return <OppfostringsbidragFlyt />;
    }
}

export function WizardFlowStory({ scenario }: { scenario: Scenario }) {
    return <StoryRouter content={<ScenarioBootstrap scenario={scenario} />} />;
}

export function WizardPageStory() {
    return <StoryRouter content={<OpprettSakFlyt />} />;
}

function StoryRouter({ content }: { content: React.ReactNode }) {
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
