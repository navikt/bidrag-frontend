import { Select } from "@navikt/ds-react";

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
    value: OpprettSakstype;
    onVelg: (type: OpprettSakstype) => void;
};

export default function SakstypeVelger({ value, onVelg }: Props) {
    return (
        <Select
            label="Velg sakstype"
            size="small"
            value={value}
            onChange={(event) => {
                const valgt = SAKSTYPE_OPTIONS.find((alternativ) => alternativ.type === event.target.value);
                if (!valgt) throw new Error("Fant ikke den valgte sakstypen");
                onVelg(valgt.type);
            }}
        >
            {SAKSTYPE_OPTIONS.map((option) => (
                <option key={option.type} value={option.type}>
                    {option.label}
                </option>
            ))}
        </Select>
    );
}
