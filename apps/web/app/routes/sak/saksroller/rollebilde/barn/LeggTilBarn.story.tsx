import { BidragCommonsProviderMock } from "@bidrag/common/playwright/testing/BidragCommonsProviderMock.tsx";
import { genererFnr } from "@bidrag/common/playwright/testing/fnrGenerator.ts";
import { useTestQueryClient } from "@ct/saksroller/useTestQueryClient.ts";
import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { createRoutesStub } from "react-router";
import type { Rolle, SakRedigeringData } from "../../felles/sakvisning-schema.ts";
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
    const queryClient = useTestQueryClient();
    const form = useForm<SakRedigeringData>({
        defaultValues: { saksnummer: "2024/1", roller: initialRoller },
    });
    const [visSøk, setVisSøk] = useState(false);

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
                    <LeggTilBarn visSøk={visSøk} setVisSøk={setVisSøk} />
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
