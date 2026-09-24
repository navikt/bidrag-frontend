import { Radio, RadioGroup } from "@navikt/ds-react";

import type { Sakstype } from "./saksrolleroversiktContext";

type SakstypeOption = {
    type: Sakstype;
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
    value: Sakstype | null;
    onVelg: (type: Sakstype) => void;
};

export default function SakstypeVelger({ value, onVelg }: Props) {
    return (
        <RadioGroup
            legend="Velg sakstype"
            size="small"
            value={value ?? undefined}
            onChange={(type) => onVelg(type as Sakstype)}
        >
            {SAKSTYPE_OPTIONS.map((option) => (
                <Radio key={option.type} value={option.type}>
                    {option.label}
                </Radio>
            ))}
        </RadioGroup>
    );
}
