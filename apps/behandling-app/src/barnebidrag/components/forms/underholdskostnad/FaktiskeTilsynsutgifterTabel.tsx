import { BodyLong, BodyShort, Box, Heading, HStack, Table } from "@navikt/ds-react";
import React from "react";
import { useFormContext } from "react-hook-form";
import { FormControlledTextarea } from "../../../../common/components/formFields/FormControlledTextArea";
import { FormControlledTextField } from "../../../../common/components/formFields/FormControlledTextField";
import LeggTilPeriodeButton from "../../../../common/components/formFields/FormLeggTilPeriode";
import elementId from "../../../../common/constants/elementIds";
import text from "../../../../common/constants/texts";
import { formatterBeløp, formatterBeløpForBeregning } from "../../../../utils/number-utils";

import { useOnSaveFaktiskeTilsynsutgifter } from "../../../hooks/useOnSaveFaktiskeTilsynsutgifter";
import type {
    FaktiskTilsynsutgiftPeriode,
    StønadTilBarnetilsynPeriode,
    TilleggsstonadPeriode,
    UnderholdkostnadsFormPeriode,
    UnderholdskostnadFormValues,
} from "../../../types/underholdskostnadFormValues";
import { DeleteButton, EditOrSaveButton, UnderholdskostnadPeriode } from "./Barnetilsyn";
import { UnderholdskostnadTabel } from "./UnderholdskostnadTabel";

const TotalTilysnsutgift = ({
    item,
    fieldName,
}: {
    item: FaktiskTilsynsutgiftPeriode;
    fieldName:
        | `underholdskostnaderMedIBehandling.${number}.faktiskTilsynsutgift.${number}`
        | `underholdskostnaderAndreBarn.${number}.faktiskTilsynsutgift.${number}`;
}) => {
    return (
        <>
            {item.erRedigerbart ? (
                <FormControlledTextField
                    name={`${fieldName}.utgift`}
                    label="Totalt"
                    type="number"
                    min="1"
                    inputMode="numeric"
                    step="1"
                    hideLabel
                />
            ) : (
                <div className="h-6 flex items-center justify-end">
                    <BodyShort size="small">{formatterBeløp(item.utgift)}</BodyShort>
                </div>
            )}
        </>
    );
};

const Kostpenger = ({
    item,
    fieldName,
}: {
    item: FaktiskTilsynsutgiftPeriode;
    fieldName:
        | `underholdskostnaderMedIBehandling.${number}.faktiskTilsynsutgift.${number}`
        | `underholdskostnaderAndreBarn.${number}.faktiskTilsynsutgift.${number}`;
}) => {
    return (
        <>
            {item.erRedigerbart ? (
                <FormControlledTextField
                    name={`${fieldName}.kostpenger`}
                    label="Totalt"
                    type="number"
                    min="1"
                    inputMode="numeric"
                    step="1"
                    hideLabel
                />
            ) : (
                <div className="h-6 flex items-center justify-end">
                    <BodyShort size="small">{formatterBeløp(item.kostpenger)}</BodyShort>
                </div>
            )}
        </>
    );
};

const Totalt12Måned = ({ item }: { item: FaktiskTilsynsutgiftPeriode }) => {
    return (
        <div className="h-6 flex items-center justify-end">
            <BodyShort size="small">{formatterBeløpForBeregning(item.total)}</BodyShort>
        </div>
    );
};

const Kommentar = ({
    item,
    fieldName,
}: {
    item: FaktiskTilsynsutgiftPeriode;
    fieldName:
        | `underholdskostnaderMedIBehandling.${number}.faktiskTilsynsutgift.${number}`
        | `underholdskostnaderAndreBarn.${number}.faktiskTilsynsutgift.${number}`;
}) => {
    return item.erRedigerbart ? (
        <FormControlledTextarea name={`${fieldName}.kommentar`} label={text.label.kommentar} minRows={1} hideLabel />
    ) : (
        <div className="min-h-6 flex items-center">
            <BodyLong size="small">{item.kommentar}</BodyLong>
        </div>
    );
};

