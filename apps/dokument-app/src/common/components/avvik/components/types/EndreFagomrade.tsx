import { Alert, BodyShort, Checkbox, Select } from "@navikt/ds-react";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import type { JournalforendeEnhetDto } from "../../../../../api/BidragOrganisasjonApi";
import { useHentJournalpost } from "../../../../../servicesV2/useDokumentApi";
import { useHentJournalforendeEnheter } from "../../../../../servicesV2/useOrganisasjonApi";
import { useAppContext } from "../../../../../store/AppContext";
import { AvvikType } from "../../../../../types/api/AvvikTypes";
import { BidragEnhet } from "../../../../../types/enhet";
import { FAGOMRADE } from "../../../../../types/enum/Fagomrade";
import type { Journalpost } from "../../../../../types/journalpost";
import Dokumenter from "../../../dokument/Dokumenter";
import { handleSubmitPreventPropagation } from "../../../form/FormUtils";
import AvvikModalButtons from "../AvvikModalButtons";
import Bekreftelse from "../Bekreftelse";
import {
    type AvvikTypeCommonProps,
    erFarskapBehandledeEnhet,
    fagomradeOptions,
    skalOverføreTilFarskapEnhet,
} from "./AvvikTypes";

function overførFarskapTekst(journalpost: Journalpost, påloggetEnhet: string, farskapEnhet: JournalforendeEnhetDto) {
    if (journalpost.fagomrade == FAGOMRADE.FAR) return null;
    return skalOverføreTilFarskapEnhet(påloggetEnhet, FAGOMRADE.FAR, journalpost) ? (
        <>
            <br />
            Hvis du velger å endre til fagområde Farskap vil tilhørende oppgaver overføres til enhet{" "}
            <i>
                {farskapEnhet.enhetIdent} {farskapEnhet.enhetNavn}
            </i>
        </>
    ) : (
        <>
            <br />
            Hvis du velger å endre til fagområde Farskap og ikke har farskapstilgang vil oppgaven flyttes til
            fellesbenken
        </>
    );
}
export function overførOppgaveTekst(
    journalpost: Journalpost,
    påloggetEnhet: string,
    farskapEnhet: JournalforendeEnhetDto,
) {
    return (
        <>
            Dette vil overføre journalpost til valgt fagområde.
            <br /> Hvis du velger å overføre journalposten til et annet fagområde enn <i>Bidrag</i> eller <i>Farskap</i>{" "}
            vil også tilhørende oppgaver overføres til valgt fagområde.
            <br />
            {overførFarskapTekst(journalpost, påloggetEnhet, farskapEnhet)}
        </>
    );
}
interface EndreFagomradeProps extends AvvikTypeCommonProps {
    journalpost: Journalpost;
}

function EndreFagomrade(props: EndreFagomradeProps) {
    const [fagomrade, setFagomrade] = useState("");
    const {
        appState: { påloggetEnhet },
    } = useAppContext();
    const journalpost = useHentJournalpost();

    const handleSubmitFirstStep = async (values: EndreFagomradeFirstStepValues) => {
        setFagomrade(values.fagomrade);
        const journalpostEnhet = props.journalpost.journalforendeEnhet;

        if (values.fagomrade === FAGOMRADE.FAR || values.fagomrade === FAGOMRADE.BID) {
            if (
                skalOverføreTilFarskapEnhet(påloggetEnhet, values.fagomrade, journalpost) &&
                BidragEnhet.FARSKAP != påloggetEnhet
            ) {
                await props.sendAvvik({
                    type: AvvikType.OVERFOR_TIL_ANNEN_ENHET,
                    nyttEnhetsnummer: BidragEnhet.FARSKAP,
                    gammeltEnhetsnummer: påloggetEnhet,
                });
            } else if (
                journalpostEnhet != null &&
                påloggetEnhet != journalpostEnhet &&
                erFarskapBehandledeEnhet(påloggetEnhet)
            ) {
                await props.sendAvvik({
                    type: AvvikType.OVERFOR_TIL_ANNEN_ENHET,
                    nyttEnhetsnummer: påloggetEnhet,
                    gammeltEnhetsnummer: journalpostEnhet,
                });
            }
            await props.sendAvvik({
                type: AvvikType.ENDRE_FAGOMRADE,
                fagomrade: values.fagomrade,
                bekreftetSendtScanning: false,
            });
            props.setActiveStep(3);
        } else {
            props.setActiveStep(2);
        }
    };

    const handleSubmitSecondsStep = (values: EndreFagomradeSecondStepValues) => {
        props.sendAvvik({
            type: AvvikType.ENDRE_FAGOMRADE,
            fagomrade: fagomrade,
            bekreftetSendtScanning: values.bekreftetSendtScanning,
        });
        props.setActiveStep(3);
    };

    return (
        <>
            <EndreFagomradeFirstStep isActive={props.activeStep === 1} onSubmit={handleSubmitFirstStep} />
            <EndreFagomradeSecondStep
                isActive={props.activeStep === 2}
                fagomrade={fagomrade}
                journalpost={props.journalpost}
                onSubmit={handleSubmitSecondsStep}
            />
            {props.activeStep === 3 && <EndreFagomradeBekreftelse fagomrade={fagomrade} />}
        </>
    );
}

