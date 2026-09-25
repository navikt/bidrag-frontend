import type { PersonDto } from "@bidrag/api/PersonApi";
import { Radio, RadioGroup, Stack } from "@navikt/ds-react";
import { type PartRolle, PartRolleSchema } from "./opprett-sak-schema";
import { filtrerSaksroller, type SaksrolleAlternativ } from "./saksrolle-regler";
import { useSaksrolleroversikt } from "./saksrolleroversiktContext";

type Props = {
    partISaken: PersonDto;
    enforcedRolle: PartRolle | null;
};

export default function SaksrolleVelger({ partISaken, enforcedRolle }: Props) {
    const {
        velgRolle,
        partISakenAlder,
        partISaken: partISakenSkjemaData,
        sakstype,
        isLoadingOpprettSak,
    } = useSaksrolleroversikt();

    const valgtRolle = partISakenSkjemaData?.rolle ?? null;
    const alternativer = filtrerSaksroller(sakstype, partISakenAlder, skjemaPartRoller);

    const velgSaksrolle = (valgteRolle: string) => {
        if (isLoadingOpprettSak) return;
        const result = PartRolleSchema.safeParse(valgteRolle);

        if (!result.success || !alternativer.some((valg) => valg.value === result.data)) {
            return;
        }

        if (partISakenSkjemaData?.rolle === result.data) {
            return;
        }

        velgRolle(result.data);
    };

    return (
        <RadioGroup
            legend={`Hvilken rolle har ${partISaken.visningsnavn}?`}
            value={valgtRolle ?? undefined}
            onChange={velgSaksrolle}
            size="small"
            readOnly={!!enforcedRolle || isLoadingOpprettSak}
        >
            <Stack gap="space-0 space-24" direction={{ xs: "column", sm: "row" }} wrap={false}>
                {alternativer.map((alternativ) => (
                    <Radio key={alternativ.value} value={alternativ.value}>
                        {alternativ.label}
                    </Radio>
                ))}
            </Stack>
        </RadioGroup>
    );
}

const skjemaPartRoller: SaksrolleAlternativ[] = [
    { label: "Bidragspliktig", value: "bidragspliktig" },
    { label: "Bidragsmottaker", value: "bidragsmottaker" },
    { label: "Barn over 18 år", value: "barn_over_18" },
    { label: "Barn under 18 år", value: "barn_under_18" },
];
