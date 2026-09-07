import { Radio, RadioGroup, Stack } from "@navikt/ds-react";
import { Controller, type Path, type UseFormReturn } from "react-hook-form";

import type { Sakskategori } from "./saksrolleroversiktContext";

type FormProps<T extends { kategori: Sakskategori }> = {
    form: UseFormReturn<T>;
};

type ControlledProps = {
    value: Sakskategori;
    onChange: (value: Sakskategori) => void;
    error?: string;
};

export default function SakskategoriVelger<T extends { kategori: Sakskategori }>(
    props: FormProps<T> | ControlledProps,
) {
    if ("form" in props) {
        return (
            <div>
                <Controller
                    name={"kategori" as Path<T>}
                    control={props.form.control}
                    render={({ field, fieldState }) => (
                        <RadioGroup
                            {...field}
                            legend="Velg om saken gjelder nasjonal eller internasjonal bidragssak"
                            size="small"
                            value={field.value}
                            error={fieldState.error?.message}
                        >
                            <Stack gap="space-4" direction={{ xs: "column", sm: "row" }} wrap={false}>
                                <Radio value="Nasjonal">Nasjonal</Radio>
                                <Radio value="Utland">Utland</Radio>
                            </Stack>
                        </RadioGroup>
                    )}
                />
            </div>
        );
    }

    return (
        <div>
            <RadioGroup
                legend="Velg om saken gjelder nasjonal eller internasjonal bidragssak"
                size="small"
                value={props.value}
                onChange={(value) => props.onChange(value as Sakskategori)}
                error={props.error}
            >
                <Stack gap="space-4" direction={{ xs: "column", sm: "row" }} wrap={false}>
                    <Radio value="Nasjonal">Nasjonal</Radio>
                    <Radio value="Utland">Utland</Radio>
                </Stack>
            </RadioGroup>
        </div>
    );
}
