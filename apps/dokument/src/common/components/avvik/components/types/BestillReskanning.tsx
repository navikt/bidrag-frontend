import { BodyLong, BodyShort, Textarea } from "@navikt/ds-react";
import React from "react";
import { Controller, useForm } from "react-hook-form";

import { useHentJournalpost } from "../../../../../hooks/useDokumentApi";
import { AvvikType } from "../../../../../types/api/AvvikTypes";
import { JournalStatus } from "../../../../../types/api/JournalpostTypes";
import { handleSubmitPreventPropagation } from "../../../form/FormUtils";
import AvvikModalButtons from "../AvvikModalButtons";
import Bekreftelse from "../Bekreftelse";
import type { AvvikTypeCommonProps } from "./AvvikTypes";

const BESKRIVELSE_MAX_LENGTH = 1000;

function BestillReskanning(props: AvvikTypeCommonProps) {
    const handeSubmit = (values: BestillReskanningFirstStepValues) => {
        props.sendAvvik({ type: AvvikType.BESTILL_RESKANNING, beskrivelse: values.beskrivelse });
        props.setActiveStep(2);
    };
    const journalpost = useHentJournalpost();

    function renderJoarkDescription() {
        return (
            <BodyLong>
                {journalpost.journalstatus == JournalStatus.JOURNALFOERT
                    ? "Oppgave er opprettet til Fagpost og dokumentet er feilført. Etter reskanning er utført vil dokumentet settes til utgår og bli fjernet fra sakshistorikken."
                    : "Journalføringsoppgaven er overført til fagpost."}
                <br />
                Det vil opprettes ny journalføringsoppgave etter 1-5 dager når reskanning er utført.
                <br />
            </BodyLong>
        );
    }

    function renderBidragDescription() {
        return (
            <BodyLong>
                Dette dokumentet er satt til utgår. Det vil opprettes ny journalføringsoppgave etter 1-5 dager når
                reskanning er utført.
            </BodyLong>
        );
    }

    return (
        <>
            <BestillReskanningFirstStep isActive={props.activeStep === 1} onSubmit={handeSubmit} />
            {props.activeStep === 2 && (
                <Bekreftelse>
                    <BodyShort>Bestill reskanning fullført.</BodyShort>
                    <BodyLong>
                        {journalpost.isJoarkJournalpost ? renderJoarkDescription() : renderBidragDescription()}
                    </BodyLong>
                </Bekreftelse>
            )}
        </>
    );
}

interface BestillReskanningFirstStepProps {
    isActive: boolean;
    onSubmit: (values: BestillReskanningFirstStepValues) => void;
}

interface BestillReskanningFirstStepValues {
    beskrivelse: string;
}

function BestillReskanningFirstStep(props: BestillReskanningFirstStepProps) {
    const journalpost = useHentJournalpost();

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<BestillReskanningFirstStepValues>({
        defaultValues: {
            beskrivelse: "",
        },
    });

    if (!props.isActive) {
        return null;
    }

    function renderJoarkDescription() {
        return (
            <BodyLong>
                Dersom et skannet dokument er uleselig, eller er av dårlig kvalitet, kan det bestilles en reskanning.
                <br />
                {journalpost.journalstatus == JournalStatus.JOURNALFOERT
                    ? "Dette vil opprette oppgave til Fagpost og feilføre dokumentet. Etter reskanning er utført vil dokumentet settes til utgår og bli fjernet fra sakshistorikken."
                    : "Dette vil overføre journalføringsoppgaven til Fagpost."}
                <br />
                Det vil opprettes ny journalføringsoppgave etter 1-5 dager når reskanning er utført.
                <br />
            </BodyLong>
        );
    }

    function renderBidragDescription() {
        return (
            <BodyLong>
                Dersom et skannet dokument er uleselig, eller er av dårlig kvalitet, kan det bestilles en reskanning.
                <br />
                {journalpost.journalstatus == JournalStatus.JOURNALFOERT
                    ? "Dokumentet vil utgå."
                    : "Journalføringsoppgaven vil utgå."}
                <br />
                Det vil opprettes ny journalføringsoppgave etter 1-5 dager når reskanning er utført.
                <br />
                <br />
            </BodyLong>
        );
    }

    return (
        <form onSubmit={handleSubmitPreventPropagation(handleSubmit(props.onSubmit))}>
            {journalpost.isJoarkJournalpost ? renderJoarkDescription() : renderBidragDescription()}
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
                        label="Beskriv problemet:"
                        maxLength={BESKRIVELSE_MAX_LENGTH}
                        error={errors.beskrivelse?.message}
                    />
                )}
            />
            <AvvikModalButtons onSubmit={handleSubmit(props.onSubmit)} submitButtonLabel={"Bestill"} />
        </form>
    );
}

export default BestillReskanning;
