import { BodyLong, BodyShort, Textarea } from "@navikt/ds-react";
import React from "react";
import { Controller, useForm } from "react-hook-form";

import { useHentJournalpost } from "../../../../../servicesV2/useDokumentApi";
import { AvvikType } from "../../../../../types/api/AvvikTypes";
import { JournalStatus } from "../../../../../types/api/JournalpostTypes";
import { handleSubmitPreventPropagation } from "../../../form/FormUtils";
import AvvikModalButtons from "../AvvikModalButtons";
import Bekreftelse from "../Bekreftelse";
import type { AvvikTypeCommonProps } from "./AvvikTypes";

const BESKRIVELSE_MAX_LENGTH = 1000;

function BestillSplitting(props: AvvikTypeCommonProps) {
    const handleSubmit = (values: BestillSplittingFirstStepValues) => {
        props.sendAvvik({ type: AvvikType.BESTILL_SPLITTING, beskrivelse: values.beskrivelse });
        props.setActiveStep(2);
    };
    const journalpost = useHentJournalpost();

    function renderJoarkDescription() {
        return (
            <BodyLong>
                {journalpost.journalstatus == JournalStatus.JOURNALFOERT
                    ? "Oppgave er opprettet til Fagpost og dokumentet er feilført. Etter splitting er utført vil dokumentet settes til utgår og bli fjernet fra sakshistorikken."
                    : "Journalføringsoppgaven er overført til Fagpost."}
                <br />
                Det vil opprettes nye journalføringsoppgaver etter 1-5 dager når splitting er utført.
                <br />
            </BodyLong>
        );
    }

    function renderBidragDescription() {
        return (
            <BodyLong>
                Oppgave opprettet til skanningsenheten og dokumentet er satt til utgår.
                <br />
                Det vil opprettes nye journalføringsoppgaver etter 1-5 dager når splitting er utført.
                <br />
            </BodyLong>
        );
    }

    return (
        <>
            <BestillSplittingFirstStep isActive={props.activeStep === 1} onSubmit={handleSubmit} />
            {props.activeStep === 2 && (
                <Bekreftelse>
                    <BodyShort>Bestill splitting er fullført.</BodyShort>
                    {journalpost.isJoarkJournalpost ? renderJoarkDescription() : renderBidragDescription()}
                </Bekreftelse>
            )}
        </>
    );
}

interface BestillSplittingFirstStepProps {
    isActive: boolean;
    onSubmit: (values: BestillSplittingFirstStepValues) => void;
}

interface BestillSplittingFirstStepValues {
    beskrivelse: string;
}

function BestillSplittingFirstStep(props: BestillSplittingFirstStepProps) {
    const journalpost = useHentJournalpost();
    const defaultBeskrivelse = "Jeg ønsker å splitte etter side ";
    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<BestillSplittingFirstStepValues>({
        defaultValues: {
            beskrivelse: defaultBeskrivelse,
        },
    });

    if (!props.isActive) {
        return null;
    }

    function renderJoarkDescription() {
        return (
            <BodyLong>
                {journalpost.journalstatus == JournalStatus.JOURNALFOERT
                    ? "Dette vil opprette oppgave til Fagpost og feilføre dokumentet. Etter splitting er utført vil dokumentet settes til utgår og bli fjernet fra sakshistorikken."
                    : "Dette vil overføre journalføringsoppgaven til fagpost."}
                <br />
                Det vil opprettes nye oppgaver etter 1-5 dager når splitting er utført.
                <br />
                <br />
                Skriv inn hvilke(n) side(r) av filen du ønsker splittet. Oppgi de tre siste sifrene i endorsenummeret
                (står loddrett i margen til venstre eller nederst på siden) i alle sidene i dokumentet
            </BodyLong>
        );
    }

    function renderBidragDescription() {
        return (
            <BodyLong>
                Dette vil opprette oppgave til skanningsenheten og sette dokumentet til utgår.
                {journalpost.journalstatus == JournalStatus.JOURNALFOERT
                    ? "Dokumentet vil utgå."
                    : "Journalføringsoppgaven vil utgå."}
                <br />
                Det vil opprettes nye oppgaver etter 1-5 dager når splitting er utført.
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
                    validate: (val) => (val === defaultBeskrivelse ? "Du må gjøre endring på beskrivelse" : true),
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
                        label="Beskrivelse"
                        maxLength={BESKRIVELSE_MAX_LENGTH}
                        error={errors.beskrivelse?.message}
                    />
                )}
            />
            <AvvikModalButtons onSubmit={handleSubmit(props.onSubmit)} submitButtonLabel={"Send bestilling"} />
        </form>
    );
}

export default BestillSplitting;
