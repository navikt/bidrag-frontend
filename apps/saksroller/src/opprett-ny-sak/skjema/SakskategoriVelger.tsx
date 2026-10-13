import { Radio, RadioGroup, Stack } from "@navikt/ds-react";

import type { Sakskategori } from "./OpprettSakStartContext";

type Props = {
    value: Sakskategori;
    onChange: (value: Sakskategori) => void;
};

export default function SakskategoriVelger({ value, onChange }: Props) {
    return (
        <RadioGroup
            legend="Velg om saken gjelder nasjonal eller internasjonal bidragssak"
            size="small"
            value={value}
            onChange={(nyVerdi) => onChange(nyVerdi as Sakskategori)}
        >
            <Stack gap="space-0 space-24" direction={{ xs: "column", sm: "row" }} wrap={false}>
                <Radio value="Nasjonal">Nasjonal</Radio>
                <Radio value="Utland">Utland</Radio>
            </Stack>
        </RadioGroup>
    );
}
