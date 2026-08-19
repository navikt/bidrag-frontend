import { EditDocumentBroadcastMessage } from "@navikt/bidrag-ui-common";
import { LoggerService } from "@navikt/bidrag-ui-common";
import { Alert, BodyShort, Heading } from "@navikt/ds-react";
import { Checkbox } from "@navikt/ds-react";
import { CheckboxGroup } from "@navikt/ds-react";
import { Label } from "@navikt/ds-react";
import React, { useState } from "react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { SAK_API } from "../../../../../servicesV2/api";
import { useHentJournalpost } from "../../../../../servicesV2/useDokumentApi";
import { useAppContext } from "../../../../../store/AppContext";
import { useJournalpost } from "../../../../../store/JournalpostContext";
import { AvvikType } from "../../../../../types/api/AvvikTypes";
import { Journalpost } from "../../../../../types/journalpost";
import { Dokument } from "../../../../../types/journalpost";
import { NY_SAK_SAKSNUMMER } from "../../../../../types/sak";
import { isEmpty } from "../../../../utils/ObjectUtils";
import { RedirectTo } from "../../../../utils/RedirectUtils";
import DokumentLabel from "../../../dokument/DokumentLabel";
import EditDocumentButton from "../../../dokument/EditDocumentButton";
import EndreDokumentTittel from "../../../dokument/EndreDokumentTittel";
import OpenDocumentButton from "../../../dokument/OpenDocumentButton";
import OpenDocumentLink from "../../../dokument/OpenDocumentLink";
import { handleSubmitPreventPropagation } from "../../../form/FormUtils";
import Sakstabell from "../../../sak/SakTabell";
import AvvikModalButtons from "../AvvikModalButtons";
import Bekreftelse from "../Bekreftelse";
import { AvvikTypeCommonProps, getFagomradeLabel } from "./AvvikTypes";

interface EditedDocument {
    document: EditDocumentBroadcastMessage;
    title: string;
}
interface KopierFraAnnenFagomradeProps extends AvvikTypeCommonProps {
    journalpost: Journalpost;
}

