import type { DistribuerTilAdresse } from "@bidrag/api/BidragDokumentApi";
import { StringUtils } from "@bidrag/common";
import { XMarkIcon as Cancel, PadlockLockedIcon as Locked } from "@navikt/aksel-icons";
import { Button, Loader, Select, TextField } from "@navikt/ds-react";
import React, { type ChangeEvent, useState } from "react";
import { Controller, type FieldErrors, FormProvider, useForm, useFormContext, useWatch } from "react-hook-form";
import { useHentLandkoder, useHentPostnummere } from "../hooks/kodeverkQueries";
import type { IMottakerAdresse } from "../types/Adresse";
import { countryCodeIso2ToIso3, isCountryCodeNorway } from "../utils/AdresseUtils";

export const validerMaks128Tegn = (errorMessage: string) => (value: string) => {
    return value && value.length > 128 ? errorMessage : true;
};

export function getErrorForPrefix<T>(errors: FieldErrors<T>, formPrefix?: string): FieldErrors<T> {
    if (formPrefix) {
        formPrefix.split(".").forEach((splitKey) => {
            if (splitKey.length > 0 && errors) {
                errors = errors[splitKey];
            }
        });
    }
    return errors;
}
interface EditAddressFormProps {
    address?: IMottakerAdresse;
    onSubmit: (adress: IMottakerAdresse) => void;
    onCancel: () => void;
}

type EditAddressProps = {
    formPrefix?: string;
};
export function EditAddress(props: EditAddressProps) {
    const formPrefix = props.formPrefix ? `${props.formPrefix}.` : "";
    const country = useWatch({ name: `${formPrefix}land` });
    const isNorway = isCountryCodeNorway(country);
    return (
        <div className={"md:grow"}>
            <EditAddressLines {...props} />
            <div className="flex pt-1 h-max items-center" style={{ flexDirection: isNorway ? "column" : "row" }}>
                <EditPostcodeAndState {...props} />
                <EditCountry {...props} />
            </div>
        </div>
    );
}

export function EditAddressForm({ address, onSubmit, onCancel }: EditAddressFormProps) {
    const methods = useForm<IMottakerAdresse>({
        defaultValues: {
            ...address,
        },
        reValidateMode: "onSubmit",
        mode: "onSubmit",
    });

    function onFormSubmit(submitAdresse: IMottakerAdresse) {
        onSubmit({
            ...submitAdresse,
            landkode: submitAdresse.land,
            landkode3: countryCodeIso2ToIso3(submitAdresse.land),
        });
    }

    return (
        <FormProvider {...methods}>
            <div>
                <EditAddress />
                <div className={"gap-4 flex flex-row pt-3"}>
                    <Button
                        id={"lagre_adresse_knapp"}
                        variant="tertiary"
                        size="small"
                        onClick={methods.handleSubmit(onFormSubmit)}
                        icon={<Locked fr="true" />}
                    >
                        Lagre
                    </Button>
                    <Button
                        id={"forkast_adresse_endringer_knapp"}
                        variant="tertiary"
                        size="small"
                        onClick={onCancel}
                        icon={<Cancel fr="true" />}
                    >
                        Forkast
                    </Button>
                </div>
            </div>
        </FormProvider>
    );
}

function EditPostcodeAndState(props: EditAddressProps) {
    const {
        control,
        setValue,
        register,
        clearErrors,
        formState: { errors },
    } = useFormContext<DistribuerTilAdresse>();
    const formPrefix = props.formPrefix ? `${props.formPrefix}.` : "";
    const country = useWatch({ name: `${formPrefix}land` });
    const isNorway = isCountryCodeNorway(country);

    const getPostnummerErrorMessage = () => {
        return getErrorForPrefix<DistribuerTilAdresse>(errors, formPrefix)?.poststed?.message;
    };

    const poststedFormKey = `${formPrefix}poststed`;
    const postnummerFormKey = `${formPrefix}postnummer`;
    return (
        <div className={`flex gap-x-4 pb-2 pt-2 w-auto ${isNorway ? "self-start" : "flex-col"}`}>
            {isNorway && (
                <Controller
                    control={control}
                    name={postnummerFormKey as "postnummer"}
                    rules={{
                        required: "Postnummer påkrevd norske adresser",
                        validate: (value: string) => (value.length !== 4 ? "Postnummer må ha 4 tegn" : true),
                    }}
                    render={({ field: { name, onChange, value, ref }, fieldState: { error } }) => (
                        <React.Suspense fallback={<Loader size="xsmall" />}>
                            <PostnummerInput
                                defaultValue={value}
                                inputRef={ref}
                                error={error?.message ?? getPostnummerErrorMessage()}
                                name={name}
                                onChange={(postnummer, poststed) => {
                                    onChange(postnummer);
                                    setValue(poststedFormKey as "poststed", poststed);
                                    clearErrors(poststedFormKey as "poststed");
                                }}
                            />
                        </React.Suspense>
                    )}
                />
            )}
            {isNorway && (
                <TextField
                    {...register(poststedFormKey as "poststed", {
                        validate: (value?: string) => {
                            if (isNorway) {
                                return StringUtils.isEmpty(value) ? "Skriv inn gyldig postnummer" : true;
                            }
                            return true;
                            // return !value || value.trim().length == 0 ? "Poststed må fylles ut" : true;
                        },
                    })}
                    error={!isNorway ? getPostnummerErrorMessage() : undefined}
                    size="small"
                    className="w-full"
                    label={isNorway ? "Poststed (fylles automatisk)" : "Poststed"}
                    disabled={isNorway}
                />
            )}
        </div>
    );
}
function EditCountry(props: EditAddressProps) {
    const { control, setValue, resetField } = useFormContext<DistribuerTilAdresse>();
    const formPrefix = props.formPrefix ? `${props.formPrefix}.` : "";

    const landFormKey = `${formPrefix}land`;

    const poststedFormKey = `${formPrefix}poststed`;
    const postnummerFormKey = `${formPrefix}postnummer`;
    return (
        <Controller
            control={control}
            name={landFormKey as "land"}
            rules={{ required: "Land er påkrevd" }}
            render={({ field: { name, onChange, value, ref }, fieldState: { error } }) => (
                <SelectableCountry
                    inputRef={ref}
                    name={name}
                    defaultValue={value}
                    error={error?.message}
                    onChange={(landkode) => {
                        onChange(landkode);
                        if (!isCountryCodeNorway(landkode)) {
                            setValue(postnummerFormKey as "postnummer", "");
                            setValue(poststedFormKey as "poststed", "");
                        } else {
                            resetField(postnummerFormKey as "postnummer");
                            resetField(poststedFormKey as "poststed");
                        }
                    }}
                />
            )}
        />
    );
}

