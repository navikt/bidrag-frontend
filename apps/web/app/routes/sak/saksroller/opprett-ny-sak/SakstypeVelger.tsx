import { BodyShort, Heading, Radio, RadioGroup, VStack } from "@navikt/ds-react";

import type { Sakstype } from "./saksrolleroversiktContext";

type SakstypeOption = {
    type: Sakstype;
    label: string;
    description: string;
};

const SAKSTYPE_OPTIONS: SakstypeOption[] = [
    {
        type: "BARNEBIDRAG",
        label: "Barnebidrag",
        description: "Sak med barn og foreldre",
    },
    {
        type: "EKTEFELLEBIDRAG",
        label: "Ektefellebidrag",
        description: "Sak mellom ektefeller/samboere uten barn",
    },
    {
        type: "OPPFOSTRINGSBIDRAG",
        label: "Oppfostringsbidrag",
        description: "Bidragspliktig og barn uten bidragsmottaker. Reell mottaker må velges for hvert barn",
    },
    {
        type: "FARSKAP",
        label: "Farskap",
        description: "Sak om farskap hvor barnet har ukjent far.",
    },
];

type Props = {
    onVelg: (type: Sakstype) => void;
};

export default function SakstypeVelger({ onVelg }: Props) {
    return (
        <VStack gap="space-16">
            <Heading level="2" size="medium">
                Hvilken type sak skal opprettes?
            </Heading>

            <RadioGroup legend="Velg sakstype" hideLegend>
                {SAKSTYPE_OPTIONS.map((option) => (
                    <Radio key={option.type} value={option.type} onClick={() => onVelg(option.type)}>
                        <div>
                            <BodyShort weight="semibold">{option.label}</BodyShort>
                            <BodyShort size="small" textColor="subtle">
                                {option.description}
                            </BodyShort>
                        </div>
                    </Radio>
                ))}
            </RadioGroup>
        </VStack>
    );
}
