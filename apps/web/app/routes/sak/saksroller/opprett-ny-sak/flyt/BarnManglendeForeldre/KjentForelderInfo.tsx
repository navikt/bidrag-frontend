import type { PersonDto } from "@bidrag/api/PersonApi";
import { CheckmarkHeavyIcon } from "@navikt/aksel-icons";
import { BodyShort, Box, Heading, HStack, VStack } from "@navikt/ds-react";
import type { UseFormReturn } from "react-hook-form";
import PersonKort from "../../../felles/PersonKort";
import type { BarnMedManglendeForeldreSkjemaData, ForelderPartRolle } from "../../opprett-sak-schema";
import { hentForelderRolleLabel } from "../../utils";
import ForelderRolleVelger from "./ForelderRolleVelger";

type Props = {
    form: UseFormReturn<BarnMedManglendeForeldreSkjemaData>;
    forelder: PersonDto;
    onVelgRolle: (rolle: ForelderPartRolle) => void;
    valgtRolle: ForelderPartRolle | null;
};

export default function KjentForelderInfo({ form, forelder, onVelgRolle, valgtRolle }: Props) {
    const kjentForelder = form.watch("foreldre")[0];
    const kjentForelderRolle = kjentForelder?.rolle;
    const harRolle = kjentForelderRolle !== null && kjentForelderRolle !== undefined;

    return (
        <VStack gap="space-16">
            <Heading level="2" size="medium">
                Registrert forelder
            </Heading>

            <Box asChild borderRadius="8" background="accent-soft">
                <VStack gap="space-12" padding="space-16">
                    <PersonKort person={forelder} />

                    <ForelderRolleVelger
                        value={valgtRolle}
                        onChange={onVelgRolle}
                        error={form.formState?.errors?.foreldre?.[0]?.rolle?.message}
                        legend="Velg rolle for denne forelderen"
                    />

                    {harRolle && (
                        <HStack asChild align="center">
                            <BodyShort size="small" weight="semibold">
                                <CheckmarkHeavyIcon aria-hidden fontSize="1.3rem" /> Rolle valgt:{" "}
                                {hentForelderRolleLabel(kjentForelderRolle)}
                            </BodyShort>
                        </HStack>
                    )}
                </VStack>
            </Box>
        </VStack>
    );
}
