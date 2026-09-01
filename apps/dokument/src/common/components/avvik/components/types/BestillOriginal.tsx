import { BodyShort, Select } from "@navikt/ds-react";
import React from "react";
import { useForm } from "react-hook-form";

import { useHentSaksbehandlerEnhetsliste } from "../../../../../hooks/useOrganisasjonApi";
import { AvvikType } from "../../../../../types/api/AvvikTypes";
import type { Enhet } from "../../../../../types/enhet";
import { handleSubmitPreventPropagation } from "../../../form/FormUtils";
import AvvikModalButtons from "../AvvikModalButtons";
import Bekreftelse from "../Bekreftelse";
import type { AvvikTypeCommonProps } from "./AvvikTypes";

interface BestillOriginalProps extends AvvikTypeCommonProps {
    paloggetEnhet: string;
    enhetList?: Enhet[];
}

function BestillOriginal(props: BestillOriginalProps) {
    const handleSubmit = (values: BestillOriginalFirstStepValues) => {
        props.sendAvvik({
            type: AvvikType.BESTILL_ORIGINAL,
            enhetsnummer: values.enhetsnummer,
        });
        props.setActiveStep(2);
    };

    return (
        <>
            <BestillOriginalFirstStep
                isActive={props.activeStep === 1}
                defaultEnhetsnummer={props.paloggetEnhet}
                onSubmit={handleSubmit}
            />
            {props.activeStep === 2 && (
                <Bekreftelse>
                    <BodyShort>Bestill original fullført.</BodyShort>
                    <BodyShort>Dokumentet kan forventes om 1-5 dager.</BodyShort>
                </Bekreftelse>
            )}
        </>
    );
}

interface BestillOriginalFirstStepProps {
    isActive: boolean;
    defaultEnhetsnummer: string;
    onSubmit: (values: BestillOriginalFirstStepValues) => void;
}

interface BestillOriginalFirstStepValues {
    enhetsnummer: string;
}

function BestillOriginalFirstStep(props: BestillOriginalFirstStepProps) {
    const enhetList = useHentSaksbehandlerEnhetsliste();

    const { register, handleSubmit } = useForm<BestillOriginalFirstStepValues>({
        defaultValues: {
            enhetsnummer: props.defaultEnhetsnummer,
        },
    });

    if (!props.isActive) {
        return null;
    }

    const enhetOptions: { label: string; value: string }[] = enhetList
        ? enhetList.map((enhet) => ({
              label: `${enhet.enhetIdent} ${enhet.enhetNavn}`,
              value: enhet.enhetIdent,
          }))
        : [];

    return (
        <form onSubmit={handleSubmitPreventPropagation(handleSubmit(props.onSubmit))}>
            <BodyShort>Her kan du bestille det fysiske originaldokumentet.</BodyShort>
            <BodyShort>Originaler makuleres normalt etter ca. tre måneder.</BodyShort>
            {/*@ts-ignore*/}
            <Select
                name="enhetsnummer"
                label="Velg enhet dokumentet skal sendes til:"
                {...register("enhetsnummer")}
                size="small"
            >
                {enhetOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </Select>
            <AvvikModalButtons onSubmit={handleSubmit(props.onSubmit)} submitButtonLabel={"Bestill"} />
        </form>
    );
}

export default BestillOriginal;
