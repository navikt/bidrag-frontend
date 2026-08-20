import {
    Kilde,
    type StonadTilBarnetilsynDto,
    StonadTilBarnetilsynDtoSkolealderEnum,
    StonadTilBarnetilsynDtoTilsynstypeEnum,
} from "@bidrag/api/BidragBehandlingApiV1";
import { ObjectUtils } from "@bidrag/common";
import { BodyShort, Box, Heading, HStack, Table } from "@navikt/ds-react";
import React from "react";
import { useFormContext } from "react-hook-form";
import { FormControlledSelectField } from "../../../../common/components/formFields/FormControlledSelectField";
import LeggTilPeriodeButton from "../../../../common/components/formFields/FormLeggTilPeriode";
import { KildeIcon } from "../../../../common/components/inntekt/InntektTable";
import elementId from "../../../../common/constants/elementIds";
import text from "../../../../common/constants/texts";
import { useBehandlingProvider } from "../../../../common/context/BehandlingContext";

import {
    STONAD_TIL_BARNETILSYNS_SKOLEALDER,
    STONAD_TIL_BARNETILSYNS_TYPE,
} from "../../../constants/stønadTilBarnetilsyn";
import { useOnSaveStønadTilBarnetilsyn } from "../../../hooks/useOnSaveStønadTilBarnetilsyn";
import type {
    FaktiskTilsynsutgiftPeriode,
    StønadTilBarnetilsynPeriode,
    TilleggsstonadPeriode,
    UnderholdkostnadsFormPeriode,
    UnderholdskostnadFormValues,
} from "../../../types/underholdskostnadFormValues";
import { DeleteButton, EditOrSaveButton, UnderholdskostnadPeriode } from "./Barnetilsyn";
import { BarnetilsynOpplysninger } from "./BarnetilsynOpplysninger";
import { UnderholdskostnadTabel } from "./UnderholdskostnadTabel";

const Omfang = ({
    fieldName,
    item,
}: {
    editableRow: boolean;
    fieldName: `underholdskostnaderMedIBehandling.${number}.stønadTilBarnetilsyn.${number}`;
    item: StønadTilBarnetilsynPeriode;
}) => {
    const { clearErrors } = useFormContext<UnderholdskostnadFormValues>();
    const { lesemodus } = useBehandlingProvider();

    return !lesemodus && item.erRedigerbart ? (
        <FormControlledSelectField
            name={`${fieldName}.tilsynstype`}
            className="w-fit"
            label={text.label.status}
            options={[{ value: "", text: text.select.velg }].concat(
                Object.values(StonadTilBarnetilsynDtoTilsynstypeEnum)
                    .filter((d) => d !== StonadTilBarnetilsynDtoTilsynstypeEnum.IKKE_ANGITT)
                    .map((value) => ({
                        value,
                        text: STONAD_TIL_BARNETILSYNS_TYPE[value],
                    })),
            )}
            hideLabel
            onSelect={() => clearErrors(`${fieldName}.tilsynstype`)}
        />
    ) : (
        <div className="h-6 flex items-center">
            <BodyShort size="small">{STONAD_TIL_BARNETILSYNS_TYPE[item.tilsynstype]}</BodyShort>
        </div>
    );
};

const StønadTilBarnetilsyn = ({
    fieldName,
    item,
}: {
    editableRow: boolean;
    fieldName: `underholdskostnaderMedIBehandling.${number}.stønadTilBarnetilsyn.${number}`;
    item: StønadTilBarnetilsynPeriode;
}) => {
    const { clearErrors } = useFormContext<UnderholdskostnadFormValues>();
    const { lesemodus } = useBehandlingProvider();

    return !lesemodus && item.erRedigerbart ? (
        <FormControlledSelectField
            name={`${fieldName}.skolealder`}
            className="w-fit"
            label={text.label.status}
            options={[{ value: "", text: text.select.velg }].concat(
                Object.values(StonadTilBarnetilsynDtoSkolealderEnum)
                    .filter((d) => d !== StonadTilBarnetilsynDtoSkolealderEnum.IKKE_ANGITT)
                    .map((value) => ({
                        value,
                        text: STONAD_TIL_BARNETILSYNS_SKOLEALDER[value],
                    })),
            )}
            hideLabel
            onSelect={() => clearErrors(`${fieldName}.skolealder`)}
        />
    ) : (
        <div className="h-6 flex items-center">
            <BodyShort size="small">{STONAD_TIL_BARNETILSYNS_SKOLEALDER[item.skolealder]}</BodyShort>
        </div>
    );
};

