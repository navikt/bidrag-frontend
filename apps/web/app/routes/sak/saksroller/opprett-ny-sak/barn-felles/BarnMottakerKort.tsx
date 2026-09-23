import { BodyShort } from "@navikt/ds-react";
import type { UseFormReturn } from "react-hook-form";

import PersonKort from "../../felles/PersonKort";
import ReellMottakerInline from "../components/ReellMottakerInline";
import SkjemaSeksjon from "../felles/SkjemaSeksjon";
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
    kanVelge: boolean;
};

export default function BarnMottakerKort({ form, barn, erPåkrevd, kanVelge }: Props) {
    return (
        <SkjemaSeksjon tittel="Barn" beskrivelse="Kontroller barnet og velg reell mottaker.">
            <PersonKort
                person={{
                    ident: barn.ident,
                    visningsnavn: barn.navn,
                    diskresjonskode: barn.diskresjonskode,
                }}
            >
                {kanVelge ? (
                    <ReellMottakerInline
                        form={form}
                        fieldPath="barn"
                        barnIdent={barn.ident}
                        barnNavn={barn.navn}
                        regel={erPåkrevd ? "påkrevd" : "valgfri"}
                    />
                ) : (
                    <BodyShort size="small" textColor="subtle">
                        Velg roller for foreldrene før du velger reell mottaker.
                    </BodyShort>
                )}
            </PersonKort>
        </SkjemaSeksjon>
    );
}
