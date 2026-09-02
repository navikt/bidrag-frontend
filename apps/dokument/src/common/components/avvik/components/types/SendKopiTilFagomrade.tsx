import { AapneDokumentKnapp, FileUtils, OpenDocumentUtils } from "@bidrag/common";
import { Alert, BodyShort, Button, Checkbox, CheckboxGroup, Label, Link, Select } from "@navikt/ds-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import environment from "../../../../../environment";
import { useHentJournalpost } from "../../../../../hooks/useDokumentApi";
import FoerstesideGeneratorService from "../../../../../services/FoerstesideGeneratorService";
import { useAppContext } from "../../../../../store/AppContext";
import { AvvikType } from "../../../../../types/api/AvvikTypes";
import {
    type Dokument,
    dokumenterToString,
    dokumentToString,
    type Journalpost,
} from "../../../../../types/journalpost";
import DokumentLabel from "../../../dokument/DokumentLabel";
import { handleSubmitPreventPropagation } from "../../../form/FormUtils";
import ExternalLink from "../../../icons/ExternalLink";
import AvvikModalButtons from "../AvvikModalButtons";
import Bekreftelse from "../Bekreftelse";
import { type AvvikTypeCommonProps, fagomradeOptions } from "./AvvikTypes";

interface EndreFagomradeProps extends AvvikTypeCommonProps {
    journalpost: Journalpost;
}

function SendKopiTilFagomrade(props: EndreFagomradeProps) {
    const [relevanteDokumenter, setRelevanteDokumenter] = useState<Dokument[]>([]);
    const [fagomrade, setFagomrade] = useState("");

    const handleSubmitFirstStep = (values: SendTilFagomradeFirstStepValues) => {
        setFagomrade(values.fagomrade);
        setRelevanteDokumenter(values.relevanteDokumenter);
        props.setActiveStep(2);
    };

    const handleSubmitSecondStep = (values: SendTilFagomradeSecondStepValues) => {
        if (values.bekreftetSendtScanning) {
            props.sendAvvik({
                type: AvvikType.SEND_TIL_FAGOMRADE,
                fagomrade: fagomrade,
                dokumenter: dokumenterToString(props.journalpost.journalpostId, relevanteDokumenter).join(","),
            });
            props.setActiveStep(3);
        }
    };

    return (
        <>
            <SendTilFagomradeFirstStep
                isActive={props.activeStep === 1}
                onSubmit={handleSubmitFirstStep}
                journalpost={props.journalpost}
            />
            {props.activeStep === 2 && (
                <SendTilFagomradeSecondStep
                    isActive={true}
                    relevanteDokumenter={relevanteDokumenter}
                    fagomrade={fagomrade}
                    onSubmit={handleSubmitSecondStep}
                    journalpost={props.journalpost}
                />
            )}
            {props.activeStep === 3 && (
                <SendTilFagomradeBekreftelse fagomrade={fagomrade} journalpost={props.journalpost} />
            )}
        </>
    );
}

interface SendTilFagomradeFirstStepProps {
    isActive: boolean;
    journalpost: Journalpost;
    onSubmit: (values: SendTilFagomradeFirstStepValues) => void;
}

interface SendTilFagomradeFirstStepValues {
    fagomrade: string;
    relevanteDokumenter: Dokument[];
}

