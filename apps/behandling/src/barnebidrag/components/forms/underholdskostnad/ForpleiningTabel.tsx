import { BodyShort, Box, Heading, HStack, Table } from "@navikt/ds-react";
import { useFormContext } from "react-hook-form";
import { FormControlledTextField } from "../../../../common/components/formFields/FormControlledTextField";
import LeggTilPeriodeButton from "../../../../common/components/formFields/FormLeggTilPeriode";
import elementId from "../../../../common/constants/elementIds";
import text from "../../../../common/constants/texts";
import { useBehandlingProvider } from "../../../../common/context/BehandlingContext";
import { formatterBeløp } from "../../../../utils/number-utils";
import { useOnSaveForpleining } from "../../../hooks/useOnSaveForpleining";
import type {
    ForpleiningPeriode,
    UnderholdkostnadsFormPeriode,
    UnderholdskostnadFormValues,
} from "../../../types/underholdskostnadFormValues";
import { DeleteButton, EditOrSaveButton, UnderholdskostnadPeriode } from "./Barnetilsyn";
import { UnderholdskostnadTabel } from "./UnderholdskostnadTabel";

const Beløp = ({
    item,
    fieldName,
}: {
    item: ForpleiningPeriode;
    fieldName: `underholdskostnaderMedIBehandling.${number}.forpleining.${number}`;
}) => {
    const { lesemodus } = useBehandlingProvider();
    return (
        <>
            {!lesemodus && item.erRedigerbart ? (
                <FormControlledTextField
                    name={`${fieldName}.beløp`}
                    label={text.label.beløp}
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

export const ForpleiningTabel = ({
    underholdFieldName,
}: {
    underholdFieldName: `underholdskostnaderMedIBehandling.${number}`;
}) => {
    const fieldName = `${underholdFieldName}.forpleining` as const;
    const { getValues, setError, clearErrors } = useFormContext<UnderholdskostnadFormValues>();
    const underhold = getValues(underholdFieldName);
    const saveForpleining = useOnSaveForpleining(underhold.id);

    const createPayload = (index: number) => {
        const { id, datoFom, datoTom, beløp } = getValues(`${fieldName}.${index}`);
        return {
            id,
            beløp: Number(beløp),
            periode: { fom: datoFom, tom: datoTom },
        };
    };

    // Forpleiningen kan ikke overstige underholdskostnaden før forpleining er trukket fra. Underholdskostnaden
    // splittes i flere perioder enn forpleiningen, så beløpet kontrolleres mot den laveste i perioden.
    const høyesteTillatteBeløp = (datoFom: string, datoTom: string) => {
        const overlappende = underhold.beregnetUnderholdskostnad.filter(
            (periode) =>
                periode.periode.fom <= (datoTom || "9999-12-31") && datoFom <= (periode.periode.tom ?? "9999-12-31"),
        );
        if (!overlappende.length) return null;
        return Math.min(
            ...overlappende.map(
                (periode) =>
                    periode.forbruk +
                    periode.boutgifter +
                    periode.stønadTilBarnetilsyn +
                    periode.tilsynsutgifter -
                    periode.barnetrygd,
            ),
        );
    };

    const validateRow = (index: number) => {
        const { datoFom, datoTom, beløp } = getValues(`${fieldName}.${index}`);
        if (datoFom === null) {
            setError(`${fieldName}.${index}.datoFom`, {
                type: "notValid",
                message: text.error.datoMåFyllesUt,
            });
        }
        if (!beløp || beløp <= 0) {
            setError(`${fieldName}.${index}.beløp`, {
                type: "notValid",
                message: text.error.forpleiningVerdi,
            });
            return;
        }
        const grense = høyesteTillatteBeløp(datoFom, datoTom);
        if (grense !== null && Number(beløp) > grense) {
            setError(`${fieldName}.${index}.beløp`, {
                type: "notValid",
                message: text.error.forpleiningOverstigerUnderholdskostnad,
            });
        } else {
            clearErrors(`${fieldName}.${index}.beløp`);
        }
    };

    return (
        <Box background="neutral-soft" className="grid gap-y-2 px-4 py-2 w-full">
            <HStack gap={"space-2"}>
                <Heading level="2" size="small" id={elementId.seksjon_underholdskostnad_forpleining}>
                    {text.title.forpleining}
                </Heading>
            </HStack>
            <UnderholdskostnadTabel
                fieldName={fieldName}
                saveFn={saveForpleining}
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
                    addPeriod: (periode: ForpleiningPeriode) => void;
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
                                            <Table.HeaderCell scope="col" className="w-[56px]"></Table.HeaderCell>
                                            <Table.HeaderCell scope="col" className="w-[56px]"></Table.HeaderCell>
                                        </Table.Row>
                                    </Table.Header>
                                    <Table.Body>
                                        {controlledFields.map((item: ForpleiningPeriode, index) => (
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
                                                    <Beløp fieldName={`${fieldName}.${index}`} item={item} />
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
