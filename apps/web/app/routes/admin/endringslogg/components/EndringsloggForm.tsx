import {CheckmarkCircleIcon, ChevronDownIcon, ChevronLeftIcon, ChevronUpIcon, MagnifyingGlassIcon, TrashIcon,} from "@navikt/aksel-icons";
import {Box, Button, ErrorMessage, HStack, Label, Modal, Select, Switch, Textarea, TextField, VStack,} from "@navikt/ds-react";
import {useMutationState} from "@tanstack/react-query";
import React, {useEffect, useRef, useState} from "react";
import {Controller, FormProvider, useFieldArray, UseFieldArrayReturn, useForm, useFormContext, useWatch,} from "react-hook-form";

import {EndringsLoggDto, EndringsloggTilhorerSkjermbilde, Endringstype} from "~/api/types/admin.ts";
import {CustomQuillEditor} from "~/routes/admin/endringslogg/components/customEditor/CustomQuillEditor.tsx";
import {EndringsModal} from "~/routes/admin/endringslogg";

type Endring = {
    innhold: string;
    tittel: string;
    endringstype: Endringstype;
    id?: number;
};

type EndringForm = {
    innhold: string;
    tittel: string;
    endringstype: Endringstype;
};

export type EndringsloggFormValues = {
    id?: number;
    tittel: string;
    tilhørerSkjermbilde: "" | EndringsloggTilhorerSkjermbilde;
    sammendrag: string;
    erPåkrevd: boolean;
    endring: EndringForm;
    endringer: Endring[];
};

const fallbackToEmptyString = <T extends string | EndringsloggTilhorerSkjermbilde>(
    value: T | null | undefined
): T | "" => value ?? "";

const createDefaultValues = (endringslogg?: EndringsLoggDto): EndringsloggFormValues => {
    const defaultValues: EndringsloggFormValues = {
        id: !endringslogg?.id ? null : endringslogg.id,
        tittel: fallbackToEmptyString(endringslogg?.tittel),
        tilhørerSkjermbilde: fallbackToEmptyString(endringslogg?.gjelder),
        sammendrag: fallbackToEmptyString(endringslogg?.sammendrag),
        erPåkrevd: endringslogg?.erPåkrevd,
        endring: {
            tittel: "",
            innhold: "",
            endringstype: Endringstype.ENDRING,
        },
        endringer: endringslogg?.endringer?.map((endring) => ({
            innhold: endring?.innhold,
            tittel: endring?.tittel,
            endringstype: endring?.endringstype,
            id: endring?.id ? endring?.id : null,
        })),
    };

    return defaultValues;
};

export const EndringsloggTilhorerSkjermbildeToVisningsnavn = {
    [EndringsloggTilhorerSkjermbilde.ALLE]: "Alle (vises i alle skjermbilder)",
    [EndringsloggTilhorerSkjermbilde.BEHANDLING_ALLE]: "Behandling (alle)",
    [EndringsloggTilhorerSkjermbilde.BEHANDLING_BIDRAG]: "Bidrag",
    [EndringsloggTilhorerSkjermbilde.BEHANDLING_FORSKUDD]: "Forskudd",
    [EndringsloggTilhorerSkjermbilde.BEHANDLINGSAeRBIDRAG]: "Særbidrag",
    [EndringsloggTilhorerSkjermbilde.FORSENDELSE]: "Forsendelse",
    [EndringsloggTilhorerSkjermbilde.INNSYN_DOKUMENT]: "Innsyn dokument",
    [EndringsloggTilhorerSkjermbilde.SAMHANDLER]: "Samhandler",
};

export const EndringstypeToVisningsnavn = {
    [Endringstype.ENDRING]: "Endring",
    [Endringstype.FEILFIKS]: "Feilfiks",
    [Endringstype.NYHET]: "Nyhet",
};

