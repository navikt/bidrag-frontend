import type { PersonDto } from "@bidrag/api/PersonApi";
import { Box, Heading, HGrid, VStack } from "@navikt/ds-react";
import type { UseFormReturn } from "react-hook-form";
import ForelderVisning from "./ForelderVisning.tsx";
import LeggTilForelder from "./LeggTilForelder.tsx";
import type { Rolle, SakRedigeringData } from "../sakvisning-schema.ts";

const ROLLE_NAVN: Record<"BP" | "BM", string> = {
    BP: "Bidragspliktig",
    BM: "Bidragsmottaker",
};

interface EnkelForelderRolleProps {
    rolleType: "BP" | "BM";
    rolle: Rolle | undefined;
    form: UseFormReturn<SakRedigeringData>;
    erNyForelderForKjentRolle?: boolean;
    muligeAndreForeldre?: PersonDto[];
    saksnummer?: string;
}

function EnkelForelderRolle({
    rolleType,
    rolle,
    form,
    erNyForelderForKjentRolle = false,
    muligeAndreForeldre,
    saksnummer,
}: EnkelForelderRolleProps) {
    const rolleNavn = ROLLE_NAVN[rolleType];
    const rolleErKjent = Boolean(rolle?.fodselsnummer);

    return (
        <VStack gap="space-4">
            <Heading level="2" size="small">
                {rolleNavn}
            </Heading>
            <Box background="raised" borderColor="neutral-subtleA" borderWidth="1" borderRadius="12" padding="space-12">
                {rolleErKjent ? (
                    <ForelderVisning
                        form={form}
                        rolle={rolle as Rolle}
                        erNyForelder={erNyForelderForKjentRolle}
                        saksnummer={saksnummer}
                    />
                ) : (
                    <LeggTilForelder
                        rolleType={rolleType}
                        rolleNavn={rolleNavn}
                        form={form}
                        muligeAndreForeldre={muligeAndreForeldre}
                        saksnummer={saksnummer}
                    />
                )}
            </Box>
        </VStack>
    );
}

interface ForelderRolleVisningProps {
    bp: Rolle | undefined;
    bm: Rolle | undefined;
    form: UseFormReturn<SakRedigeringData>;
    erNyForelderBp?: boolean;
    erNyForelderBm?: boolean;
    muligeAndreForeldre?: PersonDto[];
    saksnummer?: string;
}

export default function ForelderRolleVisning({
    bp,
    bm,
    form,
    erNyForelderBp,
    erNyForelderBm,
    muligeAndreForeldre,
    saksnummer,
}: ForelderRolleVisningProps) {
    return (
        <HGrid columns={{ xs: 1, md: 2 }} gap="space-24">
            <EnkelForelderRolle
                rolleType="BP"
                rolle={bp}
                erNyForelderForKjentRolle={erNyForelderBp}
                form={form}
                muligeAndreForeldre={muligeAndreForeldre}
                saksnummer={saksnummer}
            />
            <EnkelForelderRolle
                rolleType="BM"
                rolle={bm}
                erNyForelderForKjentRolle={erNyForelderBm}
                form={form}
                muligeAndreForeldre={muligeAndreForeldre}
                saksnummer={saksnummer}
            />
        </HGrid>
    );
}
