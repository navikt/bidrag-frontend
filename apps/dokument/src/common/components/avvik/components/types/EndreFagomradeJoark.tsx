import { BodyShort, Select } from "@navikt/ds-react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";

import { useHentJournalpost } from "../../../../../hooks/useDokumentApi";
import { useHentJournalforendeEnheter } from "../../../../../hooks/useOrganisasjonApi";
import { useAppContext } from "../../../../../store/AppContext";
import { AvvikType } from "../../../../../types/api/AvvikTypes";
import { BidragEnhet } from "../../../../../types/enhet";
import { FAGOMRADE } from "../../../../../types/enum/Fagomrade";
import type { Journalpost } from "../../../../../types/journalpost";
import { handleSubmitPreventPropagation } from "../../../form/FormUtils";
import AvvikModalButtons from "../AvvikModalButtons";
import Bekreftelse from "../Bekreftelse";
import {
    type AvvikTypeCommonProps,
    erFarskapBehandledeEnhet,
    joarkOverforFagomraderOptions,
    skalOverføreTilFarskapEnhet,
} from "./AvvikTypes";
import { overførOppgaveTekst } from "./EndreFagomrade";

interface EndreFagomradeProps extends AvvikTypeCommonProps {
    journalpost: Journalpost;
}

function EndreFagomradeJoark(props: EndreFagomradeProps) {
    const {
        appState: { påloggetEnhet },
    } = useAppContext();
    const journalpost = useHentJournalpost();
    const [fagomrade, setFagomrade] = useState("");
    const handleSubmitFirstStep = async (values: EndreFagomradeFirstStepValues) => {
        setFagomrade(values.fagomrade);
        const journalpostEnhet = props.journalpost.journalforendeEnhet;
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
        });
        props.setActiveStep(2);
    };

    return (
        <>
            <EndreFagomradeFirstStep
                isActive={props.activeStep === 1}
                onSubmit={handleSubmitFirstStep}
                journalpost={props.journalpost}
            />
            {props.activeStep === 2 && (
                <EndreFagomradeBekreftelse fagomrade={fagomrade} journalpost={props.journalpost} />
            )}
        </>
    );
}

interface EndreFagomradeFirstStepProps {
    isActive: boolean;
    journalpost: Journalpost;
    onSubmit: (values: EndreFagomradeFirstStepValues) => void;
}

interface EndreFagomradeFirstStepValues {
    fagomrade: string;
}

function EndreFagomradeFirstStep(props: EndreFagomradeFirstStepProps) {
    const {
        appState: { påloggetEnhet, saksnummer },
    } = useAppContext();
    const journalforendeEnhetList = useHentJournalforendeEnheter();
    const journalpost = useHentJournalpost();

    const { register, handleSubmit, watch } = useForm<EndreFagomradeFirstStepValues>({
        defaultValues: {
            fagomrade: "BAR",
        },
    });

    if (!props.isActive) {
        return null;
    }

    function showInfo() {
        if (!props.journalpost.isJoarkJournalpost) {
            return;
        }
        if (props.journalpost.isStatusMottatt) {
            const farskapEnhet = journalforendeEnhetList.find((e) => e.enhetIdent == BidragEnhet.FARSKAP);

            return <BodyShort spacing>{overførOppgaveTekst(journalpost, påloggetEnhet, farskapEnhet)}</BodyShort>;
        } else {
            return (
                <BodyShort spacing>
                    Dette vil kopiere og sende journalposten til valgt fagområde. Ny journalføringsoppgave vil bli
                    opprettet for journalposten.
                    <br />I tillegg vil Bidrag journalpostens tilknytning til sak {saksnummer} bli slettet.
                </BodyShort>
            );
        }
    }

    return (
        <div className={"endrefagomrade_joark"}>
            {showInfo()}
            <form onSubmit={handleSubmitPreventPropagation(handleSubmit(props.onSubmit))}>
                <Select
                    className={"w-max"}
                    size={"small"}
                    label="Velg fagområde"
                    name="fagomrade"
                    {...register("fagomrade")}
                >
                    {joarkOverforFagomraderOptions
                        .filter((b) => b.value != props.journalpost.fagomrade)
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
                <AvvikModalButtons onSubmit={handleSubmit(props.onSubmit)} submitButtonLabel={"Overfør"} />
            </form>
        </div>
    );
}

interface EndreFagomradeBekreftelseProps {
    fagomrade: string;
    journalpost: Journalpost;
}

function EndreFagomradeBekreftelse(props: EndreFagomradeBekreftelseProps) {
    const { saksnummer } = useAppContext().appState;
    let message;
    if (props.journalpost.isStatusMottatt) {
        const fagomradeOption = joarkOverforFagomraderOptions.find((option) => option.value == props.fagomrade);
        const isFarskapOrBidrag = props.fagomrade === FAGOMRADE.BID || props.fagomrade === FAGOMRADE.FAR;
        message = isFarskapOrBidrag
            ? "Fagområdet er endret til " + fagomradeOption.label
            : "Fagområdet er endret og dokumentet er sendt til " + fagomradeOption.label;
    } else {
        const fagomradeOption = joarkOverforFagomraderOptions.find((option) => option.value == props.fagomrade);
        message = (
            <>
                Journalposten er kopiert og sendt over til fagområdet {fagomradeOption.label}.<br />
                Journalpost sakstilknytning til sak {saksnummer} er slettet
            </>
        );
    }

    return (
        <Bekreftelse>
            <BodyShort>{message}</BodyShort>
        </Bekreftelse>
    );
}

export default EndreFagomradeJoark;
