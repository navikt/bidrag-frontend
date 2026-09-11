import { HStack, Radio, RadioGroup } from "@navikt/ds-react";
import { type ForelderPartRolle, ForelderPartRolleSchema } from "../../opprett-sak-schema";
import { hentForelderRolleLabel } from "../../utils";

type Props = {
    value: ForelderPartRolle | null;
    onChange: (rolle: ForelderPartRolle) => void;
    error?: string;
    legend?: string;
};

export default function ForelderRolleVelger({ value, onChange, error, legend = "Velg rolle" }: Props) {
    return (
        <RadioGroup
            legend={legend}
            size="small"
            value={value || ""}
            onChange={(val) => onChange(val as ForelderPartRolle)}
            error={error}
        >
            <HStack gap="space-12">
                {ForelderPartRolleSchema.options.map((rolle) => (
                    <Radio key={rolle} value={rolle}>
                        {hentForelderRolleLabel(rolle)}
                    </Radio>
                ))}
            </HStack>
        </RadioGroup>
    );
}
