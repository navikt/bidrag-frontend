import type { UseFormReturn } from "react-hook-form";
import type { SakRedigeringData } from "../../felles/sakvisning-schema.ts";

export function fjernRolle(form: UseFormReturn<SakRedigeringData>, fodselsnummer: string) {
    const roller = form.getValues("roller") ?? [];
    form.setValue(
        "roller",
        roller.filter((rolle) => rolle.fodselsnummer !== fodselsnummer),
        { shouldValidate: true },
    );
}
