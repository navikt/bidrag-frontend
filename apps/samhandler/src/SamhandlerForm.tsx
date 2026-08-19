import {OffentligIDType, type SamhandlerDto, Sprak, Valutakode} from "@bidrag/api/SamhandlerApi";
import {
    BodyShort,
    Box,
    Button,
    Checkbox,
    ErrorMessage,
    ErrorSummary,
    Heading,
    HGrid,
    InfoCard,
    Modal,
    Select,
    Switch,
    Textarea,
    TextField,
    VStack,
} from "@navikt/ds-react";
import type {UseMutationResult} from "@tanstack/react-query";
import type {AxiosError} from "axios";
import {useRef, useState} from "react";
import {Controller, FormProvider, useForm} from "react-hook-form";
import type {Samhandler} from "./SamhandlerSøk";
import {sortInAlphabeticOrder} from "./utils/sorting";
import {useHentLandkoder, useHentVisningsnavn} from "./utils/useApiData";
import {erGyldigKontonummer, objectHasSomeValue} from "./utils/validator.ts";

/** Definerer hvilket område samhandleren er knyttet til. */
export enum SamhandlerDtoOmradekodeEnum {
    UTENRIKSSTASJON = "UTENRIKSSTASJON",
    ADVOKAT = "ADVOKAT",
    ARBEIDSGIVER = "ARBEIDSGIVER",
    REELL_MOTTAKER = "REELL_MOTTAKER",
    UTENLANDSK_PERSON = "UTENLANDSK_PERSON",
    UTENLANDSK_FOGD = "UTENLANDSK_FOGD",
    SOSIALKONTO = "SOSIALKONTO",
    BARNEVERNSINSTITUSJON = "BARNEVERNSINSTITUSJON",
    VERGE = "VERGE",
}

type Kontonummer = {
    norskKontonummer: string;
    banknavn: string;
    bankCode: string;
    landkodeBank: string;
    swift: string;
    valutakode: "" | Valutakode;
    iban: string;
};

type SamhandlerFormValues = {
    samhandlerId: null | string;
    språk: "" | Sprak;
    offentligId: string;
    offentligIdType: "" | OffentligIDType;
    områdekode:
        | ""
        | "UTENRIKSSTASJON"
        | "ADVOKAT"
        | "ARBEIDSGIVER"
        | "REELL_MOTTAKER"
        | "UTENLANDSK_PERSON"
        | "UTENLANDSK_FOGD"
        | "SOSIALKONTO"
        | "BARNEVERNSINSTITUSJON"
        | "VERGE";
    navn: string;
    kontaktperson: string;
    kontaktTelefon: string;
    kontaktEpost: string;
    notat: string;
    adresse: {
        adresselinje1: string;
        adresselinje2: string;
        adresselinje3: string;
        poststed: string;
        postnummer: string;
        land: string;
    };
    kontonummer: Kontonummer;
};

const checkIfKontoHasAnyNonEmptyValues = (kontonummer: Kontonummer) => {
    const values = [kontonummer.norskKontonummer, kontonummer.iban, kontonummer.swift];
    return values.some((v) => !!v?.trim());
};

const fallbackToUndefined = <T extends string | OffentligIDType | Sprak | SamhandlerDtoOmradekodeEnum | Valutakode>(
    value: T | "",
): T | undefined => (value === "" ? undefined : value);
const fallbackToEmptyString = <T extends string | OffentligIDType | Sprak | SamhandlerDtoOmradekodeEnum | Valutakode>(
    value: T | null | undefined,
): T | "" => value ?? "";

