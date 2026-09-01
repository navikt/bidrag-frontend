import React, { type PropsWithChildren, useContext, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import environment from "../../../environment";
import { useHentJournalpost, useLagreJournalpost } from "../../../servicesV2/useDokumentApi";
import { useAppContext } from "../../../store/AppContext";
import {
    type EndreDokument,
    type EndreReturDetaljer,
    JournalStatus,
    LagreJournalpostRequest,
} from "../../../types/api/JournalpostTypes";
import type { Journalpost } from "../../../types/journalpost";

interface EnkelJournalpostProviderProps {
    exitEditMode: () => void;
    startEditMode: () => void;
    onSubmit: () => void;
    isEditMode: boolean;
    savingJournalpost: boolean;
}

export enum ApplicationViewModes {
    VIEW = "VIEW",
    EDIT = "EDIT",
}

export const useVisJournalpostContext = () => useContext(EnkelJournalpostContext);
const EnkelJournalpostContext = React.createContext<EnkelJournalpostProviderProps>({} as EnkelJournalpostProviderProps);

export interface UpdateJournalpostFormValues {
    tittel?: string;
    avsenderNavn?: string;
    dokumentDato?: string;
    tilknyttSaker?: string[];
    endreDokumenter: EndreDokument[];
    endreReturDetaljer: EndreReturDetaljer[];
}

export class UpdateJournalpost {
    updateJournalpostFormValues: UpdateJournalpostFormValues;
    journalpost: Journalpost;

    constructor(updateJournalpostFormValues: UpdateJournalpostFormValues, journalpost: Journalpost) {
        this.updateJournalpostFormValues = updateJournalpostFormValues;
        this.journalpost = journalpost;
    }

    toLagreJournalpostRequest(): LagreJournalpostRequest {
        const { endreDokumenter, dokumentDato, avsenderNavn, tittel, tilknyttSaker, endreReturDetaljer } =
            this.updateJournalpostFormValues;
        const endreDokumenterFiltered = endreDokumenter?.filter((e) => e !== undefined);
        const lagreJournalpostRequest = new LagreJournalpostRequest(this.journalpost.journalpostId);
        lagreJournalpostRequest.dokumentDato = dokumentDato;
        lagreJournalpostRequest.journaldato = this.journalpost.journalfortDato;
        lagreJournalpostRequest.avsenderNavn = avsenderNavn;
        lagreJournalpostRequest.tilknyttSaker = tilknyttSaker ? [...tilknyttSaker] : undefined;
        lagreJournalpostRequest.endreDokumenter = endreDokumenterFiltered;
        lagreJournalpostRequest.endreReturDetaljer = endreReturDetaljer
            ? endreReturDetaljer
                  .filter((endreReturDetaljer) => this.hasReturDetaljerChanged(endreReturDetaljer))
                  .map((e) => ({ ...e }))
            : undefined;
        if (this.kanEndreJournalpostTittel()) {
            lagreJournalpostRequest.tittel = tittel ?? this.getHoveddokumentTittel();
        }
        return lagreJournalpostRequest;
    }

    private kanEndreJournalpostTittel() {
        if (!(this.journalpost.isJoarkJournalpost && this.journalpost.isUtgaaende)) {
            return true;
        }

        return this.journalpost.journalstatus === JournalStatus.UNDER_PRODUKSJON;
    }

    private getHoveddokumentTittel() {
        const hoveddokId = this.journalpost.dokumenter?.[0]?.dokumentreferanse;
        const hoveddok = this.updateJournalpostFormValues.endreDokumenter?.find((dok) => dok.dokId == hoveddokId);
        return hoveddok?.tittel;
    }

    hasReturDetaljerChanged(formValues: EndreReturDetaljer) {
        const existing = this.journalpost.returDetaljer?.logg?.find((logg) => logg.dato === formValues.originalDato);
        return formValues.nyDato !== undefined || formValues.beskrivelse !== existing.beskrivelse;
    }
}

export default function VisJournalpostProvider({ children }: PropsWithChildren<unknown>) {
    const [mode, setMode] = useState<string>(ApplicationViewModes.VIEW);
    const [savingJournalpost, setSavingJournalpost] = useState<boolean>(false);
    const {
        appState: { journalpostId, påloggetEnhet },
    } = useAppContext();
    const formMethods = useForm<UpdateJournalpostFormValues>({
        reValidateMode: "onSubmit",
        mode: "all",
    });

    const journalpost = useHentJournalpost();
    const lagreJournalpostWithNewSak = useLagreJournalpost();

    function startEditMode() {
        setMode(ApplicationViewModes.EDIT);
    }

    function exitEditMode() {
        setMode(ApplicationViewModes.VIEW);
    }

    function saveJournalPost(data: UpdateJournalpostFormValues) {
        environment.system.isDevelopment && console.log("VisJournalpost form data", data);
        const lagreJournalpostRequest = new UpdateJournalpost(data, journalpost).toLagreJournalpostRequest();
        setSavingJournalpost(true);
        lagreJournalpostWithNewSak
            .mutateAsync({ journalpost: lagreJournalpostRequest, journalpostId, enhet: påloggetEnhet, refresh: true })
            .finally(() => {
                setSavingJournalpost(false);
                exitEditMode();
            });
    }

    function onSubmit() {
        formMethods.handleSubmit(saveJournalPost)();
    }

    return (
        <FormProvider {...formMethods}>
            <EnkelJournalpostContext.Provider
                value={{
                    onSubmit,
                    startEditMode,
                    exitEditMode,
                    savingJournalpost,
                    isEditMode: mode === ApplicationViewModes.EDIT,
                }}
            >
                {children}
            </EnkelJournalpostContext.Provider>
        </FormProvider>
    );
}
