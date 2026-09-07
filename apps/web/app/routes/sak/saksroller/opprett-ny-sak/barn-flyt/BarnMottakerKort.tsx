import { PersonIdent } from "@bidrag/common";
import { BodyShort, Heading } from "@navikt/ds-react";
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
        <div className="space-y-3">
            <Heading level="2" size="medium">
                Barn
            </Heading>
            <div className="p-4 rounded-lg bg-ax-neutral-100">
                <BodyShort size="medium" className="font-semibold text-ax-neutral-1000">
                    {barn.navn}
                </BodyShort>
                <BodyShort size="small" className="text-ax-neutral-700">
                    <PersonIdent ident={barn.ident} />
                </BodyShort>
                {barn.diskresjonskode && <DiskresjonAlert diskresjonskode={barn.diskresjonskode} />}
                <div className="mt-1 pt-1">
                    <ReellMottakerInline
                        form={form}
                        fieldPath="barn"
                        barnIdent={barn.ident}
                        barnNavn={barn.navn}
                        isRequired={erPåkrevd}
                    />
                </div>
            </div>
        </div>
    );
}
