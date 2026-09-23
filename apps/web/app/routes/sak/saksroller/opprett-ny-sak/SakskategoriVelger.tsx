import { Radio, RadioGroup, Stack } from "@navikt/ds-react";

import type { Sakskategori } from "./saksrolleroversiktContext";

type Props = {
    value: Sakskategori;
    onChange: (value: Sakskategori) => void;
    error?: string;
};

export default function SakskategoriVelger({ value, onChange, error }: Props) {
    return (
        <RadioGroup
            legend="Velg om saken gjelder nasjonal eller internasjonal bidragssak"
            size="small"
            value={value}
            onChange={(nyVerdi) => onChange(nyVerdi as Sakskategori)}
            error={error}
        >
            <Stack gap="space-4" direction={{ xs: "column", sm: "row" }} wrap={false}>
                <Radio value="Nasjonal">Nasjonal</Radio>
                <Radio value="Utland">Utland</Radio>
            </Stack>
        </RadioGroup>
    );
}
