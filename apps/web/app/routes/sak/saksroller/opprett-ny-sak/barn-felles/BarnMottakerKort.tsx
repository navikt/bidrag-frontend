import { PersonIdent } from "@bidrag/common";
import { BodyShort, Box, Heading, VStack } from "@navikt/ds-react";
import type { UseFormReturn } from "react-hook-form";

import DiskresjonAlert from "../../components/DiskresjonAlert";
import ReellMottakerInline from "../components/ReellMottakerInline";
import type {
    BarnBeggForeldreSkjemaData,
    BarnMedManglendeForeldreSkjemaData,
    BarnMedReellMottaker,
} from "../opprett-sak-schema";

type FormType = UseFormReturn<BarnBeggForeldreSkjemaData> | UseFormReturn<BarnMedManglendeForeldreSkjemaData>;

type Props = {
    form: FormType;
    barn: BarnMedReellMottaker;
    visReellMottaker: boolean;
    erPåkrevd: boolean;
};

export default function BarnMottakerKort({ form, barn, visReellMottaker, erPåkrevd }: Props) {
    if (!visReellMottaker) {
        return null;
    }

    return (
        <VStack gap="space-12">
            <Heading level="2" size="medium">
                Barn
            </Heading>
            <Box padding="space-16" borderRadius="8" background="neutral-soft">
                <BodyShort size="medium" weight="semibold" textColor="default">
                    {barn.navn}
                </BodyShort>
                <BodyShort size="small" textColor="subtle">
                    <PersonIdent ident={barn.ident} />
                </BodyShort>
                {barn.diskresjonskode && <DiskresjonAlert diskresjonskode={barn.diskresjonskode} />}
                <Box marginBlock="space-4 space-0" paddingBlock="space-4 space-0">
                    <ReellMottakerInline
                        form={form}
                        fieldPath="barn"
                        barnIdent={barn.ident}
                        barnNavn={barn.navn}
                        isRequired={erPåkrevd}
                    />
                </Box>
            </Box>
        </VStack>
    );
}