export const BarnetilsynTabel = ({
    underholdFieldName,
}: {
    underholdFieldName: `underholdskostnaderMedIBehandling.${number}`;
}) => {
    const fieldName = `${underholdFieldName}.stønadTilBarnetilsyn` as const;
    const { clearErrors, getValues, setError } = useFormContext<UnderholdskostnadFormValues>();
    const underhold = getValues(underholdFieldName);
    const saveStønadTilBarnetilsyn = useOnSaveStønadTilBarnetilsyn(underhold.id);

    const validateRow = (index: number) => {
        const { datoFom, skolealder, tilsynstype } = getValues(`${fieldName}.${index}`);
        if (datoFom === null) {
            setError(`${fieldName}.${index}.datoFom`, {
                type: "notValid",
                message: text.error.datoMåFyllesUt,
            });
        }
        if (ObjectUtils.isEmpty(skolealder)) {
            setError(`${fieldName}.${index}.skolealder`, {
                type: "notValid",
                message: text.error.feltErPåkrevd,
            });
        } else {
            clearErrors(`${fieldName}.${index}.skolealder`);
        }
        if (ObjectUtils.isEmpty(tilsynstype)) {
            setError(`${fieldName}.${index}.tilsynstype`, {
                type: "notValid",
                message: text.error.feltErPåkrevd,
            });
        } else {
            clearErrors(`${fieldName}.${index}.tilsynstype`);
        }
    };

    const createPayload = (index: number) => {
        const stønadTilBarnetilsynPeriode = getValues(`${fieldName}.${index}`);

        const payload = {
            id: stønadTilBarnetilsynPeriode.id,
            skolealder: stønadTilBarnetilsynPeriode.skolealder,
            tilsynstype: stønadTilBarnetilsynPeriode.tilsynstype,
            kilde: stønadTilBarnetilsynPeriode.kilde,
            periode: { fom: stønadTilBarnetilsynPeriode.datoFom, tom: stønadTilBarnetilsynPeriode.datoTom },
        } as StonadTilBarnetilsynDto;

        return payload;
    };

    return (
        <Box background="neutral-soft" className="grid gap-y-2 px-4 py-2 w-full">
            <HStack gap={"space-2"}>
                <Heading level="2" size="small" id={elementId.seksjon_underholdskostnad_barnetilsyn}>
                    {text.title.stønadTilBarnetilsyn}
                </Heading>
            </HStack>
            <BarnetilsynOpplysninger ident={underhold.gjelderBarn.ident} rolleId={underhold.gjelderBarn.id} />
            <UnderholdskostnadTabel
                fieldName={fieldName}
                saveFn={saveStønadTilBarnetilsyn}
                createPayload={createPayload}
                customRowValidation={validateRow}
            >
                {({
                    controlledFields,
                    onSaveRow,
                    onEditRow,
                    addPeriod,
                    onRemovePeriode,
                }: {
                    controlledFields: UnderholdkostnadsFormPeriode[];
                    onEditRow: (index: number) => void;
                    onRemovePeriode: (index: number) => void;
                    onSaveRow: (index: number) => void;
                    addPeriod: (
                        periode: StønadTilBarnetilsynPeriode | FaktiskTilsynsutgiftPeriode | TilleggsstonadPeriode,
                    ) => void;
                }) => (
                    <>
                        {controlledFields.length > 0 && (
                            <div className="overflow-x-auto whitespace-nowrap">
                                <Table size="small" className="table-fixed table bg-[white] min-w-[744px] w-full">
                                    <Table.Header>
                                        <Table.Row className="align-baseline">
                                            <Table.HeaderCell textSize="small" scope="col" className="w-[144px]">
                                                {text.label.fraOgMed}
                                            </Table.HeaderCell>
                                            <Table.HeaderCell textSize="small" scope="col" className="w-[144px]">
                                                {text.label.tilOgMed}
                                            </Table.HeaderCell>
                                            <Table.HeaderCell
                                                textSize="small"
                                                scope="col"
                                                align="left"
                                                className="min-w-[160px]"
                                            >
                                                {text.label.iSkolealder}
                                            </Table.HeaderCell>
                                            <Table.HeaderCell
                                                textSize="small"
                                                scope="col"
                                                align="left"
                                                className="w-[110px]"
                                            >
                                                {text.label.omfang}
                                            </Table.HeaderCell>
                                            <Table.HeaderCell
                                                textSize="small"
                                                scope="col"
                                                align="center"
                                                className="w-[74px]"
                                            >
                                                {text.label.kilde}
                                            </Table.HeaderCell>
                                            <Table.HeaderCell scope="col" className="w-[56px]"></Table.HeaderCell>
                                            <Table.HeaderCell scope="col" className="w-[56px]"></Table.HeaderCell>
                                        </Table.Row>
                                    </Table.Header>
                                    <Table.Body>
                                        {controlledFields.map((item: StønadTilBarnetilsynPeriode, stønadIndex) => (
                                            <Table.Row key={`${item?.id}-${stønadIndex}`} className="align-top">
                                                <Table.DataCell textSize="small">
                                                    <UnderholdskostnadPeriode
                                                        label={text.label.fraOgMed}
                                                        fieldName={`${fieldName}.${stønadIndex}`}
                                                        field="datoFom"
                                                        item={item}
                                                        underhold={underhold}
                                                    />
                                                </Table.DataCell>
                                                <Table.DataCell textSize="small">
                                                    <UnderholdskostnadPeriode
                                                        label={text.label.tilOgMed}
                                                        fieldName={`${fieldName}.${stønadIndex}`}
                                                        field="datoTom"
                                                        item={item}
                                                        underhold={underhold}
                                                    />
                                                </Table.DataCell>
                                                <Table.DataCell align="left">
                                                    <StønadTilBarnetilsyn
                                                        fieldName={`${fieldName}.${stønadIndex}`}
                                                        item={item}
                                                        editableRow={item.erRedigerbart}
                                                    />
                                                </Table.DataCell>
                                                <Table.DataCell align="left">
                                                    <Omfang
                                                        fieldName={`${fieldName}.${stønadIndex}`}
                                                        item={item}
                                                        editableRow={item.erRedigerbart}
                                                    />
                                                </Table.DataCell>
                                                <Table.DataCell>
                                                    <KildeIcon kilde={item.kilde} />
                                                </Table.DataCell>
                                                <Table.DataCell>
                                                    <EditOrSaveButton
                                                        index={stønadIndex}
                                                        item={item}
                                                        onEditRow={() => onEditRow(stønadIndex)}
                                                        onSaveRow={() => onSaveRow(stønadIndex)}
                                                    />
                                                </Table.DataCell>
                                                <Table.DataCell>
                                                    <DeleteButton onDelete={() => onRemovePeriode(stønadIndex)} />
                                                </Table.DataCell>
                                            </Table.Row>
                                        ))}
                                    </Table.Body>
                                </Table>
                            </div>
                        )}
                        {
                            <LeggTilPeriodeButton
                                addPeriode={() =>
                                    addPeriod({
                                        skolealder: "",
                                        tilsynstype: "",
                                        kilde: Kilde.MANUELL,
                                        datoFom: "",
                                        datoTom: "",
                                        erRedigerbart: true,
                                        kanRedigeres: true,
                                    })
                                }
                            />
                        }
                    </>
                )}
            </UnderholdskostnadTabel>
        </Box>
    );
};