function EditAddressLines(props: EditAddressProps) {
    const {
        register,
        formState: { errors },
    } = useFormContext<DistribuerTilAdresse>();
    const formPrefix = props.formPrefix ? `${props.formPrefix}.` : "";

    const country = useWatch({ name: `${formPrefix}land` });
    const isNorway = isCountryCodeNorway(country);
    return (
        <div className={"flex flex-col gap-y-4"}>
            <TextField
                size="small"
                error={getErrorForPrefix(errors, formPrefix)?.adresselinje1?.message}
                {...register(`${formPrefix}adresselinje1` as "adresselinje1", {
                    required: isNorway ? false : "Adresselinje1 er påkrevd",
                    validate: validerMaks128Tegn("Adresselinje kan ikke være lengre enn 128 tegn"),
                })}
                label={"Adresse"}
            />
            <TextField
                size="small"
                hideLabel
                error={getErrorForPrefix(errors, formPrefix)?.adresselinje2?.message}
                {...register(`${formPrefix}adresselinje2` as "adresselinje2", {
                    validate: validerMaks128Tegn("Adresselinje kan ikke være lengre enn 128 tegn"),
                })}
                label={"Adresselinje2"}
            />
            <TextField
                size="small"
                hideLabel
                error={getErrorForPrefix(errors, formPrefix)?.adresselinje3?.message}
                {...register(`${formPrefix}adresselinje3` as "adresselinje3", {
                    validate: validerMaks128Tegn("Adresselinje kan ikke være lengre enn 128 tegn"),
                })}
                label={"Adresselinje3"}
            />
        </div>
    );
}
interface SelectablePostnummerProps {
    defaultValue: string;
    onChange: (postnummer: string, poststed: string) => void;
    inputRef?: (instance: any) => void;
    name?: string;
    error?: string;
}

function PostnummerInput({ onChange, defaultValue, inputRef, name, error }: SelectablePostnummerProps) {
    const [value, setValue] = useState<string>(defaultValue);
    const postnummere = useHentPostnummere();

    function getPoststedByPostnummer(postnummer?: string) {
        if (!postnummer) {
            return undefined;
        }
        const postnummerValue = postnummere.find((value) => Object.keys(value)[0] === postnummer);
        return postnummerValue ? postnummerValue[postnummer] : undefined;
    }

    function onInputChange(event: ChangeEvent<HTMLInputElement>) {
        const postnummer = event.target.value;
        if (postnummer.length <= 4) {
            onChange(postnummer, getPoststedByPostnummer(postnummer));
            setValue(postnummer);
        }
    }

    return (
        <TextField
            defaultValue={defaultValue}
            value={value}
            name={name}
            error={error}
            type="number"
            ref={inputRef}
            size="small"
            label={"Postnummer"}
            onChange={onInputChange}
        />
    );
}

interface SelectableCountry {
    defaultValue: string;
    onChange: (landkode: string, land: string) => void;
    inputRef?: (instance: any) => void;
    name?: string;
    error?: string;
}

function SelectableCountry({ onChange, defaultValue, inputRef, name, error }: SelectableCountry) {
    const landkoder = useHentLandkoder();

    function onSelected(event: ChangeEvent<HTMLSelectElement>) {
        const landkode = event.target.value;
        onChange(landkode, landkode ? getLandByLandkode(landkode) : undefined);
    }

    function getLandByLandkode(landkode: string) {
        return landkoder.find((value) => Object.keys(value)[0] === landkode)[landkode];
    }

    return (
        <Select
            error={error}
            ref={inputRef}
            name={name}
            size="small"
            label="Land"
            className="h-max"
            onChange={onSelected}
            defaultValue={defaultValue}
        >
            <option value={undefined}>{""}</option>
            {landkoder
                .sort((a, b) => {
                    const landkodeA = Object.keys(a)[0];
                    const landkodeB = Object.keys(b)[0];
                    const landA = a[landkodeA];
                    const landB = b[landkodeB];
                    return landA.localeCompare(landB);
                })
                .map((value) => {
                    const landkode = Object.keys(value)[0];
                    const land = value[landkode];
                    return (
                        <option key={landkode} value={landkode}>
                            {land}
                        </option>
                    );
                })}
        </Select>
    );
}
