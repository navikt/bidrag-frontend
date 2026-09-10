import { XMarkIcon } from "@navikt/aksel-icons";
import { BodyShort, Box, Button, Heading, type HeadingProps, HStack, VStack } from "@navikt/ds-react";
import type { FieldValues, UseFormReturn } from "react-hook-form";

import DiskresjonAlert from "../../components/DiskresjonAlert";
import PersonInfo from "../../components/PersonInfo";
import ReellMottakerInline from "../components/ReellMottakerInline";
import type { BarnMedAlder } from "../opprett-sak-schema";

type Props<TFieldValues extends FieldValues & { valgteBarn: BarnMedAlder[] }> = {
    form: UseFormReturn<TFieldValues>;
    tittel: string;
    valgteBarn: BarnMedAlder[];
    alleBarn: BarnMedAlder[];
    fjernBarn: (ident: string) => void;
    heading: Omit<HeadingProps, "children">;
    visReellMottaker: boolean;
    bidragsmottakerErUkjent: boolean;
    reellMottakerAlltidPåkrevd: boolean;
    kunSamhandlerSomReellMottaker: boolean;
};

export default function ValgteBarnListe<TFieldValues extends FieldValues & { valgteBarn: BarnMedAlder[] }>({
    form,
    tittel,
    heading,
    valgteBarn,
    alleBarn,
    fjernBarn,
    visReellMottaker,
    bidragsmottakerErUkjent,
    reellMottakerAlltidPåkrevd,
    kunSamhandlerSomReellMottaker,
}: Props<TFieldValues>) {
    if (valgteBarn.length === 0) {
        return;
    }

    return (
        <Box paddingBlock="space-24 space-0">
            <HStack align="center" justify="space-between" marginBlock="space-0 space-12">
                <Heading {...heading}>{tittel}</Heading>
                <Box
                    asChild
                    background="accent-moderate"
                    paddingInline="space-12"
                    paddingBlock="space-4"
                    borderRadius="full"
                >
                    <BodyShort size="small" weight="semibold" className="text-ax-accent-800">
                        {valgteBarn.length} valgt
                    </BodyShort>
                </Box>
            </HStack>

            <VStack gap="space-12">
                {valgteBarn.map((barn) => {
                    const barnIndex = alleBarn.findIndex((b) => b.ident === barn.ident);
                    const erReellMottakerPåkrevd =
                        reellMottakerAlltidPåkrevd || barn.erMyndig || bidragsmottakerErUkjent;

                    return (
                        <Box key={barn.ident} padding="space-16" background="neutral-soft" borderRadius="8">
                            <HStack align="start" justify="space-between">
                                <Box flexGrow="1">
                                    <PersonInfo
                                        ident={barn.ident}
                                        fødselsdato={barn.fødselsdato}
                                        alder={barn.alder}
                                        navn={barn.navn}
                                    />
                                    {barn?.diskresjonskode && (
                                        <DiskresjonAlert diskresjonskode={barn.diskresjonskode} />
                                    )}
                                </Box>
                                <Button
                                    type="button"
                                    variant="tertiary-neutral"
                                    size="small"
                                    onClick={() => fjernBarn(barn.ident)}
                                    icon={<XMarkIcon aria-hidden />}
                                >
                                    Fjern
                                </Button>
                            </HStack>
                            {visReellMottaker && barnIndex !== -1 && (
                                <Box marginBlock="space-4 space-0" paddingBlock="space-4 space-0">
                                    <ReellMottakerInline
                                        form={form}
                                        fieldPath={`valgteBarn.${barnIndex}`}
                                        barnIdent={barn.ident}
                                        barnNavn={barn.navn}
                                        isRequired={erReellMottakerPåkrevd}
                                        kunSamhandlerSomReellMottaker={kunSamhandlerSomReellMottaker}
                                    />
                                </Box>
                            )}
                        </Box>
                    );
                })}
            </VStack>
        </Box>
    );
}