function SendTilFagomradeFirstStep(props: SendTilFagomradeFirstStepProps) {
    const [relevanteDokumenter, setRelevanteDokumenter] = useState<Dokument[]>([]);
    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<SendTilFagomradeFirstStepValues>({
        defaultValues: {
            fagomrade: "BAR",
            relevanteDokumenter: [],
        },
    });

    useEffect(() => {
        setValue("relevanteDokumenter", relevanteDokumenter);
    }, [relevanteDokumenter]);

    useEffect(() => {
        register("relevanteDokumenter", { required: "Du må velge minst et dokument" });
        setValue("relevanteDokumenter", []);
    }, []);

    useEffect(() => {
        if (props.journalpost.dokumenter.length === 1) {
            setValue("relevanteDokumenter", [props.journalpost.dokumenter[0]]);
        }
    }, [props.journalpost.dokumenter]);

    if (!props.isActive) {
        return null;
    }

    function renderInfo() {
        return (
            <BodyShort spacing>
                Denne avvikshåndtering skal benyttes dersom noen av dokumentene i journalposten tilhører et annet
                fagområde.
                <br />
                Dersom alle dokumentene i journalposten tilhører et annen fagområde, og ikke bidrag, må
                avvikshåndteringen <i>Endre fagområde</i> benyttes.
            </BodyShort>
        );
    }

    function isDocumentSelected(document: Dokument) {
        return relevanteDokumenter.some(
            (selectedDocument) => selectedDocument.dokumentreferanse === document.dokumentreferanse,
        );
    }

    function toggleSelectedDocument(document: Dokument) {
        if (isDocumentSelected(document)) {
            setRelevanteDokumenter((prevState) =>
                prevState.filter((doc) => doc.dokumentreferanse !== document.dokumentreferanse),
            );
        } else {
            setRelevanteDokumenter((prevState) => [...prevState, document]);
        }
    }

    function toggleSelecAllDocuments() {
        if (isAllSelected()) {
            setRelevanteDokumenter([]);
        } else {
            setRelevanteDokumenter([...props.journalpost.dokumenter]);
        }
    }

    function isAllSelected() {
        return relevanteDokumenter.length === props.journalpost.dokumenter.length;
    }
    function renderDocumentSelect() {
        const dokumenter = [...props.journalpost.dokumenter];

        if (dokumenter.length === 1) {
            const dokument = dokumenter[0];
            return (
                <div>
                    <Label spacing>Følgende dokument inneholder relevant informasjon for fagområdet: </Label>
                    <div className={"flex flex-row min-w-[20px]"}>
                        <DokumentLabel dokument={dokument} />
                        <AapneDokumentKnapp
                            variant="ikon"
                            journalpostId={props.journalpost.journalpostId}
                            dokumentreferanse={dokument.dokumentreferanse}
                            status={dokument.status}
                        >
                            <ExternalLink />
                        </AapneDokumentKnapp>
                    </div>
                </div>
            );
        }

        return (
            <CheckboxGroup
                error={errors.relevanteDokumenter?.message}
                legend={"Velg dokumenter som inneholder relevant informasjon for fagområdet:"}
            >
                <Checkbox
                    size={"small"}
                    id={"dokument_alle"}
                    onClick={toggleSelecAllDocuments}
                    defaultChecked={isAllSelected()}
                    checked={isAllSelected()}
                >
                    <strong>Velg alle</strong>
                </Checkbox>
                {[...dokumenter].map((dokument, index) => (
                    <div className={"flex flex-row min-w-[20px]"} key={index}>
                        <Checkbox
                            size={"small"}
                            id={`dokument_${dokument.dokumentreferanse}`}
                            onClick={() => {
                                toggleSelectedDocument(dokument);
                            }}
                            defaultChecked={isDocumentSelected(dokument)}
                            checked={isDocumentSelected(dokument)}
                            value={isDocumentSelected(dokument)}
                        >
                            <DokumentLabel dokument={dokument} />
                        </Checkbox>
                        <AapneDokumentKnapp
                            variant="ikon"
                            journalpostId={dokument.journalpostId ?? props.journalpost.journalpostId}
                            dokumentreferanse={dokument.dokumentreferanse}
                            status={dokument.status}
                        >
                            <ExternalLink />
                        </AapneDokumentKnapp>
                    </div>
                ))}
            </CheckboxGroup>
        );
    }

    return (
        <div>
            {renderInfo()}
            <form onSubmit={handleSubmitPreventPropagation(handleSubmit(props.onSubmit))}>
                {/*@ts-ignore*/}
                <div className={"w-1/2 pb-3"}>
                    <Select size={"small"} label="Velg fagområde" name="fagomrade" {...register("fagomrade")}>
                        {fagomradeOptions
                            .filter((opt) => opt.value !== props.journalpost.fagomrade)
                            .map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                    </Select>
                </div>
                {renderDocumentSelect()}
                <AvvikModalButtons onSubmit={handleSubmit(props.onSubmit)} submitButtonLabel={"Gå videre"} />
            </form>
        </div>
    );
}

interface SendTilFagomradeSecondStepProps {
    isActive: boolean;
    journalpost: Journalpost;
    fagomrade: string;
    relevanteDokumenter: Dokument[];
    onSubmit: (values: SendTilFagomradeSecondStepValues) => void;
}

interface SendTilFagomradeSecondStepValues {
    bekreftetSendtScanning: boolean;
}

function SendTilFagomradeSecondStep(props: SendTilFagomradeSecondStepProps) {
    const { saksnummer } = useAppContext().appState;
    const [bekreftetSendtScanning, setBekreftetSendtScanning] = useState<boolean>(false);
    const [hasFormError, setHasFormHasFormError] = useState<boolean>(false);

    if (!props.isActive) {
        return null;
    }

    const fagomradeOpt = fagomradeOptions.find((opt) => opt.value === props.fagomrade);
    const fagomradeLabel = fagomradeOpt ? fagomradeOpt.label || props.fagomrade : props.fagomrade;

    function submit() {
        setHasFormHasFormError(false);
        if (!bekreftetSendtScanning) {
            setHasFormHasFormError(true);
        }
        props.onSubmit({ bekreftetSendtScanning });
    }

    function openBisysPrintoppgave() {
        const dokumenter = props.relevanteDokumenter
            .map((r) => dokumentToString(props.journalpost.journalpostId, r))
            .join("+");
        window.open(
            environment.url.bisys("oppgavePopup", {
                state: "opprett",
                vedlegg: dokumenter,
                saksnr: saksnummer,
                beskrivelse: "Vennligst skriv ut og send de vedlagte dokumentene. Takk!",
                mappe: "Print",
            }),
        );
    }

    function renderAccessToPrinterOption() {
        return (
            <div>
                <LagFoerstesideButton fagomrade={props.fagomrade} />
                <BodyShort spacing>{`Skrive ut følgende ${
                    props.relevanteDokumenter.length > 1 ? "dokumenter" : "dokument"
                }:`}</BodyShort>
                <div className={"flex flex-col pb-2"}>
                    {props.relevanteDokumenter.length > 1 && (
                        <div className={"pb-1"}>
                            <Link
                                href={"#"}
                                onClick={(e) => {
                                    e.preventDefault();
                                    OpenDocumentUtils.åpneDokumenter(
                                        props.relevanteDokumenter.map((dok) =>
                                            dokumentToString(props.journalpost.journalpostId, dok),
                                        ),
                                        true,
                                    );
                                }}
                            >
                                Åpne alle sammenslått
                            </Link>
                        </div>
                    )}
                    {props.relevanteDokumenter.map((dok) => (
                        <AapneDokumentKnapp
                            key={dok.dokumentreferanse}
                            journalpostId={props.journalpost.journalpostId}
                            dokumentreferanse={dok.dokumentreferanse}
                            status={dok.status}
                        >
                            <DokumentLabel dokument={dok} />
                        </AapneDokumentKnapp>
                    ))}
                </div>
            </div>
        );
    }

    function renderNoAccessToPrinterOption() {
        return (
            <div>
                <Link className={"pt-1 pb-1"} href={"#"} onClick={openBisysPrintoppgave}>
                    Opprett printoppgave
                    <ExternalLink />
                </Link>
            </div>
        );
    }
    return (
        <div>
            <Alert variant={"warning"}>
                Dokumentet kan dessverre (enda) ikke overføres elektronisk til fagområdet {fagomradeLabel}. Vennligst
                skriv ut dokumentet, samt forside fra Gosys med riktig tema for personen det gjelder, og send til
                skanning i Gosys.
            </Alert>
            <div className={"mt-2"}>
                <div className={"mt-2"}>
                    <Label>Har du tilgang til printer?</Label>
                    {renderAccessToPrinterOption()}
                </div>
                <div className={"mt-2"}>
                    <Label>
                        Hvis du <strong>ikke</strong> har tilgang til printer:
                    </Label>
                    {renderNoAccessToPrinterOption()}
                </div>
            </div>
            <CheckboxGroup legend={""} error={hasFormError ? "Du må bekrefte før du går videre" : null}>
                <Checkbox
                    error={hasFormError}
                    className={"confirm_action"}
                    onClick={() => {
                        setBekreftetSendtScanning((val) => !val);
                        setHasFormHasFormError(false);
                    }}
                >
                    Bekreft at du har fullført forrige steg (dvs du har enten opprettet førsteside og skrivet ut
                    dokumentene eller opprettet printoppgave)
                </Checkbox>
            </CheckboxGroup>
            <AvvikModalButtons submitButtonLabel={"Gå videre"} onSubmit={submit} />
        </div>
    );
}

interface SendTilFagomradeBekreftelseProps {
    fagomrade: string;
    journalpost: Journalpost;
}

function SendTilFagomradeBekreftelse(_props: SendTilFagomradeBekreftelseProps) {
    const message = <>Husk å sende utskriften med forside til skanning i Gosys.</>;

    return (
        <Bekreftelse>
            <BodyShort>{message}</BodyShort>
        </Bekreftelse>
    );
}

interface LagFoerstesideButtonProps {
    fagomrade: string;
}

function LagFoerstesideButton({ fagomrade }: LagFoerstesideButtonProps) {
    const journalpost = useHentJournalpost();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();
    const { saksbehandlerIdent } = useAppContext().appState;

    async function opprettFoersteside() {
        setLoading(true);
        setError(undefined);
        const request = new FoerstesideGeneratorService().opprettFoerstesideRequest(
            journalpost,
            saksbehandlerIdent,
            fagomrade,
        );
        new FoerstesideGeneratorService()
            .opprettFoersteside(request)
            .then((response) => FileUtils.openFile(FileUtils._base64ToArrayBuffer(response.foersteside)))
            .catch((_e) => setError("Kunne ikke lage førsteside. Vennligst prøv på nytt."))
            .finally(() => setLoading(false));
    }

    return (
        <>
            <Button
                size={"small"}
                className={"mt-2 mb-2"}
                loading={loading}
                variant={"secondary"}
                onClick={opprettFoersteside}
            >
                Lag førsteside
            </Button>
            {error && (
                <Alert className={"w-max mt-2 mb-2"} size={"small"} variant={"error"}>
                    {error}
                </Alert>
            )}
        </>
    );
}

export default SendKopiTilFagomrade;
