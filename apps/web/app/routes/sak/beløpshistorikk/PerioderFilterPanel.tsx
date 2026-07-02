import type { Stonadstype } from "@bidrag/api/BelopshistorikkApi";
import { parseDateQueryParam, toQueryParam } from "@bidrag/utils";
import {
    Box,
    DatePicker,
    HStack,
    UNSAFE_Combobox,
    useDatepicker,
} from "@navikt/ds-react";
import { hentVisningsnavnFraType } from "@shared/kodeverk";
import { useSearchParams } from "react-router";
import { IdentQueryParamMapper } from "~/common/filter/IdentQueryParamMapper";
import {
    PARAM_BARN,
    PARAM_FRA,
    PARAM_TIL,
    PARAM_TYPE,
} from "./konstanter.ts";
import { useBeløphistorikkfilter } from "./useBelopshistorikkFilter";

interface PerioderFilterPanelProps {
    saksnummer: string;
}

export default function PerioderFilterPanel({
    saksnummer,
}: PerioderFilterPanelProps) {
    const { unikeKravhavere, unikeTyper } = useBeløphistorikkfilter(
        saksnummer!,
    );
    const [searchParams, setSearchParams] = useSearchParams();

    const valgteTyper = searchParams.getAll(PARAM_TYPE);

    const barnMapper = new IdentQueryParamMapper(unikeKravhavere);

    const valgteBarn = barnMapper.toIdents(searchParams.getAll(PARAM_BARN));

    const typeOptions = unikeTyper.map((type) => ({
        label: hentVisningsnavnFraType("stønadstype", type as Stonadstype),
        value: type,
    }));

    const toggleParam = (key: string, option: string, isSelected: boolean) => {
        setSearchParams(
            (prev) => {
                const current = prev.getAll(key);
                const updated = isSelected
                    ? [...current, option]
                    : current.filter((v) => v !== option);
                const next = new URLSearchParams(prev);
                next.delete(key);
                updated.forEach((v) => next.append(key, v));
                return next;
            },
            { replace: true },
        );
    };

    const toggleIdentParam = (
        paramKey: string,
        mapper: IdentQueryParamMapper,
        ident: string,
        isSelected: boolean,
    ) => {
        const shortKey = mapper.toKey(ident);
        if (shortKey != null) toggleParam(paramKey, shortKey, isSelected);
    };

    const handleFraChange = (date: Date | undefined) => {
        setSearchParams(
            (prev) => {
                const next = new URLSearchParams(prev);
                date
                    ? next.set(PARAM_FRA, toQueryParam(date))
                    : next.delete(PARAM_FRA);
                return next;
            },
            { replace: true },
        );
    };

    const handleTilChange = (date: Date | undefined) => {
        setSearchParams(
            (prev) => {
                const next = new URLSearchParams(prev);
                date
                    ? next.set(PARAM_TIL, toQueryParam(date))
                    : next.delete(PARAM_TIL);
                return next;
            },
            { replace: true },
        );
    };

    const { datepickerProps: fraDatepickerProps, inputProps: fraInputProps } =
        useDatepicker({
            defaultSelected: parseDateQueryParam(searchParams.get(PARAM_FRA)),
            onDateChange: handleFraChange,
        });

    const { datepickerProps: tilDatepickerProps, inputProps: tilInputProps } =
        useDatepicker({
            defaultSelected: parseDateQueryParam(searchParams.get(PARAM_TIL)),
            onDateChange: handleTilChange,
        });

    return (
        <Box background="neutral-soft" borderRadius="4" padding="space-16">
            <HStack gap="space-8" wrap align={"end"}>
                <UNSAFE_Combobox
                    label="Barn"
                    options={barnMapper.allIdents}
                    readOnly={barnMapper.allIdents.length <= 1}
                    isMultiSelect
                    selectedOptions={valgteBarn}
                    onToggleSelected={(option, isSelected) =>
                        toggleIdentParam(
                            PARAM_BARN,
                            barnMapper,
                            option,
                            isSelected,
                        )
                    }
                    size="small"
                />

                <UNSAFE_Combobox
                    label="Beløpsgruppe"
                    options={typeOptions}
                    isMultiSelect
                    selectedOptions={valgteTyper}
                    onToggleSelected={(option, isSelected) =>
                        toggleParam(PARAM_TYPE, option, isSelected)
                    }
                    size="small"
                />

                <HStack gap={"space-8"}>
                    <DatePicker {...fraDatepickerProps}>
                        <DatePicker.Input
                            {...fraInputProps}
                            label="Fra"
                            size="small"
                        />
                    </DatePicker>
                    <DatePicker {...tilDatepickerProps}>
                        <DatePicker.Input
                            {...tilInputProps}
                            label="Til"
                            size="small"
                        />
                    </DatePicker>
                </HStack>
            </HStack>
        </Box>
    );
}
