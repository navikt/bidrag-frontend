import type { Stonadstype } from "@bidrag/api/BelopshistorikkApi";
import { parseDateQueryParam, toQueryParam } from "@bidrag/utils";
import { EraserIcon } from "@navikt/aksel-icons";
import { Box, Button, HStack, MonthPicker, UNSAFE_Combobox, useMonthpicker } from "@navikt/ds-react";
import { hentVisningsnavnFraType } from "@shared/kodeverk";
import { useSearchParams } from "react-router";
import type { IdentQueryParamMapper } from "~/common/filter/IdentQueryParamMapper";
import { usePersonOptions } from "~/common/filter/usePersonOptions.ts";
import { sisteDagIMnd } from "~/routes/sak/beløpshistorikk/periode.utils.ts";
import { PARAM_BARN, PARAM_FRA, PARAM_TIL, PARAM_TYPE } from "./konstanter.ts";
import { useBeløphistorikkfilter } from "./useBelopshistorikkFilter";

interface PerioderFilterPanelProps {
    saksnummer: string;
}

export function PerioderFilterPanel({ saksnummer }: PerioderFilterPanelProps) {
    const { unikeKravhavere, unikeTyper } = useBeløphistorikkfilter(saksnummer);
    const [searchParams, setSearchParams] = useSearchParams();
    const {
        mapper: barnMapper,
        options: barnOptions,
        selectedOptions: barnSelectedOptions,
    } = usePersonOptions(unikeKravhavere);

    const valgteTyper = searchParams.getAll(PARAM_TYPE);
    const valgteBarn = barnSelectedOptions(searchParams.getAll(PARAM_BARN));

    const typeOptions = unikeTyper.map((type) => ({
        label: hentVisningsnavnFraType("stønadstype", type as Stonadstype),
        value: type,
    }));

    const toggleParam = (key: string, option: string, isSelected: boolean) => {
        setSearchParams(
            (prev) => {
                const current = prev.getAll(key);
                const updated = isSelected ? [...current, option] : current.filter((v) => v !== option);
                const next = new URLSearchParams(prev);
                next.delete(key);
                for (const v of updated) {
                    next.append(key, v);
                }
                return next;
            },
            { replace: true, preventScrollReset: true },
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
            { replace: true, preventScrollReset: true },
        );
    };

    const handleTilChange = (date: Date | undefined) => {
        setSearchParams(
            (prev) => {
                const next = new URLSearchParams(prev);
                date ? next.set(PARAM_TIL, toQueryParam(sisteDagIMnd(date))) : next.delete(PARAM_TIL);
                return next;
            },
            { replace: true, preventScrollReset: true },
        );
    };

    const clearFilter = () => {
        setSearchParams(
            (prev) => {
                const next = new URLSearchParams(prev);
                next.delete(PARAM_TIL);
                next.delete(PARAM_FRA);
                next.delete(PARAM_BARN);
                next.delete(PARAM_TYPE);
                setFraSelected();
                setTilSelected();
                return next;
            },
            { replace: true, preventScrollReset: true },
        );
    };

    const {
        monthpickerProps: fraMonthPickerProps,
        inputProps: fraMonthInputProps,
        setSelected: setFraSelected,
    } = useMonthpicker({
        defaultSelected: parseDateQueryParam(searchParams.get(PARAM_FRA)),
        onMonthChange: handleFraChange,
    });

    const {
        monthpickerProps: tilMonthPickerProps,
        inputProps: tilMonthInputProps,
        setSelected: setTilSelected,
    } = useMonthpicker({
        defaultSelected: parseDateQueryParam(searchParams.get(PARAM_TIL)),
        onMonthChange: handleTilChange,
    });

    return (
        <Box background={"neutral-soft"} borderRadius="4" padding="space-16">
            <HStack gap="space-8" wrap align={"end"}>
                <UNSAFE_Combobox
                    label="Barn"
                    options={barnOptions}
                    readOnly={barnOptions.length <= 1}
                    isMultiSelect
                    selectedOptions={valgteBarn}
                    onToggleSelected={(option, isSelected) =>
                        toggleIdentParam(PARAM_BARN, barnMapper, option, isSelected)
                    }
                    size="small"
                />

                <UNSAFE_Combobox
                    label="Beløpsgruppe"
                    options={typeOptions}
                    isMultiSelect
                    selectedOptions={valgteTyper}
                    onToggleSelected={(option, isSelected) => toggleParam(PARAM_TYPE, option, isSelected)}
                    size="small"
                />

                <HStack gap={"space-8"}>
                    <MonthPicker {...fraMonthPickerProps}>
                        <MonthPicker.Input {...fraMonthInputProps} label="Fra og med" size={"small"} />
                    </MonthPicker>
                    <MonthPicker {...tilMonthPickerProps}>
                        <MonthPicker.Input {...tilMonthInputProps} label="Til og med" size={"small"} />
                    </MonthPicker>
                </HStack>
                <Button
                    size={"small"}
                    variant={"tertiary"}
                    onClick={clearFilter}
                    icon={<EraserIcon title="Fjern filter" />}
                >
                    Fjern filter
                </Button>
            </HStack>
        </Box>
    );
}