interface EndreFagomradeFirstStepProps {
    isActive: boolean;
    onSubmit: (values: EndreFagomradeFirstStepValues) => void;
}

interface EndreFagomradeFirstStepValues {
    fagomrade: string;
}

function EndreFagomradeFirstStep(props: EndreFagomradeFirstStepProps) {
    const {
        appState: { påloggetEnhet },
    } = useAppContext();
    const journalforendeEnhetList = useHentJournalforendeEnheter();
    const journalpost = useHentJournalpost();
    const { register, handleSubmit, watch } = useForm<EndreFagomradeFirstStepValues>({
        defaultValues: {
            fagomrade: "AAP",
        },
    });

    if (!props.isActive) {
        return null;
    }

    function getBeskrivelse() {
        const farskapEnhet = journalforendeEnhetList.find((e) => e.enhetIdent == BidragEnhet.FARSKAP);

        return <BodyShort spacing>{overførOppgaveTekst(journalpost, påloggetEnhet, farskapEnhet)}</BodyShort>;
    }

    return (
        <form onSubmit={handleSubmitPreventPropagation(handleSubmit(props.onSubmit))}>
            {getBeskrivelse()}
            <Select
                className={"w-max"}
                size={"small"}
                label="Velg fagområde"
                name="fagomrade"
                {...register("fagomrade")}
            >
                {fagomradeOptions
                    .filter((b) => b.value != journalpost.fagomrade)
                    .sort((a, b) => {
                        if (a.label < b.label) {
                            return -1;
                        }
                        if (a.label > b.label) {
                            return 1;
                        }
                        return 0;
                    })
                    .map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
            </Select>
            <AvvikModalButtons onSubmit={handleSubmit(props.onSubmit)} />
        </form>
    );
}

interface EndreFagomradeSecondStepProps {
    isActive: boolean;
    fagomrade: string;
    journalpost: Journalpost;
    onSubmit: (values: EndreFagomradeSecondStepValues) => void;
}

interface EndreFagomradeSecondStepValues {
    bekreftetSendtScanning: boolean;
}

function EndreFagomradeSecondStep(props: EndreFagomradeSecondStepProps) {
    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<EndreFagomradeSecondStepValues>({
        defaultValues: {
            bekreftetSendtScanning: false,
        },
        mode: "onSubmit",
        reValidateMode: "onChange",
    });

    const fagomradeOpt = fagomradeOptions.find((opt) => opt.value === props.fagomrade);
    const fagomradeLabel = fagomradeOpt ? fagomradeOpt.label || props.fagomrade : props.fagomrade;

    if (!props.isActive) {
        return null;
    }

    return (
        <form onSubmit={handleSubmitPreventPropagation(handleSubmit(props.onSubmit))}>
            <Alert variant="warning">
                <BodyShort>
                    Dokumentet kan dessverre ikke overføres elektronisk til fagområdet {fagomradeLabel}. Vennligst skriv
                    ut dokumentet, samt forside fra Gosys med riktig tema for personen det gjelder, og send til skanning
                    i Gosys.
                </BodyShort>
                <Dokumenter dokumenter={props.journalpost.dokumenter} journalpostId={props.journalpost.journalpostId} />
                <Controller
                    name="bekreftetSendtScanning"
                    control={control}
                    rules={{ required: "Du må bekrefte at dokumentet er printet og videresendt" }}
                    render={(props) => (
                        <Checkbox
                            className="EndreFagomrade__checkbox"
                            name="bekreftetSendtScanning"
                            checked={props.field.value}
                            onChange={props.field.onChange}
                            error={errors.bekreftetSendtScanning?.message != null}
                        >
                            Bekreft at dokumentet er printet og videresendt
                        </Checkbox>
                    )}
                />
            </Alert>
            <AvvikModalButtons onSubmit={handleSubmit(props.onSubmit)} submitButtonLabel={"Overfør"} />
        </form>
    );
}

interface EndreFagomradeBekreftelseProps {
    fagomrade: string;
}

function EndreFagomradeBekreftelse(props: EndreFagomradeBekreftelseProps) {
    let message;
    if (props.fagomrade === FAGOMRADE.BID) {
        message = "Fagområdet er endret til Bidrag.";
    } else if (props.fagomrade === FAGOMRADE.FAR) {
        message = "Fagområdet er endret til Farskap.";
    } else {
        message = "Dokumentet er fjernet fra Bisys. Husk å sende utskriften med forside til skanning i Gosys.";
    }

    return (
        <Bekreftelse>
            <BodyShort>{message}</BodyShort>
        </Bekreftelse>
    );
}

export default EndreFagomrade;
