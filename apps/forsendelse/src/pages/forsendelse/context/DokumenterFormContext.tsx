import type { OppdaterForsendelseForesporsel } from "@bidrag/api/BidragForsendelseApi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import dayjs from "dayjs";
import { createContext, type PropsWithChildren, useContext, useEffect, useRef, useState } from "react";
import { type FieldArrayWithId, FormProvider, useFieldArray, useForm, useFormContext } from "react-hook-form";
import { useBidragForsendelseApi } from "../../../api/api";
import { DokumentStatus } from "../../../constants/DokumentStatus";
import { useErrorContext } from "../../../context/ErrorProvider";
import { mapVarselEttersendelse } from "../../../helpers/forsendelseHelpers";
import { UseForsendelseApiKeys, useHentForsendelseQuery } from "../../../hooks/useForsendelseApi";
import type { IDokument } from "../../../types/Dokument";
import { parseErrorMessageFromAxiosError } from "../../../utils/ErrorUtils";

export type FormIDokument = FieldArrayWithId<IForsendelseFormProps, "dokumenter">;
interface IDokumenterContext {
    isSavingChanges: boolean;
    hasChanged: boolean;
    deleteMode: boolean;
    toggleDeleteMode: () => void;
    saveChanges: () => void;
    validateCanSendForsendelse: (manueltDistribusjon?: boolean) => boolean;
    forsendelseId: string;
    dokumenter: FormIDokument[];
    swapDocuments: (from: number, to: number) => void;
    addDocuments: (selectedDocuments: IDokument[]) => void;
    deleteDocument: (deleteDocument: FormIDokument) => void;
    updateDocument: (updatedDocument: FormIDokument) => void;
    resetDocumentChanges: () => void;
    updateTitle: (tittel: string, dokumentreferanse: string) => void;
    setIsEditingTittel: (isEditing: boolean) => void;
}

interface IDokumenterPropsContext {
    forsendelseId: string;
}
export type VarselDokumentType = "SKJEMA" | "FRITEKST";

export type VarselEttersendelseFormProps = {
    tittel: string;
    journalpostId?: string;
    innsendingsfristDager: number;
    vedleggsliste: VarselEttersendelseVedleggProps[];
};

export type VarselEttersendelseVedleggProps = {
    varselDokumentId?: number;
    tittel: string;
    skjemaId?: string;
};
export interface IForsendelseFormProps {
    dokumenter: IDokument[];
    ettersendingsoppgave?: VarselEttersendelseFormProps;
}

export type OppdaterDokumentTittelMutationProps = { tittel: string; dokumentreferanse: string };
export const DokumenterFormContext = createContext<IDokumenterContext>({} as IDokumenterContext);

function DokumenterFormProvider({ children, ...props }: PropsWithChildren<IDokumenterPropsContext>) {
    const forsendelse = useHentForsendelseQuery();
    const methods = useForm<IForsendelseFormProps>({
        defaultValues: {
            dokumenter: forsendelse.dokumenter,
            ettersendingsoppgave: mapVarselEttersendelse(forsendelse.ettersendingsoppgave),
        },
    });

    return (
        <FormProvider {...methods}>
            <DokumenterProvider {...props}>{children}</DokumenterProvider>
        </FormProvider>
    );
}

