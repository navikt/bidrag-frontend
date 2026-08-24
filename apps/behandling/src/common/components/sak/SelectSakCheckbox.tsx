import { Checkbox } from "@navikt/ds-react";
import type { ReactElement } from "react";

import type { Sak } from "./sak";

interface SelectSakCheckboxProps {
    isSelected: boolean;
    sak: Sak;
    onChecked: () => void;
}
export default function SelectSakCheckbox({ sak, isSelected, onChecked }: SelectSakCheckboxProps): ReactElement {
    return (
        <Checkbox
            className={"sakstilknyttningCheckbox"}
            checked={isSelected}
            value={sak.saksnummer}
            onChange={() => {
                onChecked();
            }}
        >
            {" "}
        </Checkbox>
    );
}
