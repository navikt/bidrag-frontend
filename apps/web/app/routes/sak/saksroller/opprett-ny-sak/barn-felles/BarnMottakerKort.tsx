import { Heading, VStack } from "@navikt/ds-react";
import type { UseFormReturn } from "react-hook-form";

import PersonKort from "../../felles/PersonKort";
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
    erPåkrevd: boolean;
};

export default function BarnMottakerKort({ form, barn, erPåkrevd }: Props) {
    return (
        <VStack gap="space-12">
            <Heading level="2" size="medium">
                Barn
            </Heading>
            <PersonKort
                person={{
                    ident: barn.ident,
                    visningsnavn: barn.navn,
                    diskresjonskode: barn.diskresjonskode,
                }}
            >
                <ReellMottakerInline
                    form={form}
                    fieldPath="barn"
                    barnIdent={barn.ident}
                    barnNavn={barn.navn}
                    regel={erPåkrevd ? "påkrevd" : "valgfri"}
                />
            </PersonKort>
        </VStack>
    );
}