function KopierFraAnnenFagomrade(props: KopierFraAnnenFagomradeProps) {
    const [relevanteDokumenter, setRelevanteDokumenter] = useState<Dokument[]>([]);
    const [fagomrade, setFagomrade] = useState("");
    const [redigertDokument, setRedigertDokument] = useState<EditedDocument>();
    const [knyttTilSaker, setKnyttTilSaker] = useState([]);
    const {
        appState: { påloggetEnhet },
    } = useAppContext();
    const handleSubmitFirstStep = (values: SendTilFagomradeFirstStepValues) => {
        setFagomrade(values.fagomrade);
        setRelevanteDokumenter(values.relevanteDokumenter);
        props.setActiveStep(2);
    };

    const handleSubmitSecondStep = (_redigertDokument: EditedDocument) => {
        setRedigertDokument(_redigertDokument);
        props.setActiveStep(3);
    };

    const handleSubmitThirdStep = (knyttTilSaker: string[]) => {
        setKnyttTilSaker(knyttTilSaker);
        props.setActiveStep(4);
    };

    const handleSubmitFourthStep = async () => {
        const opprettetNySak = knyttTilSaker.includes(NY_SAK_SAKSNUMMER);
        const oppdatertKnyttTilSaker = await hentSakerOgOpprettNySakHvisNodvendig();
        await props
            .sendAvvik({
                type: AvvikType.KOPIER_FRA_ANNEN_FAGOMRADE,
                relevanteDokumenter: redigertDokument
                    ? [{ tittel: redigertDokument.title, dokument: redigertDokument.document.document }]
                    : relevanteDokumenter,
                knyttTilSaker: oppdatertKnyttTilSaker,
            })
            .then(() => {
                const redirectToSak = oppdatertKnyttTilSaker[0];
                opprettetNySak ? RedirectTo.behandleSak(redirectToSak) : RedirectTo.sakshistorikk(redirectToSak);
            })
            .catch((err) => LoggerService.error(err?.message ?? err, err));
        props.setActiveStep(5);
    };

    async function hentSakerOgOpprettNySakHvisNodvendig() {
        if (knyttTilSaker.includes(NY_SAK_SAKSNUMMER)) {
            const response = await SAK_API.bidragSak.post({ eierfogd: påloggetEnhet });
            const nySak = response.data;
            const oppdatertKnyttTilSaker = knyttTilSaker
                .reduce(
                    (list, saksnummer) =>
                        list.concat([saksnummer == NY_SAK_SAKSNUMMER ? nySak.saksnummer : saksnummer]),
                    []
                )
                .sort((a, b) => (b === nySak.saksnummer ? 1 : -1));
            setKnyttTilSaker(oppdatertKnyttTilSaker);
            return oppdatertKnyttTilSaker;
        }
        return knyttTilSaker;
    }

    return (
        <>
            <KopierFraAnnenFagomradeFirstStep
                isActive={props.activeStep === 1}
                onSubmit={handleSubmitFirstStep}
                journalpost={props.journalpost}
            />
            {props.activeStep === 2 && (
                <CheckAndEditDocumentsStep
                    relevanteDokumenter={relevanteDokumenter}
                    redigerDokument={redigertDokument}
                    fagomrade={fagomrade}
                    onSubmit={handleSubmitSecondStep}
                />
            )}
            {props.activeStep === 3 && (
                <KopierFraAnnenFagomradeThirdStep valgteSaker={knyttTilSaker} onSubmit={handleSubmitThirdStep} />
            )}
            {props.activeStep === 4 && (
                <KopierFraAnnenFagomradeFourthStep
                    valgteSaker={knyttTilSaker}
                    relevanteDokumenter={relevanteDokumenter}
                    redigertDokument={redigertDokument}
                    onSubmit={handleSubmitFourthStep}
                />
            )}
            {props.activeStep === 5 && (
                <KopierFraAnnenFagomradeBekreftelse fagomrade={fagomrade} journalpost={props.journalpost} />
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

function KopierFraAnnenFagomradeFirstStep(props: SendTilFagomradeFirstStepProps) {
    const [relevanteDokumenter, setRelevanteDokumenter] = useState<Dokument[]>([]);
    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<SendTilFagomradeFirstStepValues>({
        defaultValues: {
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
                Kopier dokumenter fra fagområde {props.journalpost.fagomrade} til en bidragsak
            </BodyShort>
        );
    }

    function isDocumentSelected(document: Dokument) {
        return relevanteDokumenter.some(
            (selectedDocument) => selectedDocument.dokumentreferanse === document.dokumentreferanse
        );
    }

    function toggleSelectedDocument(document: Dokument) {
        if (isDocumentSelected(document)) {
            setRelevanteDokumenter((prevState) =>
                prevState.filter((doc) => doc.dokumentreferanse !== document.dokumentreferanse)
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

        if (dokumenter.length == 1) {
            const dokument = dokumenter[0];
            return (
                <div>
                    <Label spacing>Følgende dokument inneholder relevant informasjon for bidrag: </Label>
                    <div className={"flex flex-row min-w-[20px]"}>
                        <DokumentLabel dokument={dokument} />
                        <OpenDocumentButton
                            journalpostId={props.journalpost.journalpostId}
                            dokumentreferanse={dokument.dokumentreferanse}
                            openInBrowser
                        />
                    </div>
                </div>
            );
        }

        return (
            <>
                <CheckboxGroup
                    //@ts-ignore
                    error={errors.relevanteDokumenter?.message}
                    legend={"Velg dokumenter som inneholder relevant informasjon for bidrag:"}
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
                                id={"dokument_" + dokument.dokumentreferanse}
                                onClick={() => {
                                    toggleSelectedDocument(dokument);
                                }}
                                defaultChecked={isDocumentSelected(dokument)}
                                checked={isDocumentSelected(dokument)}
                                value={isDocumentSelected(dokument)}
                            >
                                <DokumentLabel dokument={dokument} />
                            </Checkbox>
                            <OpenDocumentButton
                                journalpostId={dokument.journalpostId ?? props.journalpost.journalpostId}
                                dokumentreferanse={dokument.dokumentreferanse}
                                status={dokument.status}
                                openInBrowser
                            />
                        </div>
                    ))}
                </CheckboxGroup>
            </>
        );
    }

    return (
        <div>
            {renderInfo()}
            <form onSubmit={handleSubmitPreventPropagation(handleSubmit(props.onSubmit))}>
                {renderDocumentSelect()}
                <AvvikModalButtons onSubmit={handleSubmit(props.onSubmit)} submitButtonLabel={"Gå videre"} />
            </form>
        </div>
    );
}

interface KopierFraAnnenFagomradeSecondStepProps {
    fagomrade: string;
    relevanteDokumenter: Dokument[];
    redigerDokument: EditedDocument;
    onSubmit: (redigertDokument?: EditedDocument) => void;
}

interface CheckAndEditDocumentsStepFormValues {
    hasConfirmedRelevantDocumentsSelected: boolean;
    editedDocumentTitle: string;
    redigertDokument: EditedDocument;
}
function CheckAndEditDocumentsStep(props: KopierFraAnnenFagomradeSecondStepProps) {
    const [waitinForEditResult, setWaitingForEditResult] = useState<boolean>(false);
    const journalpost = useHentJournalpost();
    const {
        register,
        setValue,
        clearErrors,
        watch,
        handleSubmit,
        formState: { errors },
    } = useForm<CheckAndEditDocumentsStepFormValues>({
        defaultValues: {
            hasConfirmedRelevantDocumentsSelected: false,
        },
    });
    const redigertDokument = watch("redigertDokument");

    useEffect(() => {
        register("redigertDokument", {
            validate: (val: EditedDocument) => {
                if (!val) {
                    return true;
                }
                return isEmpty(val?.title) ? "Tittel må settes på redigert dokument" : true;
            },
        });
        if (props.redigerDokument) {
            setValue("redigertDokument", props.redigerDokument);
        }
    }, [props.redigerDokument]);
    function submit(data: CheckAndEditDocumentsStepFormValues) {
        if (!redigertDokument) {
            props.onSubmit();
            return;
        }
        props.onSubmit(data.redigertDokument);
    }

    return (
        <form onSubmit={handleSubmitPreventPropagation(handleSubmit(submit))}>
            <BodyShort spacing>
                Vennligst se gjennom og rediger dokumentet før du kopierer over til Bidrag. <br />
                Sider som ikke er relevant for Bidrag bør fjernes.
            </BodyShort>
            <div className={"flex flex-col pb-2"}>
                <Label>
                    {redigertDokument ? "Originale dokumenter" : "Du er i ferd med å kopiere over følgende dokumenter:"}
                </Label>
                <div className={"flex flex-col min-w-[20px]"}>
                    <ul>
                        {props.relevanteDokumenter.map((dokument) => (
                            <li>
                                <OpenDocumentLink
                                    dokument={dokument}
                                    journalpostId={journalpost.journalpostId}
                                    resizeToA4
                                    openInBrowser
                                />
                            </li>
                        ))}
                    </ul>
                </div>
                {redigertDokument?.document && (
                    <div className={"flex flex-col mb-[-10px]"}>
                        <Label spacing>Du er i ferd med å kopiere over følgende redigert dokument:</Label>
                        <div className={"pt-8 relative top-[-30px] flex flex-row document_button_editable_title"}>
                            <EndreDokumentTittel
                                label={"Tittel på dokumentet"}
                                description={"Tittel skal beskrive innholdet på redigert dokument"}
                                defaultValue={redigertDokument.title}
                                onTitleChange={(title) => {
                                    clearErrors("redigertDokument");
                                    setValue("redigertDokument.title", title);
                                }}
                                error={errors.redigertDokument?.message}
                            />
                            <div className={"pt-8 flex items-center"}>
                                <OpenDocumentButton documentByte={redigertDokument.document.document} />
                            </div>
                        </div>
                    </div>
                )}

                <div>
                    <EditDocumentButton
                        dokumentList={props.relevanteDokumenter}
                        journalpostId={journalpost.journalpostId}
                        onEditFinished={(document) => {
                            setValue("redigertDokument.document", document);
                            setWaitingForEditResult(false);
                        }}
                        editedDocument={redigertDokument?.document}
                        onEditStarted={() => setWaitingForEditResult(true)}
                    />
                </div>
            </div>
            <CheckboxGroup legend={""} error={errors.hasConfirmedRelevantDocumentsSelected?.message}>
                <Checkbox
                    {...register("hasConfirmedRelevantDocumentsSelected", {
                        required: "Du må bekrefte før du går videre",
                    })}
                    className={"confirm_action"}
                >
                    Bekreft at du har sett gjennom og valgt bare dokumenter og sider som relevante for Bidrag
                </Checkbox>
            </CheckboxGroup>
            <AvvikModalButtons
                onSubmit={handleSubmit(submit)}
                disabled={waitinForEditResult}
                submitButtonLabel={"Gå videre"}
            />
        </form>
    );
}

interface KopierFraAnnenFagomradeThirdStepProps {
    valgteSaker: string[];
    onSubmit: (knyttTilSaker: string[]) => void;
}

function KopierFraAnnenFagomradeThirdStep(props: KopierFraAnnenFagomradeThirdStepProps) {
    const [hasFormError, setHasFormHasFormError] = useState<boolean>(false);
    const [valgteSaker, setValgteSaker] = useState(props.valgteSaker);

    function onSakChange(saker: string[]) {
        setHasFormHasFormError(false);
        setValgteSaker(saker);
    }

    function submit() {
        setHasFormHasFormError(false);
        if (valgteSaker.length == 0) {
            setHasFormHasFormError(true);
            return;
        }
        props.onSubmit(valgteSaker);
    }

    return (
        <div className={"w-[60%] mb-4 mt-4"}>
            <BodyShort spacing>Velg en eller flere saker som journalposten skal knyttes til</BodyShort>
            <Sakstabell
                initialValue={props.valgteSaker}
                title={"Knytt til sak"}
                titleSize={"small"}
                onChange={onSakChange}
            />
            {hasFormError && <Alert variant={"error"}>Du må velge minst en sak før du kan gå videre</Alert>}
            <AvvikModalButtons submitButtonLabel={"Gå videre"} onSubmit={submit} />
        </div>
    );
}

interface KopierFraAnnenFagomradeForuthStepProps {
    relevanteDokumenter: Dokument[];
    redigertDokument: EditedDocument;
    valgteSaker: string[];
    onSubmit: () => void;
}

function KopierFraAnnenFagomradeFourthStep(props: KopierFraAnnenFagomradeForuthStepProps) {
    const journalpost = useHentJournalpost();
    const { avvikState } = useJournalpost();

    const opprettetNySak = props.valgteSaker.includes(NY_SAK_SAKSNUMMER);
    return (
        <div className={"w-[60%] mb-4 mt-4"}>
            <Heading spacing size={"medium"}>
                Sammendrag
            </Heading>
            <BodyShort spacing>
                <>
                    Du er i ferd med å kopiere journalpost{" "}
                    <i>
                        {journalpost.innhold} ({journalpost.journalpostIdNoPrefix})
                    </i>{" "}
                    fra {getFagomradeLabel(journalpost.fagomrade)} til Bidrag
                </>
            </BodyShort>
            <div className={"flex flex-col pb-2"}>
                <Label>Med følgende dokumenter:</Label>
                <div className={"flex flex-col min-w-[20px]"}>
                    <ul>
                        {props.redigertDokument ? (
                            <li>
                                <OpenDocumentLink documentByte={props.redigertDokument.document.document}>
                                    {props.redigertDokument.title}
                                </OpenDocumentLink>
                            </li>
                        ) : (
                            <>
                                {props.relevanteDokumenter.map((dokument) => (
                                    <li>
                                        <OpenDocumentLink
                                            dokument={dokument}
                                            journalpostId={journalpost.journalpostId}
                                            resizeToA4
                                            openInBrowser
                                        />
                                    </li>
                                ))}
                            </>
                        )}
                    </ul>
                </div>
            </div>
            <Label>Knyttet til {props.valgteSaker.length == 1 ? "sak" : "saker"}:</Label>
            <div>
                <ul>
                    {props.valgteSaker.map((sak) => (
                        <li>{sak == NY_SAK_SAKSNUMMER ? "Ny sak (opprettes etter bekreftelse)" : sak}</li>
                    ))}
                </ul>
            </div>
            <AvvikModalButtons
                loading={avvikState == "pending"}
                submitButtonLabel={`Bekreft og åpne ${opprettetNySak ? "sak" : "sakshistorikk"}`}
                onSubmit={props.onSubmit}
            />
        </div>
    );
}

interface KopierFraAnnenFagomradeBekreftelseProps {
    fagomrade: string;
    journalpost: Journalpost;
}

function KopierFraAnnenFagomradeBekreftelse(props: KopierFraAnnenFagomradeBekreftelseProps) {
    return (
        <Bekreftelse>
            <BodyShort>Journalpost er kopiert</BodyShort>
        </Bekreftelse>
    );
}

export default KopierFraAnnenFagomrade;
