import { InntektBelopstype } from "@bidrag/api/BidragBehandlingApiV1";
import { BodyShort, Box, Heading, HStack, Table } from "@navikt/ds-react";
import React from "react";
import { useFormContext } from "react-hook-form";
import { FormControlledSelectField } from "../../../../common/components/formFields/FormControlledSelectField";
import { FormControlledTextField } from "../../../../common/components/formFields/FormControlledTextField";
import LeggTilPeriodeButton from "../../../../common/components/formFields/FormLeggTilPeriode";
import elementId from "../../../../common/constants/elementIds";
import text from "../../../../common/constants/texts";
import { useBehandlingProvider } from "../../../../common/context/BehandlingContext";
import { formatterBeløp } from "../../../../utils/number-utils";
import { useOnSaveTilleggstønad } from "../../../hooks/useOnSaveTilleggstønad";
import type {
    FaktiskTilsynsutgiftPeriode,
    StønadTilBarnetilsynPeriode,
    TilleggsstonadPeriode,
    UnderholdkostnadsFormPeriode,
    UnderholdskostnadFormValues,
} from "../../../types/underholdskostnadFormValues";
import { DeleteButton, EditOrSaveButton, UnderholdskostnadPeriode } from "./Barnetilsyn";
import { UnderholdskostnadTabel } from "./UnderholdskostnadTabel";

const beløpstypeOptions = [
    { value: InntektBelopstype.DAGSATS, text: text.select.dagsats },
    { value: InntektBelopstype.MANEDSBELOP11MANEDER, text: text.select.månedsbeløp },
];

const Beløpstype = ({
    item,
    fieldName,
}: {
    item: TilleggsstonadPeriode;
    fieldName: `underholdskostnaderMedIBehandling.${number}.tilleggsstønad.${number}`;
}) => {
    const { lesemodus } = useBehandlingProvider();
    const { setValue } = useFormContext<UnderholdskostnadFormValues>();

    if (lesemodus || !item.erRedigerbart) {
        return (
            <BodyShort className="leading-6 flex align-center" size="small">
                {beløpstypeOptions.find((b) => b.value === item.beløpstype)?.text}
            </BodyShort>
        );
    }
    return (
        <>
            <FormControlledSelectField
                name={`${fieldName}.beløpstype`}
                className="w-fit h-max"
                label={text.label.beløpstype}
                hideLabel
                onSelect={() => {
                    setValue(`${fieldName}.total`, 0);
                }}
                options={beløpstypeOptions}
            />
        </>
    );
};

const BeløpDagsatsMåned = ({
    item,
    fieldName,
}: {
    item: TilleggsstonadPeriode;
    fieldName: `underholdskostnaderMedIBehandling.${number}.tilleggsstønad.${number}`;
}) => {
    const { lesemodus } = useBehandlingProvider();
    return (
        <>
            {!lesemodus && item.erRedigerbart ? (
                <FormControlledTextField
                    name={`${fieldName}.beløp`}
                    label="Totalt"
                    type="number"
                    min="1"
                    inputMode="numeric"
                    step="1"
                    hideLabel
                />
            ) : (
                <div className="h-6 flex items-center justify-end">
                    <BodyShort size="small">{formatterBeløp(item.beløp)}</BodyShort>
                </div>
            )}
        </>
    );
};
const TotalMåned = ({ item }: { item: TilleggsstonadPeriode }) => {
    return (
        <div className="h-6 flex items-center justify-end">
            <BodyShort size="small">{formatterBeløp(item.total)}</BodyShort>
        </div>
    );
};

export const TilleggstønadTabel = ({
    underholdFieldName,
}: {
    underholdFieldName: `underholdskostnaderMedIBehandling.${number}`;
}) => {
    const fieldName = `${underholdFieldName}.tilleggsstønad` as const;
    const { getValues, setError, clearErrors } = useFormContext<UnderholdskostnadFormValues>();
    const underhold = getValues(underholdFieldName);
    const saveTilleggstønad = useOnSaveTilleggstønad(underhold.id);

    const createPayload = (index: number) => {
        const { id, datoFom, datoTom, beløp, total, beløpstype } = getValues(`${fieldName}.${index}`);
        const payload = {
            id,
            beløpstype,
            beløp: beløp ? Number(beløp) : undefined,
            total,
            periode: { fom: datoFom, tom: datoTom },
        };
        return payload;
    };

    const validateRow = (index: number) => {
        const { datoFom, beløp, beløpstype } = getValues(`${fieldName}.${index}`);
        if (datoFom === null) {
            setError(`${fieldName}.${index}.datoFom`, {
                type: "notValid",
                message: text.error.datoMåFyllesUt,
            });
        }
        if (!beløp || beløp <= 0) {
            setError(`${fieldName}.${index}.beløp`, {
                type: "notValid",
                message:
                    beløpstype === InntektBelopstype.DAGSATS ? text.error.dagsatsVerdi : text.error.månedsbeløpVerdi,
            });
        } else {
            clearErrors(`${fieldName}.${index}.beløp`);
        }
    };

    return (
        <Box background="neutral-soft" className="grid gap-y-2 px-4 py-2 w-full">
            <HStack gap={"space-2"}>
                <Heading level="2" size="small" id={elementId.seksjon_underholdskostnad_tilleggstønad}>
                    {text.title.tilleggsstønad}
                </Heading>
            </HStack>
            <UnderholdskostnadTabel
                fieldName={fieldName}
                saveFn={saveTilleggstønad}
                createPayload={createPayload}
                customRowValidation={validateRow}
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
                                <Table size="small" className="table-fixed table bg-[white] min-w-[644px] w-full">
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
                                                className="min-w-[100px]"
                                            >
                                                {text.label.beløp}
                                            </Table.HeaderCell>
                                            <Table.HeaderCell textSize="small" scope="col" className="w-[120px]">
                                                {text.label.beløpstype}
                                            </Table.HeaderCell>
                                            <Table.HeaderCell
                                                textSize="small"
                                                scope="col"
                                                align="right"
                                                className="w-[144px]"
                                            >
                                                {text.label.totalt12Måned}
                                            </Table.HeaderCell>
                                            <Table.HeaderCell scope="col" className="w-[56px]"></Table.HeaderCell>
                                            <Table.HeaderCell scope="col" className="w-[56px]"></Table.HeaderCell>
                                        </Table.Row>
                                    </Table.Header>
                                    <Table.Body>
                                        {controlledFields.map((item: TilleggsstonadPeriode, index) => (
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
                                                    <BeløpDagsatsMåned
                                                        fieldName={`${fieldName}.${index}`}
                                                        item={item}
                                                    />
                                                </Table.DataCell>
                                                <Table.DataCell textSize="small">
                                                    <Beløpstype fieldName={`${fieldName}.${index}`} item={item} />
                                                </Table.DataCell>
                                                <Table.DataCell align="right">
                                                    <TotalMåned item={item} />
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
                                        datoFom: "",
                                        datoTom: "",
                                        beløp: 0,
                                        beløpstype: InntektBelopstype.DAGSATS,
                                        total: 0,
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
