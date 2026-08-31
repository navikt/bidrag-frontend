import PersonNavnIdent from "../../../person/PersonNavnIdent.tsx";
import { Radio, RadioGroup } from "@navikt/ds-react";
import { useEffect, useState } from "react";

import { RolleType } from "../RolleType.ts";
import type { ISelectData } from "./RoleSelect.tsx";

// Migrert fra bidrag-ui (apps/sak-ui/src/components/radio/role-radio/RoleRadio.tsx).
interface IRoleRadioProps {
    fodselsnummer: string;
    defaultValue: string;
    onSelectRole: (data: ISelectData) => void;
    roles?: RolleType[];
    legend?: string;
    hideLegend?: boolean;
    className?: string;
    required?: boolean;
    error?: string;
    showError?: boolean;
}

export default function RoleRadio({
    roles = [RolleType.BP, RolleType.BM],
    fodselsnummer,
    defaultValue,
    onSelectRole,
    legend,
    hideLegend = false,
    className,
    required = false,
    error,
    showError,
}: IRoleRadioProps) {
    const [selected, setSelected] = useState<ISelectData | undefined>(undefined);

    useEffect(() => {
        setSelected({ name: fodselsnummer, value: defaultValue });
    }, [defaultValue, fodselsnummer]);

    function handleSelect(value: string) {
        const updated = { name: fodselsnummer, value };
        setSelected(updated);
        onSelectRole(updated);
    }

    return (
        <RadioGroup
            className={className}
            size="small"
            legend={legend ?? <PersonNavnIdent variant="compact" ident={fodselsnummer} />}
            onChange={(val: string) => handleSelect(val)}
            value={!selected ? "" : selected.value}
            hideLegend={hideLegend}
            required={required}
            error={showError && error}
            data-testid="test-roleradio"
        >
            {roles.map((role, i) => (
                <Radio className="text-ax-neutral-1000" key={i} value={role}>
                    {role}
                </Radio>
            ))}
        </RadioGroup>
    );
}