const createPayload = (formValues: SamhandlerFormValues): SamhandlerDto => {
    const payload: SamhandlerDto = {
        samhandlerId: !formValues.samhandlerId ? undefined : formValues.samhandlerId,
        språk: fallbackToUndefined(formValues.språk),
        offentligId: formValues.offentligId.trim(),
        offentligIdType: formValues.offentligIdType as OffentligIDType,
        områdekode: fallbackToUndefined(formValues.områdekode),
        navn: formValues.navn,
        kontaktperson: fallbackToUndefined(formValues.kontaktperson.trim()),
        kontaktTelefon: fallbackToUndefined(formValues.kontaktTelefon.trim()),
        kontaktEpost: fallbackToUndefined(formValues.kontaktEpost.trim()),
        notat: fallbackToUndefined(formValues.notat.trim()),
        adresse: objectHasSomeValue(formValues.adresse)
            ? {
                adresselinje1: fallbackToUndefined(formValues.adresse.adresselinje1.trim()),
                adresselinje2: fallbackToUndefined(formValues.adresse.adresselinje2.trim()),
                adresselinje3: fallbackToUndefined(formValues.adresse.adresselinje3.trim()),
                poststed: fallbackToUndefined(formValues.adresse.poststed.trim()),
                postnummer: fallbackToUndefined(formValues.adresse.postnummer.trim()),
                land: fallbackToUndefined(formValues.adresse.land.trim()),
            }
            : undefined,
        kontonummer: objectHasSomeValue(formValues.kontonummer)
            ? {
                norskKontonummer: fallbackToUndefined(formValues.kontonummer.norskKontonummer.trim()),
                banknavn: fallbackToUndefined(formValues.kontonummer.banknavn.trim()),
                bankCode: fallbackToUndefined(formValues.kontonummer.bankCode.trim()),
                landkodeBank: fallbackToUndefined(formValues.kontonummer.landkodeBank.trim()),
                swift: fallbackToUndefined(formValues.kontonummer.swift.trim()),
                valutakode: fallbackToUndefined(formValues.kontonummer.valutakode),
                iban: fallbackToUndefined(formValues.kontonummer.iban.trim()),
            }
            : undefined,
    };

    return payload;
};

const createDefaultValues = (samhandler?: SamhandlerDto): SamhandlerFormValues => {
    const defaultValues = {
        samhandlerId: !samhandler?.samhandlerId ? null : samhandler.samhandlerId,
        språk: fallbackToEmptyString(samhandler?.språk),
        offentligId: fallbackToEmptyString(samhandler?.offentligId),
        offentligIdType: fallbackToEmptyString(samhandler?.offentligIdType),
        områdekode: fallbackToEmptyString(samhandler?.områdekode),
        navn: fallbackToEmptyString(samhandler?.navn),
        kontaktperson: fallbackToEmptyString(samhandler?.kontaktperson),
        kontaktTelefon: fallbackToEmptyString(samhandler?.kontaktTelefon),
        kontaktEpost: fallbackToEmptyString(samhandler?.kontaktEpost),
        notat: fallbackToEmptyString(samhandler?.notat),
        adresse: {
            adresselinje1: fallbackToEmptyString(samhandler?.adresse?.adresselinje1),
            adresselinje2: fallbackToEmptyString(samhandler?.adresse?.adresselinje2),
            adresselinje3: fallbackToEmptyString(samhandler?.adresse?.adresselinje3),
            poststed: fallbackToEmptyString(samhandler?.adresse?.poststed),
            postnummer: fallbackToEmptyString(samhandler?.adresse?.postnummer),
            land: fallbackToEmptyString(samhandler?.adresse?.land),
        },
        kontonummer: {
            norskKontonummer: fallbackToEmptyString(samhandler?.kontonummer?.norskKontonummer),
            banknavn: fallbackToEmptyString(samhandler?.kontonummer?.banknavn),
            bankCode: fallbackToEmptyString(samhandler?.kontonummer?.bankCode),
            landkodeBank: fallbackToEmptyString(samhandler?.kontonummer?.landkodeBank),
            swift: fallbackToEmptyString(samhandler?.kontonummer?.swift),
            valutakode: fallbackToEmptyString(samhandler?.kontonummer?.valutakode),
            iban: fallbackToEmptyString(samhandler?.kontonummer?.iban),
        },
    };

    return defaultValues;
};

