import { BidragCommonsProviderMock } from "@bidrag/common/playwright/testing/BidragCommonsProviderMock.tsx";
import { genererFnr } from "@bidrag/common/playwright/testing/fnrGenerator.ts";
import { useTestQueryClient } from "@ct/saksroller/useTestQueryClient.ts";
import { VStack } from "@navikt/ds-react";
import { QueryClientProvider } from "@tanstack/react-query";
import { FormProvider, useForm } from "react-hook-form";
import type { BarnRolle, SakRedigeringData } from "../sakvisning-schema.ts";
import BarnVisning from "./BarnVisning.tsx";

const BM_IDENT = genererFnr();

function lagBarn(overrides: Partial<BarnRolle> = {}): BarnRolle {
    return {
        fodselsnummer: genererFnr(),
        type: "BA",
        rolleType: "BA",
        objektnummer: "1",
        mottagerErVerge: false,
        navn: "Lite Barn",
        fødselsdato: "2015-01-01",
        alder: 10,
        erMyndig: false,
        ...overrides,
    };
}

interface BarnVisningScenarioProps {
    initialRoller: BarnRolle[];
    bidragsmottakerIdent?: string;
    erNyttBarnIndex?: number;
    erOppfostringsbidrag?: boolean;
}

function BarnVisningScenario({
    initialRoller,
    bidragsmottakerIdent = BM_IDENT,
    erNyttBarnIndex,
    erOppfostringsbidrag = false,
}: BarnVisningScenarioProps) {
    const queryClient = useTestQueryClient();
    const form = useForm<SakRedigeringData>({
        defaultValues: { saksnummer: "2024/1", roller: initialRoller },
    });
    const roller = (form.watch("roller") || []) as BarnRolle[];

    return (
        <QueryClientProvider client={queryClient}>
            <BidragCommonsProviderMock>
                <FormProvider {...form}>
                    <VStack gap="space-16">
                        {roller.map((rolle, index) => (
                            <BarnVisning
                                key={rolle.fodselsnummer}
                                rolle={rolle}
                                index={index}
                                bidragsmottakerIdent={bidragsmottakerIdent}
                                erNyttBarn={index === erNyttBarnIndex}
                                hentOgNullstillSamhandler={() => null}
                                erOppfostringsbidrag={erOppfostringsbidrag}
                            />
                        ))}
                    </VStack>
                </FormProvider>
            </BidragCommonsProviderMock>
        </QueryClientProvider>
    );
}

export const UtenReellMottaker = () => <BarnVisningScenario initialRoller={[lagBarn()]} />;

export const NyttBarnKanFjernes = () => (
    <BarnVisningScenario
        initialRoller={[lagBarn({ navn: "Nytt Barn" }), lagBarn({ navn: "Eksisterende Barn" })]}
        erNyttBarnIndex={0}
    />
);

export const PåkrevdReellMottaker = () => (
    <BarnVisningScenario initialRoller={[lagBarn({ navn: "Myndig Barn", alder: 19, erMyndig: true })]} />
);
