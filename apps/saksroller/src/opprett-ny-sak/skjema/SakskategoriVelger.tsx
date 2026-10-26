import { Select } from "@navikt/ds-react";

import type { Sakskategori } from "./OpprettSakStartContext";

type Props = {
    value: Sakskategori;
    onChange: (value: Sakskategori) => void;
};

export default function SakskategoriVelger({ value, onChange }: Props) {
    return (
        <Select
            label="Kategori"
            size="small"
            value={value}
            onChange={(event) => {
                const kategori = event.target.value;
                if (kategori !== "Nasjonal" && kategori !== "Utland") throw new Error("Ukjent sakskategori");
                onChange(kategori);
            }}
        >
            <option value="Nasjonal">Nasjonal</option>
            <option value="Utland">Utland</option>
        </Select>
    );
}
