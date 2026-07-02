import { Box, DatePicker, HStack, Switch, UNSAFE_Combobox, useDatepicker } from "@navikt/ds-react";
import { useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";

import { parseDateQueryParam, toQueryParam } from "~/utils/datoUtils";

import { IdentQueryParamMapper } from "./IdentQueryParamMapper";
import { PARAM_BARN, PARAM_FRA, PARAM_KODER, PARAM_MOTTAKERE, PARAM_OPEN_TRANS, PARAM_TIL } from "./konstanter";
import { transaksjonstypeGrupper, visningsnavnForTransaksjonskode } from "./transaksjonstyper";
import { useTransaksjoner } from "./useTransaksjoner";

export default function TransaksjonerFilterPanel() {
    const { saksnummer } = useParams();
    const { unikeMottakere, unikeBarn, unikeTransaksjonskoder } = useTransaksjoner(saksnummer!);
    const [searchParams, setSearchParams] = useSearchParams();

    const valgteKoder = searchParams.getAll(PARAM_KODER);

    const mottakerMapper = new IdentQueryParamMapper(unikeMottakere);
    const barnMapper = new IdentQueryParamMapper(unikeBarn);

    const valgteMottakere = mottakerMapper.toIdents(searchParams.getAll(PARAM_MOTTAKERE));
    const valgteBarn = barnMapper.toIdents(searchParams.getAll(PARAM_BARN));

    const checked = searchParams.get(PARAM_OPEN_TRANS) === "true";

    const kodeOptionsExtended = Object.entries(transaksjonstypeGrupper).map(([kode, type]) => {
        return { label: type.visningsnavn, value: kode };
    });

    const transKodeOptions = useMemo(
        () =>
            unikeTransaksjonskoder.map((kode) => {
                return { label: `${kode} - ${visningsnavnForTransaksjonskode(kode) ?? ""}`, value: kode };
            }),
        [unikeTransaksjonskoder]
    );

    const kodeOptions = kodeOptionsExtended.concat(transKodeOptions);

    const toggleParam = (key: string, option: string, isSelected: boolean) => {
        setSearchParams(
            (prev) => {
                const current = prev.getAll(key);
                const updated = isSelected ? [...current, option] : current.filter((v) => v !== option);
                const next = new URLSearchParams(prev);
                next.delete(key);
                updated.forEach((v) => next.append(key, v));
                return next;
            },
            { replace: true }
        );
    };

    const toggleIdentParam = (paramKey: string, mapper: IdentQueryParamMapper, ident: string, isSelected: boolean) => {
        const shortKey = mapper.toKey(ident);
        if (shortKey != null) toggleParam(paramKey, shortKey, isSelected);
    };

    const handleFraChange = (date: Date | undefined) => {
        setSearchParams(
            (prev) => {
                const next = new URLSearchParams(prev);
                date ? next.set(PARAM_FRA, toQueryParam(date)) : next.delete(PARAM_FRA);
                return next;
            },
            { replace: true }
        );
    };

    const handleTilChange = (date: Date | undefined) => {
        setSearchParams(
            (prev) => {
                const next = new URLSearchParams(prev);
                date ? next.set(PARAM_TIL, toQueryParam(date)) : next.delete(PARAM_TIL);
                return next;
            },
            { replace: true }
        );
    };

    const { datepickerProps: fraDatepickerProps, inputProps: fraInputProps } = useDatepicker({
        defaultSelected: parseDateQueryParam(searchParams.get(PARAM_FRA)),
        onDateChange: handleFraChange,
    });

    const { datepickerProps: tilDatepickerProps, inputProps: tilInputProps } = useDatepicker({
        defaultSelected: parseDateQueryParam(searchParams.get(PARAM_TIL)),
        onDateChange: handleTilChange,
    });

    const handleOpenTrans = (value: boolean | undefined) => {
        setSearchParams(
            (prev) => {
                const next = new URLSearchParams(prev);
                value ? next.set(PARAM_OPEN_TRANS, "true") : next.delete(PARAM_OPEN_TRANS);
                return next;
            },
            { replace: true }
        );
    };

    return (
        <Box background="neutral-soft" borderRadius="4" padding="space-16">
            <HStack gap="space-8" wrap align={"end"}>
                <UNSAFE_Combobox
                    label="Transaksjonstype"
                    options={kodeOptions}
                    isMultiSelect
                    selectedOptions={valgteKoder}
                    onToggleSelected={(option, isSelected) => toggleParam(PARAM_KODER, option, isSelected)}
                    size="small"
                />
                <UNSAFE_Combobox
                    label="Barn"
                    options={barnMapper.allIdents}
                    readOnly={barnMapper.allIdents.length <= 1}
                    isMultiSelect
                    selectedOptions={valgteBarn}
                    onToggleSelected={(option, isSelected) =>
                        toggleIdentParam(PARAM_BARN, barnMapper, option, isSelected)
                    }
                    size="small"
                />
                <UNSAFE_Combobox
                    label="Mottaker"
                    options={mottakerMapper.allIdents}
                    readOnly={mottakerMapper.allIdents.length <= 1}
                    isMultiSelect
                    selectedOptions={valgteMottakere}
                    onToggleSelected={(option, isSelected) =>
                        toggleIdentParam(PARAM_MOTTAKERE, mottakerMapper, option, isSelected)
                    }
                    size="small"
                />

                <HStack gap={"space-8"}>
                    <DatePicker {...fraDatepickerProps}>
                        <DatePicker.Input {...fraInputProps} label="Fra" size="small" />
                    </DatePicker>
                    <DatePicker {...tilDatepickerProps}>
                        <DatePicker.Input {...tilInputProps} label="Til" size="small" />
                    </DatePicker>
                </HStack>
                <Switch size={"small"} checked={checked} onChange={(e) => handleOpenTrans(e.target.checked)}>
                    Vis bare åpne
                </Switch>
            </HStack>
        </Box>
    );
}
