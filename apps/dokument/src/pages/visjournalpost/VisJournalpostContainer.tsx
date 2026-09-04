import "./VisJournalpost.css";

import { Button, HGrid, HStack, Loader, Page, VStack } from "@navikt/ds-react";
import React from "react";
import { useFormContext } from "react-hook-form";

import Avvikshandtering from "../../common/components/avvik/Avvikshandtering";
import ErrorSummary from "../../common/components/form/ErrorSummary";
import useJournalpostChangePoller from "../../common/hooks/useJournalpostChangePoller";
import { useHentJournalpost } from "../../hooks/useDokumentApi";
import { NY_SAK_SAKSNUMMER } from "../../types/sak";
import DokumenterPanel from "./components/DokumenterPanel";
import DistribuerButtons from "./components/distribuer/DistribuerButtons";
import EttersendingsoppgavePanel from "./components/EttersendingsoppgavePanel";
import GjelderBrukere from "./components/GjelderBrukere";
import JournalpostDetaljer from "./components/JournalpostDetaljer";
import JournalpostTitle from "./components/JournalpostTitle";
import KopierFraAnnenFagomradeButton from "./components/KopierFraAnnenFagomradeButton";
import TilknyttetSak from "./components/TilknyttetSak";
import VisJournalpostHeader from "./components/VisJournalpostHeader";
import { type UpdateJournalpostFormValues, useVisJournalpostContext } from "./context/VisJournalpostProvider";

export default function VisJournalpostContainer() {
    useJournalpostChangePoller();
    const journalpost = useHentJournalpost();
    const { formState } = useFormContext<UpdateJournalpostFormValues>();

    function getBrevkode(brevkode) {
        return brevkode ? <h5 className="brevKodeWrapper">{brevkode.kode}</h5> : <span></span>;
    }

    return (
        <div className="vis-journalpost-container" id={"vis-journalpost-container"}>
            <VisJournalpostHeader />
            <Page className="pt-4">
                <Page.Block width="xl" gutters>
                    <JournalpostTitle />
                    <HGrid gap="space-12" columns={{ xs: 1, sm: 2 }}>
                        <VStack gap="space-2">
                            <JournalpostDetaljer />
                            <div className={"grid-border"} />
                            <React.Suspense fallback={<Loader size="xsmall" />}>
                                <GjelderBrukere />
                            </React.Suspense>
                            <div className={"grid-border"} />
                            <TilknyttetSak />
                        </VStack>
                        <HStack gap={"space-4"} className="h-max">
                            <DokumenterPanel />
                            <EttersendingsoppgavePanel />
                        </HStack>
                    </HGrid>

                    <div>
                        {formState.isSubmitted && <ErrorSummary errors={formState.errors} />}
                        <div className="bottom-buttons">
                            <RedigereButtons />
                            <Avvikshandtering />
                            <DistribuerButtons />
                            <KopierFraAnnenFagomradeButton />
                        </div>
                        {getBrevkode(journalpost.brevkode)}
                    </div>
                </Page.Block>
            </Page>
        </div>
    );
}

function RedigereButtons() {
    const journalpost = useHentJournalpost();

    const { startEditMode, isEditMode, onSubmit, savingJournalpost } = useVisJournalpostContext();
    const { getValues } = useFormContext<UpdateJournalpostFormValues>();
    const isAddedNySak = () => {
        const saker = getValues("tilknyttSaker");
        return saker?.includes(NY_SAK_SAKSNUMMER);
    };

    if (!journalpost.isTemaBidrag || (journalpost.isForsendelse && journalpost.feilfort)) {
        return null;
    }
    if (!isEditMode) {
        return (
            <Button size="small" type={"button"} variant={"primary"} id={"redigerButton"} onClick={startEditMode}>
                Rediger
            </Button>
        );
    }

    return (
        <Button
            id={"lagreButton"}
            type={"button"}
            size="small"
            variant={"primary"}
            onClick={onSubmit}
            loading={savingJournalpost}
            disabled={savingJournalpost}
        >
            {isAddedNySak() ? "Lagre og behandle sak" : "Lagre"}
        </Button>
    );
}