export default function SamhandlerForm({
                                           mutation,
                                           samhandler,
                                           onSuccess,
                                           typeOfAction,
                                           onClose,
                                           inModal = true,
                                       }: {
    mutation: UseMutationResult<SamhandlerDto, AxiosError, SamhandlerDto, unknown>;
    samhandler?: SamhandlerDto;
    onSuccess: (samhandler: Samhandler) => void;
    typeOfAction: "edit" | "create";
    onClose: () => void;
    inModal?: boolean;
}) {
    const {data: visningsnavn} = useHentVisningsnavn();
    const landkoder = useHentLandkoder();
    const visningsnavnLandkoder = landkoder
        .map((landkode) => ({
            landkode: landkode,
            visningsnavn: visningsnavn[landkode] ?? "Ukjent",
        }))
        .filter((land) => !!land.visningsnavn)
        .sort((a, b) => sortInAlphabeticOrder(a.visningsnavn, b.visningsnavn));
    const errorRef = useRef<HTMLDivElement>(null);
    const defaultValues = createDefaultValues(samhandler);
    const hasKontonummer = checkIfKontoHasAnyNonEmptyValues(defaultValues.kontonummer);
    const [erRM, setRM] = useState(hasKontonummer);
    const [erBekreftet, setBekreftet] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | string[] | null>(null);
    const formMethods = useForm<SamhandlerFormValues>({
        defaultValues,
        mode: "onSubmit",
        reValidateMode: "onChange",
    });

    const validateKontoopplysninger = (isChecked = erRM) => {
        const {kontonummer} = formMethods.getValues();
        const hasAnyValue = checkIfKontoHasAnyNonEmptyValues(kontonummer);

        if (isChecked && !hasAnyValue) {
            formMethods.setError("root.kontoopplysninger", {
                type: "custom",
                message: "Mangler kontoopplysninger",
            });
            return false;
        } else {
            formMethods.clearErrors("root.kontoopplysninger");
            return true;
        }
    };

    const onSave = (formValues: SamhandlerFormValues) => {
        const validKontoopplysninger = validateKontoopplysninger();
        if (!validKontoopplysninger) {
            return;
        }

        const payload = createPayload(formValues);

        mutation.mutate(payload, {
            onSuccess: (response) => {
                onSuccess(response);
                formMethods.reset();
                setErrorMessage(null);
                onClose();
            },
            onError: (error) => {
                if (error.response?.data && typeof error.response.data === "object") {
                    const errorData = error.response.data as Record<string, unknown>;
                    const {duplikatSamhandler, ugyldigInput} = errorData;
                    const ugyldigInputData = ugyldigInput as { feltnavn: string; feilmelding: string }[];
                    if (
                        Array.isArray(duplikatSamhandler) &&
                        duplikatSamhandler.length > 0 &&
                        typeof duplikatSamhandler[0] === "object" &&
                        duplikatSamhandler[0] !== null
                    ) {
                        const feilmelding = (duplikatSamhandler[0] as Record<string, unknown>)?.feilmelding;
                        if (typeof feilmelding === "string") {
                            setErrorMessage(feilmelding);
                        }
                    } else if (typeof errorData?.feilmelding === "string") {
                        setErrorMessage(errorData.feilmelding);
                    } else if (ugyldigInputData !== undefined) {
                        setErrorMessage(ugyldigInputData.map((input) => input.feilmelding));
                    }
                }
                errorRef.current?.focus();
                errorRef.current?.scrollIntoView({behavior: "smooth", block: "center", inline: "nearest"});
            },
        });
    };

    const onError = () => {
        validateKontoopplysninger();
    };

    const formId = `skjema-${defaultValues.samhandlerId}`;

    const actionButtons = (
        <>
            <Button
                disabled={typeOfAction === "edit" && !erBekreftet}
                variant="primary"
                size="small"
                form={formId}
                loading={mutation.isPending}
            >
                Lagre
            </Button>
            <Button variant="tertiary" size="small" type="button" onClick={onClose}>
                Avbryt
            </Button>
        </>
    );

    const formBody = (
        <form onSubmit={formMethods.handleSubmit(onSave, onError)} id={formId} className="mb-0">
            <VStack gap={"space-16"}>
                {mutation.error && (
                    <ErrorSummary ref={errorRef}>
                        {Array.isArray(errorMessage) ? (
                            errorMessage.map((message) => <ErrorSummary.Item>{message}</ErrorSummary.Item>)
                        ) : (
                            <ErrorSummary.Item>
                                {errorMessage ? errorMessage : "Feil ved lagring. Prøv på nytt."}
                            </ErrorSummary.Item>
                        )}
                    </ErrorSummary>
                )}
                <HGrid gap={{xs: "space-8", md: "space-12"}} columns={3} align="start">
                    <Controller
                        name="navn"
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
                                label="Navn"
                                size="small"
                                error={fieldState.error?.message}
                                className="h-max"
                            />
                        )}
                    />
                    <Controller
                        name="språk"
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
                                label="Språk"
                                size="small"
                                error={fieldState.error?.message}
                                className="h-max"
                            >
                                <option value="">- Velg språk -</option>
                                {Object.values(Sprak)
                                    .map((sprak) => ({
                                        sprak,
                                        visningsnavn: visningsnavn[sprak] ?? "Ukjent",
                                    }))
                                    .filter((sprak) => !!sprak.visningsnavn)
                                    .sort((a, b) => sortInAlphabeticOrder(a.visningsnavn, b.visningsnavn))
                                    .map((sprak) => (
                                        <option key={sprak.sprak} value={sprak.sprak}>
                                            {sprak.visningsnavn}
                                        </option>
                                    ))}
                            </Select>
                        )}
                    />
                    <Controller
                        name="offentligId"
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
                                label="OffentligId"
                                size="small"
                                error={fieldState.error?.message}
                                className="h-max"
                            />
                        )}
                    />
                    <Controller
                        name="offentligIdType"
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
                                label="OffentligId - type"
                                size="small"
                                error={fieldState.error?.message}
                                className="h-max"
                            >
                                <option value="">- Velg OffentligId type -</option>
                                {Object.values(OffentligIDType)
                                    .map((offentligIDType) => ({
                                        offentligIDType,
                                        visningsnavn: visningsnavn[offentligIDType] ?? "Ukjent",
                                    }))
                                    .filter((offentligIDType) => !!offentligIDType.visningsnavn)
                                    .sort((a, b) => sortInAlphabeticOrder(a.visningsnavn, b.visningsnavn))
                                    .map((offentligIDType) => (
                                        <option
                                            key={offentligIDType.offentligIDType}
                                            value={offentligIDType.offentligIDType}
                                        >
                                            {offentligIDType.visningsnavn}
                                        </option>
                                    ))}
                            </Select>
                        )}
                    />
                    <Controller
                        name="områdekode"
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
                                label="Kreditortype"
                                size="small"
                                error={fieldState.error?.message}
                                className="h-max"
                            >
                                <option value="">- Velg kreditortype -</option>
                                {Object.values(SamhandlerDtoOmradekodeEnum)
                                    .map((omradekode) => ({
                                        omradekode,
                                        visningsnavn: visningsnavn[omradekode] ?? "Ukjent",
                                    }))
                                    .filter((omradekode) => !!omradekode.visningsnavn)
                                    .sort((a, b) => sortInAlphabeticOrder(a.visningsnavn, b.visningsnavn))
                                    .map((omradekode) => (
                                        <option key={omradekode.omradekode} value={omradekode.omradekode}>
                                            {omradekode.visningsnavn}
                                        </option>
                                    ))}
                            </Select>
                        )}
                    />
                    <div></div>
                    <Switch
                        size="small"
                        checked={erRM}
                        onChange={(e) => {
                            setRM(e.target.checked);
                            validateKontoopplysninger(e.target.checked);
                        }}
                    >
                        Er RM
                    </Switch>
                </HGrid>
                <div>
                    <Heading size="xsmall" level="3">
                        Kontaktinformasjon
                    </Heading>
                    <Box borderColor="neutral" borderWidth="1" padding="space-8">
                        <HGrid gap={{xs: "space-8", md: "space-12"}} align="start">
                            <HGrid gap={{xs: "space-8", md: "space-12"}} columns={3} align="start">
                                <Controller
                                    name="kontaktperson"
                                    control={formMethods.control}
                                    render={({field}) => (
                                        <TextField {...field} label="Kontaktperson" size="small" className="h-max"/>
                                    )}
                                />
                                <Controller
                                    name="kontaktTelefon"
                                    control={formMethods.control}
                                    render={({field}) => (
                                        <TextField {...field} label="Telefon" size="small" className="h-max"/>
                                    )}
                                />
                                <Controller
                                    name="kontaktEpost"
                                    control={formMethods.control}
                                    render={({field}) => (
                                        <TextField {...field} label="Epost" size="small" className="h-max"/>
                                    )}
                                />
                            </HGrid>
                            <Controller
                                name="notat"
                                control={formMethods.control}
                                render={({field}) => <Textarea {...field} label="Notat" size="small"/>}
                            />
                        </HGrid>
                    </Box>
                </div>
                <div>
                    <Heading size="xsmall" level="3">
                        Adresse
                    </Heading>
                    <Box borderColor="neutral" borderWidth="1" padding="space-8">
                        <HGrid gap={{xs: "space-8", md: "space-12"}} columns={3} align="start">
                            <Controller
                                name="adresse.adresselinje1"
                                control={formMethods.control}
                                rules={{
                                    validate: (value) => {
                                        const adresselinje2 = formMethods.getValues("adresse.adresselinje2");
                                        const adresselinje3 = formMethods.getValues("adresse.adresselinje3");

                                        const otherFieldsFilled = !!adresselinje2 || !!adresselinje3;
                                        if (otherFieldsFilled && !value) {
                                            return "Dette feltet er påkrevd";
                                        }
                                        return true;
                                    },
                                }}
                                render={({field, fieldState}) => (
                                    <TextField
                                        {...field}
                                        label="Adresselinje 1"
                                        size="small"
                                        error={fieldState.error?.message}
                                        className="h-max"
                                        onChange={(e) => {
                                            field.onChange(e);
                                            formMethods.trigger(["adresse.postnummer", "adresse.land"]);
                                        }}
                                    />
                                )}
                            />
                            <Controller
                                name="adresse.adresselinje2"
                                control={formMethods.control}
                                render={({field}) => (
                                    <TextField
                                        {...field}
                                        label="Adresselinje 2"
                                        size="small"
                                        className="h-max"
                                        onChange={(e) => {
                                            field.onChange(e);
                                            formMethods.trigger("adresse.adresselinje1");
                                        }}
                                    />
                                )}
                            />
                            <Controller
                                name="adresse.adresselinje3"
                                control={formMethods.control}
                                render={({field}) => (
                                    <TextField
                                        {...field}
                                        label="Adresselinje 3"
                                        size="small"
                                        className="h-max"
                                        onChange={(e) => {
                                            field.onChange(e);
                                            formMethods.trigger("adresse.adresselinje1");
                                        }}
                                    />
                                )}
                            />
                            <Controller
                                name="adresse.postnummer"
                                control={formMethods.control}
                                rules={{
                                    validate: (value) => {
                                        const adresselinje1 = formMethods.getValues("adresse.adresselinje1");
                                        const land = formMethods.getValues("adresse.land");

                                        const norskAddress = !!adresselinje1 && land === "NOR";
                                        if (norskAddress && !value) {
                                            return "Må ha postnummer for norsk adresse";
                                        }
                                        return true;
                                    },
                                }}
                                render={({field, fieldState}) => (
                                    <TextField
                                        {...field}
                                        label="Postnummer"
                                        size="small"
                                        error={fieldState.error?.message}
                                        className="h-max"
                                    />
                                )}
                            />
                            <Controller
                                name="adresse.poststed"
                                control={formMethods.control}
                                render={({field}) => (
                                    <TextField {...field} label="Poststed" size="small" className="h-max"/>
                                )}
                            />
                            <Controller
                                name="adresse.land"
                                control={formMethods.control}
                                rules={{
                                    validate: (value) => {
                                        const adresselinje1 = formMethods.getValues("adresse.adresselinje1");

                                        if (adresselinje1 && !value) {
                                            return "Dette feltet er påkrevd";
                                        }
                                        return true;
                                    },
                                }}
                                render={({field, fieldState}) => (
                                    <Select
                                        {...field}
                                        label="Landkode"
                                        size="small"
                                        error={fieldState.error?.message}
                                        className="h-max"
                                        onChange={(e) => {
                                            field.onChange(e);
                                            formMethods.trigger("adresse.postnummer");
                                        }}
                                    >
                                        <option value="">- Velg landkode -</option>
                                        {visningsnavnLandkoder.map((landkode) => (
                                            <option key={landkode.landkode} value={landkode.landkode}>
                                                {landkode.visningsnavn}
                                            </option>
                                        ))}
                                    </Select>
                                )}
                            />
                        </HGrid>
                    </Box>
                </div>
                <div>
                    <Heading size="xsmall" level="3">
                        Kontoopplysninger
                    </Heading>
                    {formMethods.formState.errors?.root?.kontoopplysninger && (
                        <ErrorMessage size="small" showIcon className="mb-2">
                            {formMethods.formState.errors.root.kontoopplysninger.message}
                        </ErrorMessage>
                    )}
                    <Box
                        borderColor={`${formMethods.formState.errors?.root?.kontoopplysninger ? "warning" : "info"}`}
                        borderWidth="1"
                        padding="space-8"
                    >
                        <HGrid gap={{xs: "space-8", md: "space-12"}} columns={3} align="start">
                            <Controller
                                name="kontonummer.norskKontonummer"
                                control={formMethods.control}
                                rules={{
                                    maxLength: {
                                        value: 11,
                                        message: "Kan ikke være mer enn 11 tall",
                                    },
                                    minLength: {
                                        value: 11,
                                        message: "Kan ikke være mindre enn 11 tall",
                                    },
                                    validate: (value) => {
                                        if (value?.length !== 11) return;
                                        return erGyldigKontonummer(value) || "Kontonummer er ikke gyldig";
                                    },
                                }}
                                render={({field, fieldState}) => (
                                    <TextField
                                        {...field}
                                        label="Kontonummer"
                                        size="small"
                                        type="number"
                                        inputMode="numeric"
                                        onKeyDown={(e) => {
                                            if ([",", "."].includes(e.key)) {
                                                e.preventDefault();
                                            }
                                        }}
                                        error={fieldState.error?.message}
                                        onChange={(e) => {
                                            field.onChange(e);
                                            validateKontoopplysninger();
                                        }}
                                    />
                                )}
                            />
                            <Controller
                                name="kontonummer.banknavn"
                                control={formMethods.control}
                                render={({field}) => <TextField {...field} label="Banknavn" size="small"/>}
                            />
                            <Controller
                                name="kontonummer.bankCode"
                                control={formMethods.control}
                                render={({field}) => <TextField {...field} label="Bankkode" size="small"/>}
                            />
                            <Controller
                                name="kontonummer.landkodeBank"
                                control={formMethods.control}
                                render={({field, fieldState}) => (
                                    <Select
                                        {...field}
                                        label="Landkode"
                                        size="small"
                                        error={fieldState.error?.message}
                                        className="h-max"
                                    >
                                        <option value="">- Velg landkode -</option>
                                        {visningsnavnLandkoder.map((landkode) => (
                                            <option key={landkode.landkode} value={landkode.landkode}>
                                                {landkode.visningsnavn}
                                            </option>
                                        ))}
                                    </Select>
                                )}
                            />
                            <Controller
                                name="kontonummer.swift"
                                control={formMethods.control}
                                render={({field}) => (
                                    <TextField
                                        {...field}
                                        label="Swift"
                                        size="small"
                                        onChange={(e) => {
                                            field.onChange(e);
                                            validateKontoopplysninger();
                                        }}
                                    />
                                )}
                            />
                            <Controller
                                name="kontonummer.valutakode"
                                control={formMethods.control}
                                rules={{
                                    validate: (value) => {
                                        const accounts = formMethods.getValues([
                                            "kontonummer.norskKontonummer",
                                            "kontonummer.iban",
                                            "kontonummer.swift",
                                        ]);

                                        if ((erRM || accounts.some((s) => s.trim())) && !value) {
                                            return "Dette feltet er påkrevd";
                                        }
                                        return true;
                                    },
                                }}
                                render={({field, fieldState}) => (
                                    <Select
                                        {...field}
                                        label="Valutakode"
                                        size="small"
                                        error={fieldState.error?.message}
                                        className="h-max"
                                    >
                                        <option value="">- Velg valuta -</option>
                                        {Object.values(Valutakode)
                                            .map((valutakode) => ({
                                                valutakode,
                                                visningsnavn: visningsnavn[valutakode] ?? "Ukjent",
                                            }))
                                            .filter((valuta) => !!valuta.visningsnavn)
                                            .sort((a, b) => sortInAlphabeticOrder(a.visningsnavn, b.visningsnavn))
                                            .map((valutakode) => (
                                                <option key={valutakode.valutakode} value={valutakode.valutakode}>
                                                    {valutakode.visningsnavn}
                                                </option>
                                            ))}
                                    </Select>
                                )}
                            />
                            <Controller
                                name="kontonummer.iban"
                                control={formMethods.control}
                                render={({field}) => (
                                    <TextField
                                        {...field}
                                        label="Iban"
                                        size="small"
                                        onChange={(e) => {
                                            field.onChange(e);
                                            validateKontoopplysninger();
                                        }}
                                    />
                                )}
                            />
                        </HGrid>
                    </Box>
                </div>
                {typeOfAction === "edit" && (
                    <InfoCard data-color="info">
                        <InfoCard.Header>
                            <InfoCard.Title>
                                Du må bekrefte endringene</InfoCard.Title>
                        </InfoCard.Header>
                        <InfoCard.Content>
                            <BodyShort size="small">
                                Endringene vil påvirke alle saker hvor samhandler-identen benyttes. Hvis du ikke ønsker
                                at
                                endringene skal gjelde i alle saker hvor samhandler-identen er benyttet, må du opprette
                                ny
                                samhandler.
                            </BodyShort>
                            <Checkbox
                                className="mt-4"
                                value={erBekreftet}
                                checked={erBekreftet}
                                onChange={() => setBekreftet((x) => !x)}
                                size="small"
                            >
                                Jeg bekrefter at jeg vil endre opplysninger på samhandler-identen.
                            </Checkbox>
                        </InfoCard.Content>
                    </InfoCard>
                )}
            </VStack>
        </form>
    );

    return (
        <FormProvider {...formMethods} key={defaultValues.samhandlerId}>
            {inModal ? (
                <>
                    <Modal.Body className="pb-0">{formBody}</Modal.Body>
                    <Modal.Footer>{actionButtons}</Modal.Footer>
                </>
            ) : (
                <>
                    {formBody}
                    <div className="flex gap-2 mt-4">{actionButtons}</div>
                </>
            )}
        </FormProvider>
    );
}
