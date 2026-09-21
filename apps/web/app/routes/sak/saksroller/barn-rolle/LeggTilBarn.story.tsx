import { BidragCommonsProviderMock } from "@bidrag/common/playwright/testing/BidragCommonsProviderMock.tsx";
import { genererFnr } from "@bidrag/common/playwright/testing/fnrGenerator.ts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { createRoutesStub } from "react-router";
import type { Rolle, SakRedigeringData } from "../sakvisning-schema.ts";
import LeggTilBarn from "./LeggTilBarn.tsx";

const bmKjentFraStart: Rolle = {
    fodselsnummer: genererFnr(),
    type: "BM",
    rolleType: "BM",
    objektnummer: "1",
    mottagerErVerge: false,
    navn: "Kari Nordmann",
};

function LeggTilBarnScenario({ initialRoller }: { initialRoller: Rolle[] }) {
    const queryClient = useMemo(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: { retry: false, staleTime: Infinity },
                    mutations: { retry: false },
                },
            }),
        [],
    );
    const form = useForm<SakRedigeringData>({
        defaultValues: { saksnummer: "2024/1", roller: initialRoller },
    });

    return (
        <QueryClientProvider client={queryClient}>
            <BidragCommonsProviderMock
                personer={{
                    [bmKjentFraStart.fodselsnummer as string]: {
                        ident: bmKjentFraStart.fodselsnummer,
                        visningsnavn: "Kari Nordmann",
                    },
                }}
            >
                <FormProvider {...form}>
                    <LeggTilBarn />
                </FormProvider>
            </BidragCommonsProviderMock>
        </QueryClientProvider>
    );
}

const Stub = createRoutesStub([
    {
        path: "/sak/:saksnummer/saksroller",
        Component: () => <LeggTilBarnScenario initialRoller={[bmKjentFraStart]} />,
    },
]);

export const MedBidragsmottaker = () => <Stub initialEntries={["/sak/2024%2F1/saksroller"]} />;
