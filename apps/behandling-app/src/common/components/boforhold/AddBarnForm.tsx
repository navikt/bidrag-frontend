import type { OpprettHusstandsstandsmedlem } from "@bidrag/api/BidragBehandlingApiV1";
import type { PersonDto } from "@bidrag/api/PersonApi";
import { isValidDate } from "@bidrag/common";
import { TrashIcon } from "@navikt/aksel-icons";
import { Box, Button, Radio, RadioGroup, Search, TextField, VStack } from "@navikt/ds-react";
import React, { type Dispatch, type SetStateAction, useState } from "react";
import { type UseFieldArrayReturn, useFormContext } from "react-hook-form";
import { toISODateString } from "../../../utils/date-utils";
import { removePlaceholder } from "../../../utils/string-utils";
import { PERSON_API } from "../../constants/api";
import text from "../../constants/texts";
import { useBehandlingProvider } from "../../context/BehandlingContext";
import { useOnSaveBoforhold } from "../../hooks/useOnSaveBoforhold";
import type { BoforholdFormValues } from "../../types/boforholdFormValues";
import { DatePickerInput } from "../date-picker/DatePickerInput";
import { FlexRow } from "../layout/grid/FlexRow";

export const AddBarnForm = ({
    setOpenAddBarnForm,
    barnFieldArray,
}: {
    setOpenAddBarnForm: Dispatch<SetStateAction<boolean>>;
    barnFieldArray: UseFieldArrayReturn<BoforholdFormValues, "husstandsmedlem">;
}) => {
    const { getValues } = useFormContext<BoforholdFormValues>();
    const { setPageErrorsOrUnsavedState, setSaveErrorState } = useBehandlingProvider();
    const saveBoforhold = useOnSaveBoforhold();
    const [val, setVal] = useState("dnummer");
    const [ident, setIdent] = useState("");
    const [foedselsdato, setFoedselsdato] = useState(null);
    const [navn, setNavn] = useState("");
    const [person, setPerson] = useState<PersonDto>(null);
    const [error, setError] = useState(null);

    const validateForm = () => {
        let formErrors = { ...error };

        if (navn === "") {
            formErrors = { ...formErrors, navn: text.error.navnMåFyllesUt };
        } else {
            delete formErrors.navn;
        }

        if (val === "fritekst") {
            if (!isValidDate(foedselsdato)) {
                formErrors = { ...formErrors, foedselsdato: text.error.datoIkkeGyldig };
            } else {
                delete formErrors.foedselsdato;
            }
        }

        if (val === "dnummer") {
            if (ident === "") {
                formErrors = { ...formErrors, ident: text.error.identMåFyllesUt };
            } else {
                delete formErrors.ident;
            }
        }
        return formErrors;
    };

    const onSaveAddedBarn = () => {
        const formErrors = validateForm();

        if (Object.keys(formErrors).length) {
            setError(formErrors);
            return;
        }

        const fd = val === "dnummer" ? person.fødselsdato : toISODateString(foedselsdato);

        const addedBarn: OpprettHusstandsstandsmedlem = {
            personident: val === "dnummer" ? ident : null,
            navn: navn,
            fødselsdato: fd,
        };
        const indexOfFirstOlderChild = getValues("husstandsmedlem").findIndex(
            (barn) =>
                !barn.medIBehandling &&
                new Date(barn.fødselsdato).getTime() < new Date(addedBarn.fødselsdato).getTime(),
        );
        const insertIndex =
            indexOfFirstOlderChild === -1 ? getValues("husstandsmedlem").length : indexOfFirstOlderChild;

        saveBoforhold.mutation.mutate(
            { triggeredBy: "addBarn", oppdatereHusstandsmedlem: { opprettHusstandsmedlem: addedBarn } },
            {
                onSuccess: (response) => {
                    barnFieldArray.insert(insertIndex, { ...response.oppdatertHusstandsbarn });
                    setOpenAddBarnForm(false);
                    updatedPageErrorState();
                },
                onError: () => {
                    setSaveErrorState({
                        error: true,
                        retryFn: () => onSaveAddedBarn(),
                        rollbackFn: () => setOpenAddBarnForm(false),
                    });
                },
            },
        );
    };

    const onSearchClick = (value) => {
        PERSON_API.informasjon
            .hentPersonPost({ ident: value })
            .then((response) => {
                if (response.status === 204) throw new Error(text.error.personFinnesIkke);
                const data = response.data;
                setNavn(data.visningsnavn);
                setPerson(data);
                const formErrors = { ...error };
                delete formErrors.ident;
                delete formErrors.navn;
                setError(formErrors);
            })
            .catch(() => {
                setError({ ...error, ident: removePlaceholder(text.error.personFinnesIkke, value) });
            });
    };

    const onSearchClear = () => {
        setIdent("");
        setNavn("");
        setPerson(null);
        const formErrors = { ...error };
        delete formErrors.ident;
        delete formErrors.navn;
        setError(formErrors);
    };

    const updatedPageErrorState = () => {
        setPageErrorsOrUnsavedState((state) => ({
            ...state,
            boforhold: {
                ...state.boforhold,
                openFields: { ...state.boforhold.openFields, newBarn: false },
            },
        }));
    };

    const onClose = () => {
        setOpenAddBarnForm(false);
        updatedPageErrorState();
    };

    return (
        <Box className="mt-4 mb-4 p-4" borderWidth="1">
            <VStack gap="space-4">
                <FlexRow className="items-center">
                    <div>Barn</div>
                    <div className="ml-auto self-end">
                        <Button
                            type="button"
                            onClick={onClose}
                            icon={<TrashIcon aria-hidden />}
                            variant="tertiary"
                            size="small"
                        />
                    </div>
                </FlexRow>

                <RadioGroup
                    className="mb-4"
                    size="small"
                    legend=""
                    value={val}
                    onChange={(val) => {
                        setVal(val);
                        setIdent("");
                        setFoedselsdato(null);
                        setError(null);
                    }}
                >
                    <Radio value="dnummer">{text.label.fødselsnummerDnummer}</Radio>
                    <Radio value="fritekst">Fritekst</Radio>
                </RadioGroup>
                <FlexRow>
                    {val === "dnummer" && (
                        <Search
                            className="w-fit"
                            label={text.label.fødselsnummerDnummer}
                            variant="secondary"
                            size="small"
                            hideLabel={false}
                            error={error?.ident}
                            onChange={(value) => setIdent(value)}
                            onClear={onSearchClear}
                            onSearchClick={onSearchClick}
                        />
                    )}
                    {val === "fritekst" && (
                        <DatePickerInput
                            label={text.label.fødselsdato}
                            placeholder="DD.MM.ÅÅÅÅ"
                            onChange={(value) => setFoedselsdato(value)}
                            defaultValue={null}
                            fieldValue={foedselsdato}
                            error={error?.foedselsdato}
                            toDate={new Date()}
                        />
                    )}
                    <TextField
                        name="navn"
                        label={text.label.navn}
                        size="small"
                        value={navn}
                        onChange={(e) => setNavn(e.target.value)}
                        error={error?.navn}
                        readOnly={val !== "fritekst"}
                    />
                </FlexRow>
                <FlexRow>
                    <Button variant="tertiary" type="button" size="small" className="w-fit" onClick={onSaveAddedBarn}>
                        Lagre
                    </Button>
                </FlexRow>
            </VStack>
        </Box>
    );
};
