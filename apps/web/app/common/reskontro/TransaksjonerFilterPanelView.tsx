import { parseDateQueryParam, toQueryParam } from "@bidrag/utils/datoUtils";
import { EraserIcon } from "@navikt/aksel-icons";
import { Box, Button, DatePicker, HStack, Switch, UNSAFE_Combobox, useDatepicker } from "@navikt/ds-react";
import { useMemo } from "react";
import { useSearchParams } from "react-router";
import { IdentQueryParamMapper } from "~/common/filter/IdentQueryParamMapper.ts";
import {
    PARAM_BARN,
    PARAM_FRA,
    PARAM_KODER,
    PARAM_MOTTAKERE,
    PARAM_OPEN_TRANS,
    PARAM_TIL,
} from "~/common/reskontro/konstanter.ts";
import { transaksjonstypeGrupper, visningsnavnForTransaksjonskode } from "~/common/reskontro/transaksjonstyper.ts";
import { PARAM_TYPE } from "~/routes/sak/beløpshistorikk/konstanter.ts";

interface TransaksjonerFilterPanelViewProps {
    unikeMottakere: (string | null | undefined)[];
    unikeBarn: (string | null | undefined)[];
    unikeTransaksjonskoder: string[];
}

/** Felles filterpanel for transaksjoner — brukes både på sak og bruker. */
export function TransaksjonerFilterPanelView({
    unikeMottakere,
    unikeBarn,
    unikeTransaksjonskoder,
}: TransaksjonerFilterPanelViewProps) {
    const [searchParams, setSearchParams] = useSearchParams();

    const mottakerMapper = new IdentQueryParamMapper(unikeMottakere);
    const barnMapper = new IdentQueryParamMapper(unikeBarn);

    const valgteKoder = searchParams.getAll(PARAM_KODER);
    const valgteMottakere = mottakerMapper.toIdents(searchParams.getAll(PARAM_MOTTAKERE));
    const valgteBarn = barnMapper.toIdents(searchParams.getAll(PARAM_BARN));
    const checked = searchParams.get(PARAM_OPEN_TRANS) === "true";

    const kodeOptionsExtended = Object.entries(transaksjonstypeGrupper).map(([kode, type]) => {
        return { label: type.visningsnavn, value: kode };
    });

    const transKodeOptions = useMemo(
        () =>
            unikeTransaksjonskoder.map((kode) => {
                return {
                    label: `${kode} - ${visningsnavnForTransaksjonskode(kode) ?? ""}`,
                    value: kode,
                };
            }),
        [unikeTransaksjonskoder],
    );

    const kodeOptions = kodeOptionsExtended.concat(transKodeOptions);

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
                date ? next.set(PARAM_TIL, toQueryParam(date)) : next.delete(PARAM_TIL);
                return next;
            },
            { replace: true, preventScrollReset: true },
        );
    };

    const {
        datepickerProps: fraDatepickerProps,
        inputProps: fraInputProps,
        setSelected: setFraSelected,
    } = useDatepicker({
        defaultSelected: parseDateQueryParam(searchParams.get(PARAM_FRA)),
        onDateChange: handleFraChange,
    });

    const {
        datepickerProps: tilDatepickerProps,
        inputProps: tilInputProps,
        setSelected: setTilSelected,
    } = useDatepicker({
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
                next.delete(PARAM_KODER);
                next.delete(PARAM_MOTTAKERE);
                next.delete(PARAM_OPEN_TRANS);
                setFraSelected();
                setTilSelected();
                return next;
            },
            { replace: true, preventScrollReset: true },
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
