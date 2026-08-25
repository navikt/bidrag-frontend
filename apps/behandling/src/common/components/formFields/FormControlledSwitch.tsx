import { Switch } from "@navikt/ds-react";
import type { BaseSyntheticEvent } from "react";
import { useController, useFormContext } from "react-hook-form";
import { useBehandlingProvider } from "../../context/BehandlingContext";

export const FormControlledSwitch = ({
    name,
    legend,
    onChange,
    className,
    readOnly,
    loading,
}: {
    name: string;
    legend: string;
    onChange?: (checked: boolean) => void;
    className?: string;
    readOnly?: boolean;
    loading?: boolean;
}) => {
    const { control } = useFormContext();
    const { lesemodus } = useBehandlingProvider();
    const { field } = useController({ name, control });

    const handleOnChange = (value: BaseSyntheticEvent) => {
        field.onChange(value.target.checked);
        onChange?.(value.target.checked);
    };

    return (
        <Switch
            {...field}
            checked={field.value}
            className={className}
            onChange={handleOnChange}
            size="small"
            readOnly={lesemodus || readOnly}
            loading={loading}
        >
            {legend}
        </Switch>
    );
};
