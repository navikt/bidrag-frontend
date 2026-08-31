import PersonNavnIdent from "../../../person/PersonNavnIdent.tsx";
import { Checkbox, TextField } from "@navikt/ds-react";
import type { ChangeEvent } from "react";

// Migrert fra bidrag-ui
// (apps/sak-ui/src/components/card/person-rellmottaker-card/PersonReellMottakerCard.tsx).
interface IPersonReellMottakerCardProps {
    value: string;
    textfieldValue: string;
    checked: boolean;
    onCheckboxChange: (event: ChangeEvent<HTMLInputElement>) => void;
    onTextfieldChange: (ident: string, value: string) => void;
    error?: string;
}

export default function PersonReellMottakerCard({
    value,
    textfieldValue,
    checked,
    error,
    onCheckboxChange,
    onTextfieldChange,
}: IPersonReellMottakerCardProps) {
    return (
        <div
            className="grid gap-1 rounded-md p-4 bg-ax-brand-blue-100"
            data-testid="test-opprettsak-person-reellmotaker-card"
        >
            <div className="flex place-items-center">
                <Checkbox
                    value={value}
                    checked={checked}
                    onChange={onCheckboxChange}
                    data-testid="test-opprettsak-person-reellmotaker-card-checkbox"
                >
                    <PersonNavnIdent ident={value} showCopyButton />
                </Checkbox>
            </div>
            <TextField
                className="text-ax-neutral-1000"
                type="text"
                label="Reell mottaker"
                size="small"
                error={error}
                disabled={!checked}
                value={textfieldValue}
                onChange={(e: ChangeEvent<HTMLInputElement>) => onTextfieldChange(value, e.target.value)}
                data-testid="test-opprettsak-person-reellmotaker-card-textfield"
            />
        </div>
    );
}
