import "./AvvikshandteringModal.css";

import type { Avvikshendelse } from "@bidrag/api/BidragForsendelseApi";
import { ArrowLeftIcon as Left } from "@navikt/aksel-icons";
import { Button, Heading, Loader, Modal } from "@navikt/ds-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { useBidragForsendelseApi } from "../../../../api/api";
import { UseForsendelseApiKeys } from "../../../../hooks/useForsendelseApi";
import useHarTilgangTilTemaFar from "../../../../hooks/useTilgangskontrollApi";
import { type Avvik, AvvikType } from "../../../../types/AvvikTypes";
import { FAGOMRADE } from "../../../../types/Journalpost";
import { RedirectTo } from "../../../../utils/RedirectUtils";
import { useAvvikModalContext } from "../AvvikshandteringButton";
import { type AvvikViewModel, getViewmodelByType } from "../model/AvvikViewModel";
import MainMenu from "./MainMenu";
import StepIndicator from "./StepIndicator";
import { mapToAvvikRequest } from "./types/AvvikTypes";
import EndreFagomradeForsendelse from "./types/EndreFagomradeForsendelse";
import OverforTilAnnenEnhet from "./types/OverforTilAnnenEnhet";
import SlettForsendelse from "./types/SlettForsendelse";

interface AvvikshandteringModalProps {
    initialAvvik?: Avvik;
    initialAvvikType?: AvvikType;
}
export const AvvikMutationKeys = {
    sendAvvik: ["sendAvvik"],
};
interface AvvikStateContextProps {
    sendAvvikStatus: "idle" | "error" | "loading";
}
export const useAvvikStateContext = () => useContext(AvvikStateContext);
const AvvikStateContext = React.createContext<AvvikStateContextProps>({} as AvvikStateContextProps);
function AvvikshandteringModal(props: AvvikshandteringModalProps) {
    const { onCancel } = useAvvikModalContext();
    return (
        <Modal
            className="min-w-[35rem] max-w-[55rem]"
            aria-labelledby="modal-avvikshandtering"
            open
            onClose={onCancel}
            closeOnBackdropClick
        >
            <Modal.Body>
                <React.Suspense fallback={<Loader size="medium" />}>
                    <AvvikshandteringModalContent {...props} />
                </React.Suspense>
            </Modal.Body>
        </Modal>
    );
}
function AvvikshandteringModalContent(props: AvvikshandteringModalProps) {
    const { forsendelseId, saksnummer, paloggetEnhet, avvikListe, forsendelse } = useAvvikModalContext();
    const queryClient = useQueryClient();
    const bidragForsendelseApi = useBidragForsendelseApi();
    const { data: harTilgangTilTemaFar } = useHarTilgangTilTemaFar();
    const [selectedAvvik, setSelectedAvvik] = useState<AvvikViewModel | undefined>();
    const [activeStep, setActiveStep] = useState(props.initialAvvik || props.initialAvvikType ? 1 : 0);
    const avvikStateValue = useMemo(() => hentAvvik(), [avvikListe, forsendelse]);

    const sendAvvikFn = useMutation<void, void, Avvik>({
        mutationKey: AvvikMutationKeys.sendAvvik,
        mutationFn: async (avvik) => {
            const requestBody: Avvikshendelse = mapToAvvikRequest(avvik, saksnummer);
            await bidragForsendelseApi.api.utforAvvik(forsendelseId, requestBody, {
                headers: {
                    "X-enhet": paloggetEnhet,
                },
            });
            if (!skalKunneViderebehandleJournalpostEtterUtførtAvvik(avvik)) {
                RedirectTo.sakshistorikk(saksnummer);
            } else {
                queryClient.invalidateQueries({ queryKey: UseForsendelseApiKeys.forsendelse });
            }
        },
    });

    function hentAvvik(): AvvikViewModel[] {
        return avvikListe
            .map(getViewmodelByType)
            .filter((a) => a !== undefined)
            .map((avvik) => ({
                ...avvik,
                metadata: {
                    tema: forsendelse.tema,
                },
            }));
    }

    useEffect(() => {
        if (props.initialAvvik || props.initialAvvikType) {
            setSelectedAvvik(getAvvikViewModel(props.initialAvvik?.type || props.initialAvvikType));
        }
    }, []);

    const changeStep = (step: number) => {
        if (step === 0) {
            setSelectedAvvik(undefined);
        }
        setActiveStep(step);
    };

    function getAvvikViewModel(avvikType: AvvikType) {
        return avvikStateValue?.find((avvikViewModel) => avvikViewModel.type === avvikType);
    }

    const performSendAvvik = async (avvik: Avvik) => {
        sendAvvikFn.mutate(avvik);
    };

    function skalKunneViderebehandleJournalpostEtterUtførtAvvik(avvik: Avvik) {
        if (avvik.type === AvvikType.ENDRE_FAGOMRADE) {
            return (harTilgangTilTemaFar && avvik.fagomrade === FAGOMRADE.FAR) || avvik.fagomrade === FAGOMRADE.BID;
        }
        return ![AvvikType.OVERFOR_TIL_ANNEN_ENHET, AvvikType.SLETT_JOURNALPOST].some(
            (avvikType) => avvikType === avvik.type,
        );
    }

    const selectAvvik = (selectedAvvik: AvvikViewModel) => {
        setSelectedAvvik(selectedAvvik);
        setActiveStep(1);
        sendAvvikFn.reset();
    };

    function onPrevious() {
        changeStep(Math.max(activeStep - 1, 0));
    }

    function renderAvvik() {
        if (!selectedAvvik) return <MainMenu avvikViewModels={avvikStateValue} onClick={selectAvvik} />;
        function getTitle() {
            if (typeof selectedAvvik.title === "function") return selectedAvvik.title(selectedAvvik.metadata);
            return selectedAvvik.title;
        }
        return (
            <>
                <StepIndicator activeStep={activeStep} onChange={changeStep} selectedAvvik={selectedAvvik} />
                <Heading level={"3"} size={"medium"} spacing>
                    {getTitle()}
                </Heading>
                <React.Suspense fallback={<Loader size="small" />}>
                    {activeStep > 0 && sendAvvikFn.isIdle && <PreviousStepButton onPrevious={onPrevious} />}
                    <AvvikStep
                        selectedAvvik={selectedAvvik}
                        activeStep={activeStep}
                        setActiveStep={setActiveStep}
                        sendAvvik={performSendAvvik}
                        kanEndreForsendelseEtterAvvik={(avvik: Avvik) =>
                            skalKunneViderebehandleJournalpostEtterUtførtAvvik(avvik)
                        }
                        {...props}
                    />
                </React.Suspense>
            </>
        );
    }

    return (
        <React.Suspense fallback={<Loader size="medium" />}>
            <Heading size="large">Avvikshåndtering</Heading>
            {renderAvvik()}
        </React.Suspense>
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

export interface AvvikStepProps extends AvvikshandteringModalProps {
    activeStep: number;
    selectedAvvik: AvvikViewModel;
    setActiveStep: (value: number) => void;
    sendAvvik: (avvik: Avvik, ident?: string) => Promise<void>;
    kanEndreForsendelseEtterAvvik?: (avvik: Avvik) => boolean;
}

function AvvikStep(props: AvvikStepProps) {
    const { selectedAvvik } = props;
    switch (selectedAvvik.type) {
        case AvvikType.ENDRE_FAGOMRADE:
            return <EndreFagomradeForsendelse {...props} />;
        case AvvikType.SLETT_JOURNALPOST:
            return <SlettForsendelse {...props} />;
        case AvvikType.OVERFOR_TIL_ANNEN_ENHET:
            return <OverforTilAnnenEnhet {...props} />;
        default:
            return <div>Obs, dette burde ikke skje</div>;
    }
}

export default AvvikshandteringModal;
