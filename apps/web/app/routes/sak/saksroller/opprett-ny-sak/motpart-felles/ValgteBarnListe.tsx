import { XMarkIcon } from "@navikt/aksel-icons";
import { BodyShort, Box, Button, Heading, type HeadingProps, HGrid, HStack } from "@navikt/ds-react";
import type { FieldValues, UseFormReturn } from "react-hook-form";

import BarnKort from "../../felles/BarnKort";
import ReellMottakerInline from "../components/ReellMottakerInline";
import type { BarnMedAlder } from "../opprett-sak-schema";
import { type ReellMottakerRegel, reellMottakerValgregel } from "../reell-mottaker-regel";

type Props<TFieldValues extends FieldValues & { valgteBarn: BarnMedAlder[] }> = {
    form: UseFormReturn<TFieldValues>;
    tittel: string;
    valgteBarn: BarnMedAlder[];
    alleBarn: BarnMedAlder[];
    fjernBarn: (ident: string) => void;
    heading: Omit<HeadingProps, "children">;
    reellMottakerRegel: ReellMottakerRegel;
};

export default function ValgteBarnListe<TFieldValues extends FieldValues & { valgteBarn: BarnMedAlder[] }>({
    form,
    tittel,
    heading,
    valgteBarn,
    alleBarn,
    fjernBarn,
    reellMottakerRegel,
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
                    <BodyShort size="small" weight="semibold">
                        {valgteBarn.length} valgt
                    </BodyShort>
                </Box>
            </HStack>

            <HGrid columns={{ xs: 1, lg: 2, xl: 3 }} gap="space-16" align="start">
                {valgteBarn.map((barn) => {
                    const barnIndex = alleBarn.findIndex((b) => b.ident === barn.ident);

                    return (
                        <BarnKort
                            key={barn.ident}
                            barn={{
                                ident: barn.ident,
                                navn: barn.navn,
                                fødselsdato: barn.fødselsdato,
                                alder: barn.alder,
                                diskresjonskode: barn.diskresjonskode,
                            }}
                            actions={
                                <HStack justify="end">
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
                            }
                        >
                            {reellMottakerRegel.type !== "skjult" && barnIndex !== -1 && (
                                <Box marginBlock="space-4 space-0" paddingBlock="space-4 space-0">
                                    <ReellMottakerInline
                                        form={form}
                                        fieldPath={`valgteBarn.${barnIndex}`}
                                        barnIdent={barn.ident}
                                        barnNavn={barn.navn}
                                        regel={reellMottakerValgregel(reellMottakerRegel, barn.erMyndig)}
                                    />
                                </Box>
                            )}
                        </BarnKort>
                    );
                })}
            </HGrid>
        </Box>
    );
}
