import type { PersonDto } from "@bidrag/api/PersonApi";
import { CheckmarkHeavyIcon, PersonIcon } from "@navikt/aksel-icons";
import { BodyShort, Box, Heading, HStack, VStack } from "@navikt/ds-react";
import type { UseFormReturn } from "react-hook-form";

import DiskresjonAlert from "../../../components/DiskresjonAlert";
import PersonInfo from "../../../components/PersonInfo";
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

            <Box asChild borderRadius="8" borderWidth="1" borderColor="neutral-subtleA" background="accent-soft">
                <VStack gap="space-12" padding="space-16">
                    <VStack marginBlock="space-0 space-16">
                        <HStack align="start" gap="space-12">
                            <Box asChild marginBlock="space-4 space-0">
                                <PersonIcon fontSize="1.5rem" aria-hidden className="text-ax-accent-700" />
                            </Box>
                            <PersonInfo
                                navn={forelder.visningsnavn}
                                ident={forelder.ident}
                                fødselsdato={forelder.fødselsdato ?? undefined}
                            />
                            {forelder.diskresjonskode && <DiskresjonAlert diskresjonskode={forelder.diskresjonskode} />}
                        </HStack>
                    </VStack>

                    <ForelderRolleVelger
                        value={valgtRolle}
                        onChange={onVelgRolle}
                        error={form.formState?.errors?.foreldre?.[0]?.rolle?.message}
                        legend="Velg rolle for denne forelderen"
                    />

                    {harRolle && (
                        <HStack asChild align="center">
                            <BodyShort size="small" weight="semibold" className="text-ax-success-800">
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
