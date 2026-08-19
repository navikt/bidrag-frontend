import "./AvvikshandteringModal.less";

import { Left } from "@navikt/ds-icons";
import { Button, Loader, Modal } from "@navikt/ds-react";
import { Heading } from "@navikt/ds-react";
import React, { useEffect, useState } from "react";
import { useContext } from "react";

import { useSendAvvikMutation } from "../../../../servicesV2/useAvvikApi";
import {
    useGetAvvik,
    useHentJournalpost,
    useLagreJournalpost,
    useResetJournalpost,
} from "../../../../servicesV2/useDokumentApi";
import { useJournalpost } from "../../../../store/JournalpostContext";
import { AvvikType } from "../../../../types/api/AvvikTypes";
import { LagreJournalpostRequest } from "../../../../types/api/JournalpostTypes";
import { Avvik } from "../../../../types/avvik";
import { FAGOMRADE } from "../../../../types/enum/Fagomrade";
import { Journalpost } from "../../../../types/journalpost";
import BisysLink from "../../bisys/BisysLink";
import { AvvikViewModel } from "../model/AvvikViewModel";
import MainMenu from "./MainMenu";
import StepIndicator from "./StepIndicator";
import { erFarskapBehandledeEnhet } from "./types/AvvikTypes";
import BestillNyDistribusjon from "./types/BestillNyDistribusjon";
import BestillOriginal from "./types/BestillOriginal";
import BestillReskanning from "./types/BestillReskanning";
import BestillSplitting from "./types/BestillSplitting";
import EndreFagomrade from "./types/EndreFagomrade";
import EndreFagomradeForsendelse from "./types/EndreFagomradeForsendelse";
import EndreFagomradeJoark from "./types/EndreFagomradeJoark";
import FarskapUtelukket from "./types/FarskapUtelukket";
import FeilforeSak from "./types/FeilforeSak";
import InngaendeTilUtgaendeDokument from "./types/InngaendeTilUtgaendeDokument";
import KopierFraAnnenFagomrade from "./types/KopierFraAnnenFagomrade";
import ManglerAdresse from "./types/ManglerAdresse";
import OverforTilAnnenEnhet from "./types/OverforTilAnnenEnhet";
import RegistrerRetur from "./types/RegistrerRetur";
import SendKopiTilFagomrade from "./types/SendKopiTilFagomrade";
import SlettJournalpost from "./types/SlettJournalpost";
import TrekkJournalpost from "./types/TrekkJournalpost";

interface AvvikProviderProps {
    onCancel: () => void;
}
export const useAvvikModalContext = () => useContext(AvvikModalContext);
const AvvikModalContext = React.createContext<AvvikProviderProps>({} as AvvikProviderProps);

interface AvvikshandteringModalProps {
    closeModal: () => void;
    paloggetEnhet: string;
    saksnummer?: string;
    initialAvvik?: Avvik;
    initialAvvikType?: AvvikType;
}

function AvvikshandteringModal(props: AvvikshandteringModalProps) {
    const [selectedAvvik, setSelectedAvvik] = useState<AvvikViewModel | undefined>();
    const [activeStep, setActiveStep] = useState(props.initialAvvik || props.initialAvvikType ? 1 : 0);
    const [avvikConfirmed, setAvvikConfirmed] = useState<boolean>(false);
    const { avvikState, setAvvikState } = useJournalpost();
    const avvikStateValue = useGetAvvik();
    const journalpostState = useHentJournalpost();
    const sendAvvik = useSendAvvikMutation();
    const lagreJournalpost = useLagreJournalpost();

    const resetJournalpost = useResetJournalpost();

    useEffect(() => {
        if (props.initialAvvik || props.initialAvvikType) {
            setSelectedAvvik(getAvvikViewModel(props.initialAvvik?.type || props.initialAvvikType));
        }

        if (avvikState === "pending") {
            setAvvikConfirmed(true);
        }
    }, [avvikState]);

    const changeStep = (step: number) => {
        if (step === 0) {
            setSelectedAvvik(undefined);
        }
        setActiveStep(step);
    };

    function getAvvikViewModel(avvikType: AvvikType) {
        return avvikStateValue?.find((avvikViewModel) => avvikViewModel.type === avvikType);
    }

    const performSendAvvik = async (avvik: Avvik, ident?: string) => {
        let result = true;
        if (ident) {
            const journalpost = new LagreJournalpostRequest(journalpostState.journalpostId);
            journalpost.gjelder = ident;
            setAvvikState("pending");
            const sendAvvikSuccess = await sendAvvik.mutateAsync({
                avvik,
                journalpostId: journalpost.journalpostId,
                paloggetEnhet: props.paloggetEnhet,
                saksnummer: props.saksnummer,
            });
            const enhet = avvik["nyttEnhetsnummer"] ?? props.paloggetEnhet;
            const lagreJournalpostSuccess =
                sendAvvikSuccess &&
                (await lagreJournalpost.mutateAsync({ journalpost, journalpostId: journalpost.journalpostId, enhet }));
            if (!lagreJournalpostSuccess) {
                setAvvikState("failure");
                result = false;
            }
        } else {
            result = await sendAvvik.mutateAsync({
                avvik,
                journalpostId: journalpostState.journalpostId,
                paloggetEnhet: props.paloggetEnhet,
                saksnummer: props.saksnummer,
            });
        }

        if (
            avvik.type == AvvikType.ENDRE_FAGOMRADE &&
            (avvik.fagomrade == FAGOMRADE.FAR || avvik.fagomrade == FAGOMRADE.BID) &&
            erFarskapBehandledeEnhet(props.paloggetEnhet)
        ) {
            setAvvikState("success_continue");
            resetJournalpost();
        }

        return result ? Promise.resolve() : Promise.reject();
    };

    const shouldBeAbleToReturnToMainPage = () => {
        const isSuccess = avvikState == "success_continue" || avvikState == "success_lock";
        if (!avvikConfirmed || !selectedAvvik || !isSuccess) {
            return true;
        }
        return avvikState == "success_continue";
    };

    const selectAvvik = (selectedAvvik: AvvikViewModel) => {
        setSelectedAvvik(selectedAvvik);
        setActiveStep(1);
        setAvvikConfirmed(false);
    };

    function onPrevious() {
        changeStep(Math.max(activeStep - 1, 0));
    }

    return (
        <AvvikModalContext.Provider value={{ onCancel: props.closeModal }}>
            <Modal
                aria-label=""
                open={true}
                className="!max-w-[900px] min-w-[600px]"
                onClose={props.closeModal}
                closeOnBackdropClick={shouldBeAbleToReturnToMainPage()}
            >
                <Modal.Header closeButton>
                    <Heading level={"1"} size={"large"}>
                        Avvikshåndtering
                    </Heading>
                </Modal.Header>
                <Modal.Body className="w-full">
                    <React.Suspense fallback={<Loader />}>
                        <>
                            {selectedAvvik ? (
                                <>
                                    <StepIndicator
                                        disableAvvikMeny={!shouldBeAbleToReturnToMainPage()}
                                        activeStep={activeStep}
                                        onChange={changeStep}
                                        selectedAvvik={selectedAvvik}
                                    />
                                    {selectedAvvik && (
                                        <Heading level={"3"} size={"medium"} spacing>
                                            {selectedAvvik.title}
                                        </Heading>
                                    )}
                                    <React.Suspense fallback={<Loader />}>
                                        {activeStep > 0 && avvikConfirmed == false && (
                                            <PreviousStepButton onPrevious={onPrevious} />
                                        )}
                                        <AvvikStep
                                            selectedAvvik={selectedAvvik}
                                            activeStep={activeStep}
                                            setActiveStep={setActiveStep}
                                            journalpost={journalpostState}
                                            sendAvvik={performSendAvvik}
                                            {...props}
                                        />
                                    </React.Suspense>
                                    {!shouldBeAbleToReturnToMainPage() && (
                                        <div className="pt-2">
                                            <BisysLink />
                                        </div>
                                    )}
                                </>
                            ) : (
                                <MainMenu avvikViewModels={avvikStateValue} onClick={selectAvvik} />
                            )}
                        </>
                    </React.Suspense>
                </Modal.Body>
            </Modal>
        </AvvikModalContext.Provider>
    );
}

