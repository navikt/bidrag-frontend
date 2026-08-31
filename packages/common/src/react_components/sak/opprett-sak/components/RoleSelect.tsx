import PersonNavnIdent from "../../../person/PersonNavnIdent.tsx";
import { Select } from "@navikt/ds-react";
import { type ChangeEvent, useEffect, useState } from "react";

import { RolleType } from "../RolleType.ts";

// Migrert fra bidrag-ui (apps/sak-ui/src/components/select/role-select/RoleSelect.tsx).
export interface ISelectData {
    name: string;
    value: string;
}

export interface IRoleSelectProps {
    name: string;
    ident: string;
    defaultValue: string;
    onSelectRole: (data: ISelectData) => void;
    roles?: RolleType[];
    hideLabel?: boolean;
    className?: string;
    testId?: string;
}

export default function RoleSelect({
    roles = [RolleType.BP, RolleType.BM],
    name,
    ident,
    defaultValue,
    onSelectRole,
    hideLabel = true,
    className,
    testId,
}: IRoleSelectProps) {
    const [selected, setSelected] = useState<ISelectData | undefined>(undefined);

    useEffect(() => {
        setSelected({ name, value: defaultValue });
    }, [defaultValue, name]);

    if (!selected) {
        return null;
    }

    function handleSelect({ target }: ChangeEvent<HTMLSelectElement>) {
        const updated = { name, value: target.value };
        setSelected(updated);
        onSelectRole(updated);
    }

    return (
        <Select
            className={className}
            label={
                <div className="inline-flex gap-1">
                    <div>Hvilken rolle har </div> <PersonNavnIdent variant="compact" ident={ident} />
                </div>
            }
            size="small"
            hideLabel={hideLabel}
            value={selected.value}
            onChange={handleSelect}
            data-testid={testId ?? `test-role-select-${name}`}
        >
            <option value="">Velg</option>
            {roles.map((role, i) => (
                <option key={i} value={role}>
                    {role}
                </option>
            ))}
        </Select>
    );
}