export const FaktiskeTilsynsutgifterTabel = ({
    underholdFieldName,
}: {
    underholdFieldName: `underholdskostnaderMedIBehandling.${number}` | `underholdskostnaderAndreBarn.${number}`;
}) => {
    const fieldName = `${underholdFieldName}.faktiskTilsynsutgift` as const;
    const { getValues } = useFormContext<UnderholdskostnadFormValues>();

    const underhold = getValues(underholdFieldName);
    const saveFaktiskeTilsynsutgifter = useOnSaveFaktiskeTilsynsutgifter(underhold.id);

    const createPayload = (index: number) => {
        const { id, datoFom, datoTom, utgift, kostpenger, kommentar, total } = getValues(`${fieldName}.${index}`);
        const payload = {
            id,
            utgift: Number(utgift),
            kostpenger: Number(kostpenger),
            kommentar,
            total,
            periode: { fom: datoFom, tom: datoTom },
        };

        return payload;
    };

    return (
        <Box background="neutral-soft" className="grid gap-y-2 px-4 py-2 w-full">
            <HStack gap={"space-2"}>
                <Heading level="2" size="small" id={elementId.seksjon_underholdskostnad_tilysnsutgifter}>
                    {text.title.faktiskeTilsynsutgifter}
                </Heading>
            </HStack>
            <UnderholdskostnadTabel
                fieldName={fieldName}
                saveFn={saveFaktiskeTilsynsutgifter}
                createPayload={createPayload}
            >
                {({
                    controlledFields,
                    onRemovePeriode,
                    onSaveRow,
                    onEditRow,
                    addPeriod,
                }: {
                    controlledFields: UnderholdkostnadsFormPeriode[];
                    onRemovePeriode: (index: number) => void;
                    onSaveRow: (index: number) => void;
                    onEditRow: (index: number) => void;
                    addPeriod: (
                        periode: StønadTilBarnetilsynPeriode | FaktiskTilsynsutgiftPeriode | TilleggsstonadPeriode,
                    ) => void;
                }) => (
                    <>
                        {controlledFields.length > 0 && (
                            <div className="overflow-x-auto whitespace-nowrap">
                                <Table size="small" className="table-fixed table bg-[white] w-fit">
                                    <Table.Header>
                                        <Table.Row className="align-baseline">
                                            <Table.HeaderCell textSize="small" scope="col" className="w-[144px]">
                                                {text.label.fraOgMed}
                                            </Table.HeaderCell>
                                            <Table.HeaderCell textSize="small" scope="col" className="w-[144px]">
                                                {text.label.tilOgMed}
                                            </Table.HeaderCell>
                                            <Table.HeaderCell
                                                align="right"
                                                textSize="small"
                                                scope="col"
                                                className="w-[140px]"
                                            >
                                                {text.label.totalTilsysnsutgift}
                                            </Table.HeaderCell>
                                            <Table.HeaderCell
                                                textSize="small"
                                                scope="col"
                                                align="right"
                                                className="w-[100px]"
                                            >
                                                {text.label.fratrekk}
                                            </Table.HeaderCell>
                                            <Table.HeaderCell
                                                textSize="small"
                                                scope="col"
                                                align="right"
                                                className="w-[125px]"
                                            >
                                                {text.label.totalt12Måned}
                                            </Table.HeaderCell>
                                            <Table.HeaderCell
                                                textSize="small"
                                                scope="col"
                                                align="left"
                                                className="w-[163px]"
                                            >
                                                {text.label.kommentar}
                                            </Table.HeaderCell>
                                            <Table.HeaderCell scope="col" className="w-[56px]"></Table.HeaderCell>
                                            <Table.HeaderCell scope="col" className="w-[56px]"></Table.HeaderCell>
                                        </Table.Row>
                                    </Table.Header>
                                    <Table.Body>
                                        {controlledFields.map((item: FaktiskTilsynsutgiftPeriode, index) => (
                                            <Table.Row key={`${item?.id}-${index}`} className="align-top">
                                                <Table.DataCell textSize="small">
                                                    <UnderholdskostnadPeriode
                                                        label={text.label.fraOgMed}
                                                        fieldName={`${fieldName}.${index}`}
                                                        field="datoFom"
                                                        item={item}
                                                        underhold={underhold}
                                                    />
                                                </Table.DataCell>
                                                <Table.DataCell textSize="small">
                                                    <UnderholdskostnadPeriode
                                                        label={text.label.tilOgMed}
                                                        fieldName={`${fieldName}.${index}`}
                                                        field="datoTom"
                                                        item={item}
                                                        underhold={underhold}
                                                    />
                                                </Table.DataCell>
                                                <Table.DataCell align="right">
                                                    <TotalTilysnsutgift
                                                        fieldName={`${fieldName}.${index}`}
                                                        item={item}
                                                    />
                                                </Table.DataCell>
                                                <Table.DataCell align="right">
                                                    <Kostpenger fieldName={`${fieldName}.${index}`} item={item} />
                                                </Table.DataCell>
                                                <Table.DataCell align="right">
                                                    <Totalt12Måned item={item} />
                                                </Table.DataCell>
                                                <Table.DataCell align="left">
                                                    <Kommentar fieldName={`${fieldName}.${index}`} item={item} />
                                                </Table.DataCell>
                                                <Table.DataCell>
                                                    <EditOrSaveButton
                                                        index={index}
                                                        item={item}
                                                        onEditRow={() => onEditRow(index)}
                                                        onSaveRow={() => onSaveRow(index)}
                                                    />
                                                </Table.DataCell>
                                                <Table.DataCell>
                                                    <DeleteButton onDelete={() => onRemovePeriode(index)} />
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
                                        utgift: 0,
                                        kostpenger: 0,
                                        kommentar: "",
                                        total: 0,
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
