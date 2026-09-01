import { PersonNavnIdent } from "@navikt/bidrag-ui-common";
import { Radio } from "@navikt/ds-react";
import React, { useRef } from "react";

import type { Rolletype } from "../../../../api/BidragSakApi";
import useRegisterField from "../../../../common/components/form/hooks/useRegisterField";
import type { JournalpostToRegister } from "../types/JournalpostToRegister";

interface PersonRadioButtonProps {
    foedselsnummer: string;
    rolleType?: Rolletype;
    navn: string;
    disabled?: boolean;
    name: string;
}

export default function PersonRadioButton({ foedselsnummer, name, rolleType, navn, disabled }: PersonRadioButtonProps) {
    const radioRef = useRef(null);
    useRegisterField<JournalpostToRegister>("gjelderIdent", { required: "Du må velge person" }, () => radioRef.current);
    return (
        <div
            key={foedselsnummer + "_" + rolleType}
            style={{
                display: "flex",
                flexDirection: "row",
            }}
            className={"person-radio-button"}
        >
            <Radio
                name={name}
                disabled={disabled}
                id={rolleType + "_" + foedselsnummer}
                value={foedselsnummer}
                ref={(ref) => (radioRef.current = ref)}
            >
                {" "}
            </Radio>
            <PersonNavnIdent ident={foedselsnummer} rolle={rolleType} className="self-center" variant="compact" />
        </div>
    );
}
