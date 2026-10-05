import type { PersonDto } from "@bidrag/api/PersonApi";
import { Heading, HGrid, VStack } from "@navikt/ds-react";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { ISamhandlerPersonInfo } from "../../api/samhandler.api";
import { KortRamme } from "../../felles/person/PersonRolleKort";
import type { Rolle, SakRedigeringData } from "../../felles/sakvisning-schema.ts";
import ForelderVisning from "./ForelderVisning.tsx";
import LeggTilForelder from "./LeggTilForelder.tsx";

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
}

function EnkelForelderRolle({
    rolleType,
    rolle,
    form,
    erNyForelderForKjentRolle = false,
    muligeAndreForeldre,
}: EnkelForelderRolleProps) {
    const rolleNavn = ROLLE_NAVN[rolleType];
    const rolleErKjent = Boolean(rolle?.fodselsnummer);
    const [valgtPerson, setValgtPerson] = useState<Pick<ISamhandlerPersonInfo, "ident" | "søktIdent">>();

    return (
        <VStack gap="space-4">
            <Heading level="2" size="small">
                {rolleNavn}
            </Heading>
            <KortRamme>
                {rolleErKjent ? (
                    <ForelderVisning
                        form={form}
                        rolle={rolle as Rolle}
                        erNyForelder={erNyForelderForKjentRolle}
                        søktIdent={valgtPerson?.ident === rolle?.fodselsnummer ? valgtPerson?.søktIdent : undefined}
                        onPersonValgt={setValgtPerson}
                    />
                ) : (
                    <LeggTilForelder
                        rolleType={rolleType}
                        rolleNavn={rolleNavn}
                        form={form}
                        muligeAndreForeldre={muligeAndreForeldre}
                        onPersonValgt={setValgtPerson}
                    />
                )}
            </KortRamme>
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
}

export default function ForelderRolleVisning({
    bp,
    bm,
    form,
    erNyForelderBp,
    erNyForelderBm,
    muligeAndreForeldre,
}: ForelderRolleVisningProps) {
    return (
        <HGrid columns={{ xs: 1, lg: 2, xl: 3 }} gap="space-24" align="start">
            <EnkelForelderRolle
                rolleType="BP"
                rolle={bp}
                erNyForelderForKjentRolle={erNyForelderBp}
                form={form}
                muligeAndreForeldre={muligeAndreForeldre}
            />
            <EnkelForelderRolle
                rolleType="BM"
                rolle={bm}
                erNyForelderForKjentRolle={erNyForelderBm}
                form={form}
                muligeAndreForeldre={muligeAndreForeldre}
            />
        </HGrid>
    );
}