const EndringsBox = ({
                         endringerFieldArray,
                     }: {
    endringerFieldArray: UseFieldArrayReturn<EndringsloggFormValues, "endringer">;
}) => {
    const quillRef = useRef(null);
    const modalRef = useRef<HTMLDialogElement>(null);
    const {getValues, control, resetField, setError, clearErrors} = useFormContext<EndringsloggFormValues>();

    const onAdd = () => {
        const endring = getValues("endring");
        let valid = true;

        if (!endring.tittel) {
            valid = false;
            setError("endring.tittel", {
                type: "required",
                message: "Dette feltet er påkrevd",
            });
        } else {
            clearErrors("endring.tittel");
        }

        if (!endring.innhold) {
            valid = false;
            setError("endring.innhold", {
                type: "required",
                message: "Dette feltet er påkrevd",
            });
        } else {
            clearErrors("endring.innhold");
        }

        if (valid) {
            endringerFieldArray.prepend(endring);
            resetField("endring");
            modalRef.current?.close();
        }
    };

    return (
        <>
            <Button
                type="button"
                variant="tertiary"
                size="small"
                className="w-max"
                onClick={() => {
                    endringerFieldArray.prepend({tittel: "", innhold: "", endringstype: Endringstype.ENDRING});
                }}
            >
                + Legg til endring
            </Button>
            <Modal
                ref={modalRef}
                header={{heading: "Endring"}}
                closeOnBackdropClick
                onClose={() => resetField("endring")}
                aria-labelledby="modal-heading"
                width={400}
            >
                <Modal.Body className="pb-0">
                    <Box background="default" padding="space-4" borderColor="neutral" borderWidth="1" borderRadius="4">
                        <VStack gap="space-4">
                            <Controller
                                name="endring.tittel"
                                control={control}
                                render={({field, fieldState}) => (
                                    <TextField
                                        {...field}
                                        label="Tittel"
                                        size="small"
                                        error={fieldState.error?.message}
                                        className="h-max"
                                    />
                                )}
                            />
                            <Controller
                                name="endring.endringstype"
                                control={control}
                                render={({field, fieldState}) => (
                                    <Select
                                        {...field}
                                        error={fieldState.error?.message}
                                        label="Endringstype"
                                        size="small"
                                        className="h-max"
                                    >
                                        {Object.values(Endringstype).map((endringstype) => (
                                            <option key={endringstype} value={endringstype}>
                                                {EndringstypeToVisningsnavn[endringstype]}
                                            </option>
                                        ))}
                                    </Select>
                                )}
                            />

                            <Controller
                                name="endring.innhold"
                                defaultValue=""
                                control={control}
                                render={({field, fieldState}) => (
                                    <CustomQuillEditor
                                        ref={quillRef}
                                        resize
                                        onTextChange={(innhold) => field.onChange(innhold)}
                                        readOnly={false}
                                        error={fieldState.error?.message}
                                        defaultValue={field.value}
                                    />
                                )}
                            />
                        </VStack>
                    </Box>
                </Modal.Body>
                <Modal.Footer>
                    <Button type="button" variant="tertiary" size="small" className="w-max" onClick={onAdd}>
                        + Legg til endring
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

const EndringsFormBox = ({
                             index,
                             endringerFieldArray,
                         }: {
    index: number;
    endringerFieldArray: UseFieldArrayReturn<EndringsloggFormValues, "endringer">;
}) => {
    const quillRef = useRef(null);
    const {control} = useFormContext<EndringsloggFormValues>();

    return (
        <>
            <Box background="default" padding="space-4" borderColor="neutral" borderWidth="1" borderRadius="4">
                <VStack gap="space-4">
                    <HStack gap="space-4" align="center" justify="space-between">
                        <Label size="small">Endring</Label>
                        <HStack gap="space-2">
                            <Button
                                type="button"
                                onClick={() => endringerFieldArray.move(index, index - 1)}
                                disabled={index === 0}
                                icon={<ChevronUpIcon aria-hidden/>}
                                variant="tertiary"
                                size="small"
                            />
                            <Button
                                type="button"
                                onClick={() => endringerFieldArray.move(index, index + 1)}
                                disabled={index === endringerFieldArray.fields.length - 1}
                                icon={<ChevronDownIcon aria-hidden/>}
                                variant="tertiary"
                                size="small"
                            />
                            <Button
                                type="button"
                                onClick={() => endringerFieldArray.remove(index)}
                                icon={<TrashIcon aria-hidden/>}
                                variant="tertiary"
                                size="small"
                            />
                        </HStack>
                    </HStack>

                    <Controller
                        name={`endringer.${index}.tittel`}
                        control={control}
                        rules={{
                            required: {
                                value: true,
                                message: "Dette feltet er påkrevd",
                            },
                        }}
                        render={({field, fieldState}) => (
                            <TextField
                                {...field}
                                label="Tittel"
                                size="small"
                                error={fieldState.error?.message}
                                className="h-max"
                            />
                        )}
                    />
                    <Controller
                        name={`endringer.${index}.endringstype`}
                        control={control}
                        rules={{
                            required: {
                                value: true,
                                message: "Dette feltet er påkrevd",
                            },
                        }}
                        render={({field, fieldState}) => (
                            <Select
                                {...field}
                                error={fieldState.error?.message}
                                label="Endringstype"
                                size="small"
                                className="h-max"
                            >
                                {Object.values(Endringstype).map((endringstype) => (
                                    <option key={endringstype} value={endringstype}>
                                        {EndringstypeToVisningsnavn[endringstype]}
                                    </option>
                                ))}
                            </Select>
                        )}
                    />

                    <Controller
                        name={`endringer.${index}.innhold`}
                        control={control}
                        rules={{
                            required: {
                                value: true,
                                message: "Dette feltet er påkrevd",
                            },
                        }}
                        render={({field, fieldState}) => (
                            <CustomQuillEditor
                                ref={quillRef}
                                resize
                                onTextChange={(innhold) => field.onChange(innhold)}
                                readOnly={false}
                                error={fieldState.error?.message}
                                defaultValue={field.value}
                            />
                        )}
                    />
                </VStack>
            </Box>
        </>
    );
};

export default function EndringsloggForm({
                                             onSave,
                                             endringslogg,
                                             mutationError,
                                         }: {
    onSave: (formValues: EndringsloggFormValues, onSuccess: (id: number) => void) => void;
    endringslogg?: EndringsLoggDto;
    mutationError: Error;
}) {
    const [previewed, setPreviewed] = useState<EndringsLoggDto | null>(null);
    const variables = useMutationState({
        filters: {mutationKey: ["createUpdateEndringslogg"], status: "pending"},
        select: (mutation) => mutation.state.variables,
    });
    const [showSaved, setShowSaved] = useState(false);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [saveAndLeave, setSaveAndLeave] = useState(false);
    const wasPendingRef = useRef(false);
    const navigate = useNavigate();
    const defaultValues = createDefaultValues(endringslogg);
    const formMethods = useForm<EndringsloggFormValues>({
        defaultValues,
        mode: "onSubmit",
        reValidateMode: "onChange",
    });
    const endringerFieldArray = useFieldArray({
        control: formMethods.control,
        name: "endringer",
    });
    const watchFieldArray = useWatch({control: formMethods.control, name: "endringer"});
    const controlledFields = endringerFieldArray.fields.map((field, index) => {
        return {
            ...field,
            ...watchFieldArray?.[index],
        };
    });

    useEffect(() => {
        const isPending = variables.length > 0;
        if (!isPending && wasPendingRef.current) {
            setShowSaved(true);
            setTimeout(() => setShowSaved(false), 1000);
        }
        wasPendingRef.current = isPending;
    }, [variables.length]);

    // Keyboard shortcut for save (Ctrl+S)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                e.preventDefault();
                formMethods.handleSubmit(onSubmit, onError)();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [formMethods]);

    // Warn on unsaved changes when leaving the page
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (formMethods.formState.isDirty) {
                e.preventDefault();
                e.returnValue = "";
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [formMethods.formState.isDirty]);
    const validateEndringer = () => {
        const endringer = formMethods.getValues("endringer");
        if (endringer.length < 0) {
            formMethods.setError("root", {
                type: "custom",
                message: "Du må legge til minst en endring",
            });
            return false;
        } else {
            formMethods.clearErrors("root");
            return true;
        }
    };

    const onSubmit = (formValues: EndringsloggFormValues) => {
        const hasEndringer = validateEndringer();

        if (!hasEndringer) {
            return;
        }

        onSave(formValues, (id) => {
            const updatedValues = {...formValues, id};
            formMethods.reset(updatedValues);
            if (saveAndLeave) {
                setSaveAndLeave(false);
                navigate("/admin/endringslogg");
            }
        });
    };

    const onError = () => {
        validateEndringer();
    };

    return (
        <>
            <Button
                variant="secondary"
                type="button"
                size="small"
                onClick={() => {
                    if (formMethods.formState.isDirty && formMethods.getValues("id") != null) {
                        setShowLeaveModal(true);
                    } else {
                        navigate("/admin/endringslogg");
                    }
                }}
                icon={<ChevronLeftIcon title="Tilbake" fontSize="1.5rem"/>}
                className="mb-4"
            >
                Tilbake
            </Button>
            <FormProvider {...formMethods} key={defaultValues.id}>
                <form onSubmit={formMethods.handleSubmit(onSubmit, onError)} id={`skjema-${defaultValues.id}`}>
                    <div className="grid gap-4">
                        <div className="grid gap-4 grid-cols-3">
                            <div className="grid gap-4">
                                <Controller
                                    name="tittel"
                                    control={formMethods.control}
                                    rules={{
                                        required: {
                                            value: true,
                                            message: "Dette feltet er påkrevd",
                                        },
                                    }}
                                    render={({field, fieldState}) => (
                                        <TextField
                                            {...field}
                                            label="Tittel"
                                            size="small"
                                            error={fieldState.error?.message}
                                            className="h-max"
                                        />
                                    )}
                                />
                                <Controller
                                    name="sammendrag"
                                    control={formMethods.control}
                                    rules={{
                                        required: {
                                            value: true,
                                            message: "Dette feltet er påkrevd",
                                        },
                                    }}
                                    render={({field, fieldState}) => (
                                        <Textarea
                                            {...field}
                                            label="Sammendrag"
                                            size="small"
                                            description="Tekst som vises når bruker trykker på bjelleknappen øverst til høyre"
                                            error={fieldState.error?.message}
                                            minRows={5}
                                        />
                                    )}
                                />
                                <Controller
                                    name="erPåkrevd"
                                    control={formMethods.control}
                                    render={({field}) => (
                                        <Switch
                                            checked={field.value}
                                            onChange={(e) => field.onChange(e.target.checked)}
                                            size="small"
                                            description="Saksbehandlere vil se endringene som en popup når de logger seg inn på bisys (ny skjermbildene)"
                                        >
                                            Er påkrevd
                                        </Switch>
                                    )}
                                />
                                {formMethods.formState.errors?.root && (
                                    <ErrorMessage size="small" showIcon>
                                        {formMethods.formState.errors.root.message}
                                    </ErrorMessage>
                                )}
                                <EndringsBox endringerFieldArray={endringerFieldArray}/>
                            </div>
                            <div>
                                <Controller
                                    name="tilhørerSkjermbilde"
                                    control={formMethods.control}
                                    rules={{
                                        required: {
                                            value: true,
                                            message: "Dette feltet er påkrevd",
                                        },
                                    }}
                                    render={({field, fieldState}) => (
                                        <Select
                                            {...field}
                                            label="Gjelder skjermbilde"
                                            size="small"
                                            error={fieldState.error?.message}
                                            className="h-max"
                                        >
                                            <option value="">- Velg hvilken skjermbilde endringen gjelder -</option>
                                            {Object.keys(EndringsloggTilhorerSkjermbildeToVisningsnavn).map(
                                                (gjelder) => (
                                                    <option key={gjelder} value={gjelder}>
                                                        {EndringsloggTilhorerSkjermbildeToVisningsnavn[gjelder]}
                                                    </option>
                                                )
                                            )}
                                        </Select>
                                    )}
                                />
                            </div>
                        </div>
                        {controlledFields.length > 0 && (
                            <div className="grid gap-4 grid-cols-1">
                                {controlledFields.map((item, index) => (
                                    <EndringsFormBox
                                        key={`${item.id} + ${index}`}
                                        index={index}
                                        endringerFieldArray={endringerFieldArray}
                                    />
                                ))}
                            </div>
                        )}

                        <HStack gap={"space-2"}>
                            <Button
                                type="submit"
                                variant="primary"
                                icon={showSaved ? <CheckmarkCircleIcon/> : undefined}
                                size="small"
                                loading={variables.length > 0}
                            >
                                {showSaved ? "Lagret" : "Lagre"}
                            </Button>
                            {endringslogg && endringslogg.endringer.length > 0 && (
                                <Button
                                    variant="tertiary"
                                    size="small"
                                    icon={<MagnifyingGlassIcon title="Forhåndsvisning"/>}
                                    onClick={() => setPreviewed(formMethods.getValues() as EndringsLoggDto)}
                                >
                                    Forhåndsvisning
                                </Button>
                            )}
                        </HStack>
                        {mutationError && (
                            <ErrorMessage size="small" showIcon>
                                Feil ved lagring. Prøv på nytt.
                            </ErrorMessage>
                        )}
                        {previewed && (
                            <EndringsModal
                                open={!!previewed}
                                onClose={() => setPreviewed(null)}
                                selectedEndringslogg={previewed}
                                closeOnBackdropClick
                            />
                        )}
                        <Modal
                            open={showLeaveModal}
                            onClose={() => setShowLeaveModal(false)}
                            header={{heading: "Ulagrede endringer"}}
                            closeOnBackdropClick={false}
                        >
                            <Modal.Body>
                                <p>Du har ulagrede endringer. Vil du forlate siden uten å lagre?</p>
                                <p>Du kan lagre endringene med Ctrl+S (eller Cmd+S på Mac).</p>
                            </Modal.Body>
                            <Modal.Footer>
                                <Button variant="secondary" size="small" onClick={() => setShowLeaveModal(false)}>
                                    Avbryt
                                </Button>
                                <Button
                                    variant="tertiary"
                                    size="small"
                                    onClick={() => {
                                        setShowLeaveModal(false);
                                        setSaveAndLeave(true);
                                        formMethods.handleSubmit(onSubmit, onError)();
                                    }}
                                >
                                    Lagre og forlat
                                </Button>
                                <Button
                                    variant="primary"
                                    size="small"
                                    onClick={() => {
                                        setShowLeaveModal(false);
                                        navigate("/admin/endringslogg");
                                    }}
                                >
                                    Forlat uten å lagre
                                </Button>
                            </Modal.Footer>
                        </Modal>
                    </div>
                </form>
            </FormProvider>
        </>
    );
}
