import React from "react";

export interface SelectOption {
    label: string;
    value: string;
}

interface SelectGroupProps {
    options: SelectOption[];
    groupLabel: string;
}

export default function SelectGroup({ options, groupLabel }: SelectGroupProps) {
    return (
        <optgroup label={groupLabel}>
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </optgroup>
    );
}
