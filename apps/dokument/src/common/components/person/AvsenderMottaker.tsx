import "./AvsenderMottaker.css";

import type { Rolletype } from "@bidrag/api/SakApi";
import { Label, Radio, RadioGroup, type RadioProps, TextField } from "@navikt/ds-react";
import type React from "react";
import { type MutableRefObject, type PropsWithChildren, useState } from "react";
import type { Person } from "../../../types/person";
import AvansertSok from "./AvansertSok";
import PersonInfo from "./PersonInfo";
export enum AvsenderMottakerChoices {
    SAMME_SOM_GJELDER = "SAMME_SOM_GJELDER",
    FRITEKST = "FRITEKST",
}

interface AvsenderMottakernfo {
    navn: string;
    foedselsnummer?: string;
    ident?: string;
    rolleType?: Rolletype;
}

export interface AvsenderMottakerProps {
    isMottaker?: boolean;
    avsenderMottakerInfo: AvsenderMottakernfo;
    editable: boolean;
    gjelder?: Person;
    onNameChange?: (name: string) => void;
    containerRef?: MutableRefObject<HTMLDivElement>;
    error?: string;
    initialChoice?: AvsenderMottakerChoices;
    value?: string;
    showLabel?: boolean;
}

export default function AvsenderMottaker(props: AvsenderMottakerProps) {
    const {
        isMottaker,
        avsenderMottakerInfo,
        gjelder,
        containerRef,
        error,
        initialChoice,
        editable = false,
        showLabel = true,
        onNameChange,
    } = props;
    const [selectedChoice, setSelectedChoice] = useState<AvsenderMottakerChoices>(
        initialChoice ?? AvsenderMottakerChoices.SAMME_SOM_GJELDER,
    );

    const label = isMottaker ? "Mottaker" : "Avsender";

    function handleAvsenderChange(event: React.ChangeEvent<HTMLInputElement>) {
        event.stopPropagation();
        event.preventDefault();
        const inputValue = event.target.value;
        onNameChange?.(inputValue);
    }

    function onRadioChange(event: AvsenderMottakerChoices) {
        const choices = Object.values(AvsenderMottakerChoices) as string[];
        if (choices.includes(event)) {
            setSelectedChoice(event as AvsenderMottakerChoices);
        }

        if (AvsenderMottakerChoices.SAMME_SOM_GJELDER === event) {
            onNameChange(gjelder?.navn ?? avsenderMottakerInfo.navn);
        } else {
            onNameChange(gjelder ? avsenderMottakerInfo.navn : undefined);
        }
    }

    if (!editable) {
        return (
            <div className={"avsenderMottakerNotEditable"}>
                {showLabel && <Label>{label}</Label>}
                <PersonInfo {...avsenderMottakerInfo} />
            </div>
        );
    }
    const sammeSomGjelder = gjelder ?? avsenderMottakerInfo;
    return (
        <div className="avsenderMottakerWrapper" id={"avsenderMottakerWrapper"}>
            <RadioGroup legend={label} onChange={onRadioChange} value={selectedChoice}>
                <RadioWithChildren
                    label={"Samme som gjelder"}
                    value={AvsenderMottakerChoices.SAMME_SOM_GJELDER}
                    checked={selectedChoice === AvsenderMottakerChoices.SAMME_SOM_GJELDER}
                >
                    <div ref={containerRef}>
                        <PersonInfo {...sammeSomGjelder} />
                    </div>
                </RadioWithChildren>
                <RadioWithChildren
                    label={"Fritekst"}
                    value={AvsenderMottakerChoices.FRITEKST}
                    checked={selectedChoice === AvsenderMottakerChoices.FRITEKST}
                >
                    <div className="avsender_input" ref={containerRef}>
                        <TextField
                            type="text"
                            size="small"
                            label={"Fritekst"}
                            id={"avsenderMottakerInput"}
                            error={error}
                            value={props.value}
                            defaultValue={gjelder ? avsenderMottakerInfo.navn : undefined}
                            onChange={handleAvsenderChange}
                        />
                        <AvansertSok onResult={(data) => onNameChange(data.navn["fullNavn"] ?? data.navn)} />
                    </div>
                </RadioWithChildren>
            </RadioGroup>
        </div>
    );
}

function RadioWithChildren({
    label,
    children,
    checked,
    ...radioProps
}: PropsWithChildren<RadioProps & { label: string }>) {
    return (
        <>
            <Radio {...radioProps} onChange={() => null}>
                {label}
            </Radio>
            {checked && <div style={{ marginLeft: "16px" }}>{children}</div>}
        </>
    );
}
