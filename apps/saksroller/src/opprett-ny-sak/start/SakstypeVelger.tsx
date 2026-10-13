import { Radio, RadioGroup, Stack } from "@navikt/ds-react";

import type { OpprettSakstype } from "../skjema/OpprettSakStartContext";

type SakstypeOption = {
    type: OpprettSakstype;
    label: string;
};

const SAKSTYPE_OPTIONS: SakstypeOption[] = [
    {
        type: "BARNEBIDRAG",
        label: "Barnebidrag",
    },
    {
        type: "EKTEFELLEBIDRAG",
        label: "Ektefellebidrag",
    },
    {
        type: "OPPFOSTRINGSBIDRAG",
        label: "Oppfostringsbidrag",
    },
    {
        type: "FARSKAP",
        label: "Farskap",
    },
];

type Props = {
    value: OpprettSakstype | null;
    onVelg: (type: OpprettSakstype) => void;
};

export default function SakstypeVelger({ value, onVelg }: Props) {
    return (
        <RadioGroup
            legend="Velg sakstype"
            size="small"
            value={value ?? undefined}
            onChange={(type) => onVelg(type as OpprettSakstype)}
        >
            <Stack gap="space-0 space-24" direction={{ xs: "column", sm: "row" }}>
                {SAKSTYPE_OPTIONS.map((option) => (
                    <Radio key={option.type} value={option.type}>
                        {option.label}
                    </Radio>
                ))}
            </Stack>
        </RadioGroup>
    );
}
