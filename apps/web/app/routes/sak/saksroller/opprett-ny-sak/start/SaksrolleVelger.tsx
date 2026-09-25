import { Radio, RadioGroup, Stack } from "@navikt/ds-react";
import { type PartRolle, PartRolleSchema } from "../skjema/opprett-sak-schema";
import type { Sakstype } from "../skjema/saksrolleroversiktContext";
import { filtrerSaksroller, type SaksrolleAlternativ } from "./saksrolle-regler";

type Props = {
    navn: string;
    alder: number | null;
    sakstype: Sakstype;
    rolle: PartRolle | null;
    readOnly: boolean;
    onVelg: (rolle: PartRolle) => void;
};

export default function SaksrolleVelger({ navn, alder, sakstype, rolle, readOnly, onVelg }: Props) {
    const alternativer = filtrerSaksroller(sakstype, alder, skjemaPartRoller);

    const velgSaksrolle = (verdi: string) => {
        const result = PartRolleSchema.safeParse(verdi);
        if (result.success && alternativer.some((valg) => valg.value === result.data)) {
            onVelg(result.data);
        }
    };

    return (
        <RadioGroup
            legend={`Hvilken rolle har ${navn}?`}
            value={rolle ?? null}
            onChange={velgSaksrolle}
            size="small"
            readOnly={readOnly}
        >
            <Stack gap="space-0 space-24" direction={{ xs: "column", sm: "row" }} wrap={false}>
                {alternativer.map((alternativ) => (
                    <Radio key={alternativ.value} value={alternativ.value}>
                        {alternativ.label}
                    </Radio>
                ))}
            </Stack>
        </RadioGroup>
    );
}

const skjemaPartRoller: SaksrolleAlternativ[] = [
    { label: "Bidragspliktig", value: "bidragspliktig" },
    { label: "Bidragsmottaker", value: "bidragsmottaker" },
    { label: "Barn over 18 år", value: "barn_over_18" },
    { label: "Barn under 18 år", value: "barn_under_18" },
];
