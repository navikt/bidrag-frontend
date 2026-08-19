import { BodyShort, Label, Textarea } from "@navikt/ds-react";
import { Matcher } from "@navikt/ds-react/esm/date/utils";
import dayjs from "dayjs";
import React from "react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { useHentJournalpost } from "../../../../../servicesV2/useDokumentApi";
import { AvvikType } from "../../../../../types/api/AvvikTypes";
import { formatDate } from "../../../../utils/DateUtils";
import CustomDatepicker from "../../../form/CustomDatepicker";
import { handleSubmitPreventPropagation } from "../../../form/FormUtils";
import AvvikModalButtons from "../AvvikModalButtons";
import Bekreftelse from "../Bekreftelse";
import { AvvikTypeCommonProps } from "./AvvikTypes";

function RegistrerRetur(props: AvvikTypeCommonProps) {
    const [submittedReturDato, setSubmittedReturDato] = useState<string>();
    const handeSubmit = (values: RegistrerReturFirstStepValues) => {
        props.sendAvvik({
            type: AvvikType.REGISTRER_RETUR,
            beskrivelse: values.beskrivelse,
            returDato: values.returDato,
        });
        setSubmittedReturDato(values.returDato);
        props.setActiveStep(2);
    };

    return (
        <>
            <RegistrerReturFirstStep isActive={props.activeStep === 1} onSubmit={handeSubmit} />
            {props.activeStep === 2 && (
                <Bekreftelse>
                    <BodyShort>Retur registrert med dato {formatDate(submittedReturDato)}</BodyShort>
                </Bekreftelse>
            )}
        </>
    );
}

interface RegistrerReturFirstStepProps {
    isActive: boolean;
    onSubmit: (values: RegistrerReturFirstStepValues) => void;
}

interface RegistrerReturFirstStepValues {
    beskrivelse: string;
    returDato: string;
}

function RegistrerReturFirstStep(props: RegistrerReturFirstStepProps) {
    const journalpostState = useHentJournalpost();

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<RegistrerReturFirstStepValues>();

    if (!props.isActive) {
        return null;
    }

    function getMaxValidDate() {
        return dayjs(new Date()).format("YYYY-MM-DD");
    }

    function getInvalidDates(): Matcher[] {
        return (
            journalpostState.returDetaljer?.logg.map((logg) => ({
                from: new Date(logg.dato),
                to: new Date(logg.dato),
            })) ?? []
        );
    }

    function isDateValid(date: string) {
        return !getInvalidDates().some((invalidDate) => invalidDate.from === date);
    }

    return (
        <form onSubmit={handleSubmitPreventPropagation(handleSubmit(props.onSubmit))}>
            <BodyShort>Dersom brev har kommet i retur kan returdato og kommentar registreres</BodyShort>
            <div>
                <Controller
                    name="returDato"
                    control={control}
                    rules={{
                        required: "Returdato er påkrevd",
                        validate: (date) => {
                            if (isDateValid(date)) {
                                return true;
                            }
                            return "Ugyldig dato. Kan ikke registrere retur på eksisterende returdato";
                        },
                    }}
                    render={({ field: { name, value, onChange } }) => (
                        <div style={{ paddingBottom: "16px" }}>
                            <Label htmlFor={name}>{"Retur dato"}</Label>
                            <CustomDatepicker
                                name={name}
                                value={value}
                                initialValue={value}
                                onChange={onChange}
                                error={errors?.returDato?.message}
                                maxValidDate={getMaxValidDate()}
                                invalidDateRanges={getInvalidDates()}
                            />
                        </div>
                    )}
                />
                <Controller
                    name="beskrivelse"
                    control={control}
                    rules={{
                        required: "Kommentar er påkrevd",
                    }}
                    render={({ field: { name, value, onChange } }) => (
                        <Textarea
                            name={name}
                            value={value ?? ""}
                            onChange={onChange}
                            label="Kommentar"
                            maxLength={1000}
                            error={errors.beskrivelse?.message}
                        />
                    )}
                />
            </div>
            <AvvikModalButtons onSubmit={handleSubmit(props.onSubmit)} submitButtonLabel={"Registrer"} />
        </form>
    );
}

export default RegistrerRetur;