function PreviousStepButton({ onPrevious }: { onPrevious: () => void }) {
    return (
        <div className={"mb-4"}>
            <Button onClick={onPrevious} variant={"tertiary"} size={"small"} icon={<Left />}>
                Forrige steg
            </Button>
        </div>
    );
}

interface AvvikStepProps extends AvvikshandteringModalProps {
    activeStep: number;
    selectedAvvik: AvvikViewModel;
    setActiveStep: (value: number) => void;
    journalpost: Journalpost;
    sendAvvik: (avvik: Avvik, ident?: string) => Promise<void>;
}

function AvvikStep(props: AvvikStepProps) {
    const { selectedAvvik } = props;
    switch (selectedAvvik.type) {
        case AvvikType.KOPIER_FRA_ANNEN_FAGOMRADE:
            return <KopierFraAnnenFagomrade {...props} />;
        case AvvikType.BESTILL_ORIGINAL:
            return <BestillOriginal {...props} paloggetEnhet={props.paloggetEnhet} />;
        case AvvikType.BESTILL_RESKANNING:
            return <BestillReskanning {...props} />;
        case AvvikType.BESTILL_SPLITTING:
            return <BestillSplitting {...props} />;
        case AvvikType.SEND_TIL_FAGOMRADE:
            return <SendKopiTilFagomrade {...props} journalpost={props.journalpost} />;
        case AvvikType.ENDRE_FAGOMRADE:
            if (props.journalpost.isJoarkJournalpost) {
                return <EndreFagomradeJoark {...props} journalpost={props.journalpost} />;
            } else if (props.journalpost.isForsendelse) {
                return <EndreFagomradeForsendelse {...props} journalpost={props.journalpost} />;
            }
            return <EndreFagomrade {...props} journalpost={props.journalpost} />;
        case AvvikType.FEILFORE_SAK:
            return <FeilforeSak {...props} />;
        case AvvikType.INNG_TIL_UTG_DOKUMENT:
            return <InngaendeTilUtgaendeDokument {...props} />;
        case AvvikType.SLETT_JOURNALPOST:
            return <SlettJournalpost {...props} />;
        case AvvikType.TREKK_JOURNALPOST:
            return <TrekkJournalpost {...props} />;
        case AvvikType.REGISTRER_RETUR:
            return <RegistrerRetur {...props} />;
        case AvvikType.BESTILL_NY_DISTRIBUSJON:
            return <BestillNyDistribusjon {...props} />;
        case AvvikType.MANGLER_ADRESSE:
            return <ManglerAdresse {...props} />;
        case AvvikType.FARSKAP_UTELUKKET:
            return <FarskapUtelukket {...props} />;
        case AvvikType.OVERFOR_TIL_ANNEN_ENHET:
            return (
                <OverforTilAnnenEnhet {...props} paloggetEnhet={props.paloggetEnhet} journalpost={props.journalpost} />
            );
        default:
            return <div>Obs, dette burde ikke skje</div>;
    }
}

export default AvvikshandteringModal;
