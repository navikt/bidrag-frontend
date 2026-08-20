import { Stonadstype } from "@bidrag/api/BidragBehandlingApiV1";
import type { PersonDto } from "@bidrag/api/PersonApi";
import { isValidDate } from "@bidrag/common";
import { Box, Button, Radio, RadioGroup, Search, Select, Stack, TextField, VStack } from "@navikt/ds-react";
import React, { type Dispatch, type SetStateAction, useState } from "react";
import { toISODateString } from "../../utils/date-utils";
import { removePlaceholder } from "../../utils/string-utils";
import { PERSON_API } from "../constants/api";
import text from "../constants/texts";
import { StønadstypeTilVisningsnavn } from "../hooks/useVisningsnavn";
import { DatePickerInput } from "./date-picker/DatePickerInput";
import { FlexRow } from "./layout/grid/FlexRow";

export interface AddBarnFormValues {
    personident?: string;
    /** @format date */
    fødselsdato: string;
    navn?: string;
    stønadstype?: Stonadstype;
    bidragsmottaker?: string;
}
export const AddBarnForm = ({
    setOpenAddBarnForm,
    onSave,
    bidragsmottaker,
    showFritekst = true,
    showStønadstype = false,
}: {
    bidragsmottaker?: string;
    showFritekst?: boolean;
    showStønadstype?: boolean;
    setOpenAddBarnForm: Dispatch<SetStateAction<boolean>>;
    onSave: (barn: AddBarnFormValues) => void;
}) => {
    const [val, setVal] = useState("dnummer");
    const [ident, setIdent] = useState("");
    const [foedselsdato, setFoedselsdato] = useState(null);
    const [navn, setNavn] = useState("");
    const [person, setPerson] = useState<PersonDto>(null);
    const [error, setError] = useState(null);
    const [stønadstype, setStønadstype] = useState(Stonadstype.BIDRAG);

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

        const addedBarn: AddBarnFormValues = {
            personident: val === "dnummer" ? ident : null,
            navn: ident ? null : navn,
            fødselsdato: ident ? null : fd,
            stønadstype: showStønadstype ? stønadstype : null,
            bidragsmottaker: bidragsmottaker,
        };

        onSave(addedBarn);
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
    const onClose = () => {
        setOpenAddBarnForm(false);
    };

    return (
        <Box className="mt-4 mb-4 p-4">
            <VStack gap="space-4">
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
                    <Stack gap="space-6" direction={{ xs: "column", sm: "row" }} wrap={false}>
                        <Radio value="dnummer">{text.label.fødselsnummerDnummer}</Radio>
                        {showFritekst && <Radio value="fritekst">Fritekst</Radio>}
                    </Stack>
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
                    {showStønadstype && (
                        <Select
                            onChange={(e) => setStønadstype(e.target.value as Stonadstype)}
                            className="w-fit"
                            label={"Gjelder"}
                            size="small"
                            defaultValue="BIDRAG"
                        >
                            <option value="BIDRAG">{StønadstypeTilVisningsnavn[Stonadstype.BIDRAG]}</option>
                            <option value="BIDRAG18AAR">{StønadstypeTilVisningsnavn[Stonadstype.BIDRAG18AAR]}</option>
                        </Select>
                    )}
                </FlexRow>
                <FlexRow>
                    <Button variant="tertiary" type="button" size="small" className="w-fit" onClick={onSaveAddedBarn}>
                        Lagre
                    </Button>
                    <Button variant="tertiary" type="button" size="small" className="w-fit" onClick={onClose}>
                        Forkast
                    </Button>
                </FlexRow>
            </VStack>
        </Box>
    );
};
