import { Select } from "@navikt/ds-react";
import React, { ChangeEvent, useEffect, useState } from "react";

import { RolleType } from "../../../types/rolleveileder";

export interface IRoleSelectProps {
    name: string;
    defaultValue: string;
    onSelectRole: (data: ISelectData) => void;
    roles?: RolleType[];
    hideLabel?: boolean;
    className?: string;
    testId?: string;
}

export interface ISelectData {
    name: string;
    value: string;
}

export default function RoleSelect({
    roles = [RolleType.BP, RolleType.BM],
    name,
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
            label={`Hvilken rolle har ${name}`}
            size="small"
            hideLabel={hideLabel}
            value={selected.value}
            onChange={handleSelect}
            data-testid={testId ?? `test-role-select-${name}`}
        >
            <option value="">Velg</option>
            {roles.map((role, i) => {
                return (
                    <option key={i} value={role}>
                        {role}
                    </option>
                );
            })}
        </Select>
    );
}
