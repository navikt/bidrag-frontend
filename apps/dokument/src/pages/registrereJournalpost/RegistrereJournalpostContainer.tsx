import "./RegistrereJournalpostContainer.css";

import { Button, HGrid, Page, VStack } from "@navikt/ds-react";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import Avvikshandtering from "../../common/components/avvik/Avvikshandtering";
import ErrorSummary from "../../common/components/form/ErrorSummary";
import environment from "../../environment";
import { useHentJournalpost, useRegistrerJournalpostMutation } from "../../hooks/useDokumentApi";
import { useAppContext } from "../../store/AppContext";
import { getErrorMessageWhenJournalpostStatusIsNotMottatt } from "../../types/journalpost";
import JournalpostDetaljer from "./components/journalpostdetaljer/JournalpostDetaljer";
import GjelderPersonPanel from "./components/person/GjelderPersonPanel";
import RegistrereJournalpostHeader from "./components/RegistrereJournalpostHeader";
import SakstilknyttningPanel from "./components/sakstilknytning/SakstilknyttningPanel";
import SearchSakOrPersonPanel from "./components/search/SearchSakOrPersonPanel";
import type { JournalpostToRegister } from "./components/types/JournalpostToRegister";
import { mapToReqistrerJournalpostRequest } from "./components/types/RequestMapper";

function RegistrereJournalpostContainer() {
    const {
        appState: { journalpostId, påloggetEnhet },
    } = useAppContext();
    const journalpost = useHentJournalpost();
    const { setError } = useAppContext();
    const registrerJournalpost = useRegistrerJournalpostMutation();
    const [waitingForRegisterJournalpost, setWaitingForRegisterJournalpost] = useState(false);

    const methods = useForm<JournalpostToRegister>({
        defaultValues: {
            journalpostId: journalpostId,
            journalforendeEnhet: påloggetEnhet,
            endreDokumenter: [],
        },
        reValidateMode: "onChange",
        mode: "all",
    });

    useEffect(() => {
        setError(undefined);
        const errorMessage = getErrorMessageWhenJournalpostStatusIsNotMottatt(journalpost);
        errorMessage && setError(errorMessage, "Beklager, journalposten kan ikke journalføres");
    }, [journalpost]);

    useEffect(() => {
        methods.register("journalpostId");
        methods.register("journalforendeEnhet");
    }, []);

    function onSubmit(data: JournalpostToRegister) {
        environment.system.isDevelopment && console.log("JournalpostToRegister form data", data);
        const journalpostToRegisterDTO = mapToReqistrerJournalpostRequest(
            journalpost.journalfortDato,
            data,
            journalpost.fagomrade,
        );
        setWaitingForRegisterJournalpost(true);
        registrerJournalpost
            .mutateAsync({ journalpostId: data.journalpostId, påloggetEnhet, journalpost: journalpostToRegisterDTO })
            .finally(() => setWaitingForRegisterJournalpost(false));
    }

    return (
        <div
            id="registrere-journalpost-container"
            className="registrere-journalpost-container"
            onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
        >
            <RegistrereJournalpostHeader />
            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)}>
                    <Page>
                        <Page.Block width="xl" gutters className="pt-4">
                            <HGrid gap="space-12" columns={{ xs: 1, sm: 2 }}>
                                <VStack gap="space-2">
                                    <SearchSakOrPersonPanel />
                                    <div className={"grid-border"} />
                                    <GjelderPersonPanel />
                                    <div className={"grid-border"} />
                                    <SakstilknyttningPanel />
                                </VStack>
                                <div>
                                    <JournalpostDetaljer />
                                </div>

                                <div>
                                    {methods.formState.isSubmitted && (
                                        <ErrorSummary errors={methods.formState.errors} />
                                    )}
                                    <div className="bottom-buttons">
                                        <Button
                                            size="small"
                                            onClick={methods.handleSubmit(onSubmit)}
                                            loading={waitingForRegisterJournalpost}
                                            id={"registrere-journalpost-knapp"}
                                            disabled={waitingForRegisterJournalpost}
                                        >
                                            Registrere og behandle sak
                                        </Button>
                                        <Avvikshandtering />
                                    </div>
                                </div>
                            </HGrid>
                        </Page.Block>
                    </Page>
                </form>
            </FormProvider>
        </div>
    );
}

export default RegistrereJournalpostContainer;