function DokumenterProvider({ children, ...props }: PropsWithChildren<IDokumenterPropsContext>) {
    const queryClient = useQueryClient();
    const { addError, resetError } = useErrorContext();
    const bidragForsendelseApi = useBidragForsendelseApi();
    const forsendelse = useHentForsendelseQuery();
    const [deleteMode, setDeleteMode] = useState(false);
    const { reset, handleSubmit, formState, setError, resetField, getValues, clearErrors } =
        useFormContext<IForsendelseFormProps>();
    const { fields, append, update, move } = useFieldArray<IForsendelseFormProps, "dokumenter">({
        name: "dokumenter",
    });

    const { isDirty, dirtyFields } = formState;
    const [isEditingTittel, setIsEditingTittel] = useState(false);
    // titles saved locally but not yet reflected in the polled forsendelse data
    const pendingTitlesRef = useRef<Record<string, string>>({});

    const oppdaterDokumentTittelFn = useMutation<unknown, unknown, OppdaterDokumentTittelMutationProps>({
        mutationFn: ({ tittel, dokumentreferanse }) => {
            resetError();
            return bidragForsendelseApi.api.oppdaterDokument(forsendelse.forsendelseId, dokumentreferanse, {
                tittel,
            });
        },

        onError: (error: AxiosError, variables) => {
            delete pendingTitlesRef.current[variables.dokumentreferanse];
            const errorMessage = parseErrorMessageFromAxiosError(error);
            addError({
                message: `Det skjedde en feil ved lagring av dokumentittel "${variables.tittel}": ${errorMessage}`,
                source: "dokumenter",
            });
        },
    });

    const oppdaterDokumenterMutation = useMutation({
        mutationKey: ["oppdaterDokumenterMutation"],
        mutationFn: (dokumenter: IDokument[]) => {
            resetError();
            const request: OppdaterForsendelseForesporsel = {
                dokumenter: dokumenter.map((dokument) => ({
                    dokumentreferanse: dokument.dokumentreferanse,
                    dokumentmalId: dokument.dokumentmalId,
                    språk: dokument.språk,
                    dokumentDato: dayjs(dokument.dokumentDato).format("YYYY-MM-DDTHH:mm:ss"),
                    fjernTilknytning: dokument.status === DokumentStatus.SLETTET,
                    tittel: dokument.tittel,
                    journalpostId: dokument.journalpostId,
                })),
            };
            return bidragForsendelseApi.api.oppdaterForsendelse(props.forsendelseId, request);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: UseForsendelseApiKeys.forsendelse });
        },
        onError: (error: AxiosError) => {
            const errorMessage = parseErrorMessageFromAxiosError(error);
            addError({ message: `Kunne ikke lagre endringer: ${errorMessage}`, source: "dokumenter" });
        },
    });
    useEffect(() => {
        // skip background sync while a title is being edited so the ongoing edit isn't wiped out;
        // re-runs once editing ends so data that arrived mid-edit is no longer lost
        if (!forsendelse.isStaleData && !isEditingTittel) {
            resetForm();
        }
    }, [forsendelse.dokumenter, isEditingTittel]);

    const resetForm = () => {
        reset({
            dokumenter: mergePendingTitles(forsendelse.dokumenter),
            ettersendingsoppgave: mapVarselEttersendelse(forsendelse.ettersendingsoppgave),
        });
    };

    function mergePendingTitles(dokumenter: IDokument[]) {
        const pendingTitles = pendingTitlesRef.current;
        if (Object.keys(pendingTitles).length === 0) return dokumenter;
        return dokumenter.map((dokument) => {
            const pendingTittel = pendingTitles[dokument.dokumentreferanse];
            if (pendingTittel === undefined) return dokument;
            if (pendingTittel === dokument.tittel) {
                delete pendingTitles[dokument.dokumentreferanse];
                return dokument;
            }
            return { ...dokument, tittel: pendingTittel };
        });
    }
    const saveChanges = (formProps: IForsendelseFormProps) => {
        oppdaterDokumenterMutation.mutate(formProps.dokumenter);
    };

    const deleteDocument = (deleteDocument: FormIDokument) => {
        const index = fields.indexOf(deleteDocument);
        update(index, {
            ...deleteDocument,
            gammelStatus: deleteDocument.status,
            status:
                deleteDocument.status === DokumentStatus.SLETTET ? deleteDocument.gammelStatus : DokumentStatus.SLETTET,
        });
    };
    const updateDocument = (updatedDocument: FormIDokument) => {
        const index = fields.indexOf(updatedDocument);
        update(index, updatedDocument);
    };

    function validateCanSendForsendelse(manueltDistribusjon?: boolean) {
        clearErrors("root.kanDistribueres");
        if (isDirty && Object.keys(dirtyFields).length > 0) {
            setError("root", { message: "Endringene må lagres før distribusjon av forsendelse kan bestilles" });
            setError("root.kanDistribueres", { message: "Forsendelse kan ikke distribueres" });
            return false;
        }
        let isValid = true;
        let index = 0;
        for (const dok of fields) {
            const hasValidState = [DokumentStatus.FERDIGSTILT, DokumentStatus.KONTROLLERT].includes(dok.status);
            if (!hasValidState) {
                isValid = false;
                const errorMessage =
                    dok.status === DokumentStatus.MÅ_KONTROLLERES
                        ? `Dokument "${dok.tittel}" må kontrolleres`
                        : `Dokument "${dok.tittel}" må ferdigstilles`;
                setError(`dokumenter.${index}`, { message: errorMessage });
            }
            index++;
        }
        const varsel = getValues("ettersendingsoppgave");
        if (varsel && (!varsel.tittel || varsel.tittel.length === 0)) {
            setError("ettersendingsoppgave", { message: "Tittel på ettersendingsoppgaven kan ikke være tom" });
            isValid = false;
        } else if (varsel && varsel.vedleggsliste.length === 0) {
            setError("ettersendingsoppgave", { message: "Ettersendingsoppgaven må inneholde minst ett dokument" });
            isValid = false;
        }
        if (varsel && manueltDistribusjon) {
            setError("root", {
                message: "Kan ikke bestille lokal utskrift med ettersendingsoppgave",
            });
            isValid = false;
        }
        if (!isValid) {
            setError("root.kanDistribueres", { message: "Forsendelse kan ikke distribueres" });
        }
        return isValid;
    }

    function swapDocuments(indexA: number, indexB: number) {
        move(indexA, indexB);
        submitAndSaveChanges();
    }

    function updateTitle(tittel: string, dokumentreferanse: string) {
        pendingTitlesRef.current[dokumentreferanse] = tittel;
        oppdaterDokumentTittelFn.mutate({ tittel, dokumentreferanse });
        const index = fields.find((dok) => dok.dokumentreferanse === dokumentreferanse).index;
        resetField(`dokumenter.${index}.tittel`, { defaultValue: tittel });
    }

    function submitAndSaveChanges() {
        if (formState.isSubmitted || formState.errors) {
            reset(undefined, {
                keepDirty: true,
                keepDirtyValues: true,
                keepValues: true,
            });
        }
        handleSubmit(saveChanges)();
    }

    function addDocuments(selectedDocuments: IDokument[]) {
        if (selectedDocuments != null && selectedDocuments.length > 0) {
            append(selectedDocuments);
            submitAndSaveChanges();
        }
    }
    function toggleDeleteMode() {
        if (deleteMode) {
            resetForm();
        }
        setDeleteMode((prev) => !prev);
    }
    const hasChanged =
        isDirty &&
        dirtyFields.dokumenter?.filter((dok) => {
            return !(dok.tittel && Object.keys(dok).length === 1);
        }).length > 0;
    return (
        <DokumenterFormContext.Provider
            value={{
                forsendelseId: props.forsendelseId,
                dokumenter: fields,
                hasChanged: hasChanged,
                isSavingChanges: oppdaterDokumenterMutation.isPending,
                addDocuments,
                deleteDocument,
                validateCanSendForsendelse,
                updateDocument,
                saveChanges: handleSubmit(saveChanges),
                swapDocuments,
                resetDocumentChanges: resetForm,
                updateTitle,
                setIsEditingTittel,
                deleteMode,
                toggleDeleteMode,
            }}
        >
            {children}
        </DokumenterFormContext.Provider>
    );
}
function useDokumenterForm() {
    const context = useContext(DokumenterFormContext);
    if (context === undefined) {
        throw new Error("useDokumenter must be used within a ForsendelseProvider");
    }
    return context;
}

export { DokumenterFormProvider, useDokumenterForm };
