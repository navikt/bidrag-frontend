import type { DistribuerTilAdresse } from "@bidrag/api/BidragDokumentApi";
import { XMarkIcon as Cancel, PadlockLockedIcon as Locked } from "@navikt/aksel-icons";
import { Button, Select, TextField } from "@navikt/ds-react";
import React, { type ChangeEvent, useState } from "react";
import { Controller, FormProvider, useForm, useFormContext, useWatch } from "react-hook-form";
import { isCountryCodeNorway } from "../../../../common/utils/AdresseUtils";
import { useHentLandkoder, useHentPostnummer } from "../../../../hooks/useKodeverkApi";

interface EditAddressProps {
    address: DistribuerTilAdresse;
    onSubmit: (adress: DistribuerTilAdresse) => void;
    onCancel: () => void;
}

export default function EditAddress({ address, onSubmit, onCancel }: EditAddressProps) {
    const methods = useForm<DistribuerTilAdresse>({
        defaultValues: {
            ...address,
        },
        reValidateMode: "onSubmit",
        mode: "onSubmit",
    });

    return (
        <FormProvider {...methods}>
            <div>
                <div className={"md:grow"}>
                    <EditAddressLines />
                    <EditPostcodeAndState />
                    <EditCountry />
                </div>
                <div className={"gap-4 flex flex-row pt-3"}>
                    <Button
                        id={"lagre_adresse_knapp"}
                        variant="tertiary"
                        size="small"
                        onClick={methods.handleSubmit(onSubmit)}
                        icon={<Locked />}
                    >
                        Lagre
                    </Button>
                    <Button
                        id={"forkast_adresse_endringer_knapp"}
                        variant="tertiary"
                        size="small"
                        onClick={onCancel}
                        icon={<Cancel />}
                    >
                        Forkast
                    </Button>
                </div>
            </div>
        </FormProvider>
    );
}

function EditPostcodeAndState() {
    const {
        control,
        setValue,
        register,
        clearErrors,
        formState: { errors },
    } = useFormContext<DistribuerTilAdresse>();
    const country = useWatch({ name: "land" });
    const isNorway = isCountryCodeNorway(country);

    return (
        <div className={`flex gap-x-4 pb-2 pt-2 w-full ${isNorway ? "" : "flex-col"}`}>
            {isNorway ? (
                <>
                    <Controller
                        control={control}
                        name="postnummer"
                        rules={{
                            required: "Postnummer påkrevd norske adresser",
                            validate: (value: string) => (value.length != 4 ? "Postnummer må ha 4 tegn" : true),
                        }}
                        render={({ field: { name, onChange, value, ref }, fieldState: { error } }) => (
                            <PostnummerInput
                                defaultValue={value}
                                inputRef={ref}
                                error={error?.message ?? errors?.poststed?.message}
                                name={name}
                                onChange={(postnummer, poststed) => {
                                    onChange(postnummer);
                                    setValue("poststed", poststed);
                                    clearErrors("poststed");
                                }}
                            />
                        )}
                    />
                    <TextField
                        {...register("poststed", { required: "Skriv inn gyldig postnummer" })}
                        size="small"
                        label={"Poststed"}
                        disabled={true}
                    />
                </>
            ) : (
                <TextField {...register("poststed")} size="small" label={"Poststed"} />
            )}
        </div>
    );
}
function EditCountry() {
    const { control, setValue, resetField } = useFormContext<DistribuerTilAdresse>();
    return (
        <Controller
            control={control}
            name="land"
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
                            setValue("postnummer", "");
                            setValue("poststed", "");
                        } else {
                            resetField("postnummer");
                            resetField("poststed");
                        }
                    }}
                />
            )}
        />
    );
}

function EditAddressLines() {
    const {
        register,
        formState: { errors },
    } = useFormContext<DistribuerTilAdresse>();

    const country = useWatch({ name: "land" });
    const isNorway = isCountryCodeNorway(country);

    return (
        <div className={"flex flex-col gap-y-4"}>
            <TextField
                size="small"
                error={errors.adresselinje1?.message}
                {...register("adresselinje1", { required: isNorway ? false : "Adresselinje1 er påkrevd" })}
                label={"Adresse"}
            />
            <TextField size="small" hideLabel {...register("adresselinje2")} label={"Adresselinje2"} />
            <TextField size="small" hideLabel {...register("adresselinje3")} label={"Adresselinje3"} />
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
    const postnummere = useHentPostnummer();
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
            onChange={onSelected}
            defaultValue={defaultValue}
        >
            <option value={undefined}>{""}</option>
            {landkoder
                .filter((value) => Object.keys(value)[0] !== "???")
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
