import type { Rolletype } from "@bidrag/api/SakApi";
import { PersonNavnIdent } from "@bidrag/common";
import { Radio } from "@navikt/ds-react";
import { useRef } from "react";
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
            key={`${foedselsnummer}_${rolleType}`}
            style={{
                display: "flex",
                flexDirection: "row",
            }}
            className={"person-radio-button"}
        >
            <Radio
                name={name}
                disabled={disabled}
                id={`${rolleType}_${foedselsnummer}`}
                value={foedselsnummer}
                ref={(ref) => {
                    radioRef.current = ref;
                }}
            >
                {" "}
            </Radio>
            <span className="self-center">
                <PersonNavnIdent
                    ident={foedselsnummer}
                    rolle={rolleType as unknown as import("@bidrag/common").RolleType}
                    variant="compact"
                />
            </span>
        </div>
    );
}
