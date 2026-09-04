import { BodyShort, Textarea } from "@navikt/ds-react";
import { Controller, useForm } from "react-hook-form";

import { useHentJournalpost } from "../../../../../hooks/useDokumentApi";
import { AvvikType } from "../../../../../types/api/AvvikTypes";
import { handleSubmitPreventPropagation } from "../../../form/FormUtils";
import AvvikModalButtons from "../AvvikModalButtons";
import Bekreftelse from "../Bekreftelse";
import type { AvvikTypeCommonProps } from "./AvvikTypes";

const BESKRIVELSE_MAX_LENGTH = 1000;

function TrekkJournalpost(props: AvvikTypeCommonProps) {
    const journalpost = useHentJournalpost();
    const handleSubmit = (values: TrekkJournalpostFirstStepValues) => {
        props.sendAvvik({
            type: AvvikType.TREKK_JOURNALPOST,
            beskrivelse: values.beskrivelse,
        });
        props.setActiveStep(2);
    };

    return (
        <>
            {journalpost.isJoarkJournalpost ? (
                <TrekkJournalpostJoarkFirstStep isActive={props.activeStep === 1} onSubmit={handleSubmit} />
            ) : (
                <TrekkJournalpostFirstStep isActive={props.activeStep === 1} onSubmit={handleSubmit} />
            )}
            {props.activeStep === 2 && (
                <Bekreftelse>
                    <BodyShort>Journalposten er trukket.</BodyShort>
                    {journalpost.isJoarkJournalpost ? (
                        <BodyShort>
                            Journalposten er journalført på personens mappe og feilregistrert. Journalposten kan finnes
                            fram på personoversikten i GOSYS.
                        </BodyShort>
                    ) : (
                        <BodyShort>
                            Da den ikke er journalført er den verken knyttet til sak eller person, og er nå fjernet fra
                            Bisys.
                        </BodyShort>
                    )}
                </Bekreftelse>
            )}
        </>
    );
}

interface TrekkJournalpostFirstStepProps {
    isActive: boolean;
    onSubmit: (values: TrekkJournalpostFirstStepValues) => void;
}

interface TrekkJournalpostFirstStepValues {
    beskrivelse: string;
}

function TrekkJournalpostFirstStep(props: TrekkJournalpostFirstStepProps) {
    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<TrekkJournalpostFirstStepValues>({
        defaultValues: {
            beskrivelse: "",
        },
    });

    if (!props.isActive) {
        return null;
    }

    return (
        <form onSubmit={handleSubmitPreventPropagation(handleSubmit(props.onSubmit))}>
            <BodyShort>Det er mulig å trekke denne journalposten.</BodyShort>
            <BodyShort>
                Merk at den da vil bli borte fra Bisys, slik at det er viktig at du tar utskrift eller annet du skal
                gjøre med dokumentet før du utfører denne handlingen.
            </BodyShort>
            <Controller
                name="beskrivelse"
                control={control}
                rules={{
                    required: "Beskrivelse er påkrevd",
                    maxLength: {
                        value: BESKRIVELSE_MAX_LENGTH,
                        message: `Beskrivelse kan maksimalt inneholde ${BESKRIVELSE_MAX_LENGTH} tegn`,
                    },
                }}
                render={({ field: { name, value, onChange } }) => (
                    <Textarea
                        name={name}
                        value={value}
                        onChange={onChange}
                        label="Beskriv kort hvorfor journalposten skal trekkes fra Bisys, og hva du har gjort med dokumentene."
                        maxLength={BESKRIVELSE_MAX_LENGTH}
                        error={errors.beskrivelse?.message}
                    />
                )}
            />

            <AvvikModalButtons onSubmit={handleSubmit(props.onSubmit)} submitButtonLabel={"Trekk journalpost"} />
        </form>
    );
}

const BESKRIVELSE_JOARK_MAX_LENGTH = 100;

function TrekkJournalpostJoarkFirstStep(props: TrekkJournalpostFirstStepProps) {
    const methods = useForm<TrekkJournalpostFirstStepValues>({
        defaultValues: {
            beskrivelse: "",
        },
    });
    const {
        control,
        handleSubmit,
        formState: { errors },
    } = methods;

    if (!props.isActive) {
        return null;
    }

    return (
        <form onSubmit={handleSubmitPreventPropagation(handleSubmit(props.onSubmit))}>
            <BodyShort>
                Hvis journalposten ikke skal brukes i saksbehandling er det mulig å trekke denne journalposten
            </BodyShort>
            <BodyShort>
                Journalposten vil journalføres på personens mappe og kan finnes fram på personoversikten i GOSYS.
                Journalposten vil bli feilregistrert.
            </BodyShort>
            <br />
            <Controller
                name="beskrivelse"
                control={control}
                rules={{
                    required: "Begrunnelse er påkrevd",
                    maxLength: {
                        value: BESKRIVELSE_JOARK_MAX_LENGTH,
                        message: `Begrunnelse kan maksimalt inneholde ${BESKRIVELSE_JOARK_MAX_LENGTH} tegn`,
                    },
                }}
                render={({ field: { name, value, onChange } }) => (
                    <Textarea
                        name={name}
                        value={value}
                        onChange={onChange}
                        label={<>Skriv inn begrunnelse på hvorfor journalposten trekkes.</>}
                        maxLength={BESKRIVELSE_JOARK_MAX_LENGTH}
                        error={errors.beskrivelse?.message}
                    />
                )}
            />
            <AvvikModalButtons onSubmit={handleSubmit(props.onSubmit)} submitButtonLabel={"Trekk journalpost"} />
        </form>
    );
}

export default TrekkJournalpost;
