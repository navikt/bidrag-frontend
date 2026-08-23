import {
    type InntektBarn,
    InntektBelopstype,
    Inntektsrapportering,
    Inntektstype,
    Kilde,
    Stonadstype,
    TypeBehandling,
} from "@bidrag/api/BidragBehandlingApiV1";
import { ObjectUtils, PersonNavnIdent, RolleTag, RolleTypeAbbreviation } from "@bidrag/common";
import { Alert, BodyShort, Box, Heading, Table } from "@navikt/ds-react";
import { useFormContext } from "react-hook-form";
import type { OppdatereInntektRequestLosnet } from "../../../types/apiSpecFix";
import { formatterBeløp } from "../../../utils/number-utils";
import elementId from "../../constants/elementIds";
import text from "../../constants/texts";
import { useBehandlingProvider } from "../../context/BehandlingContext";
import { useGetBehandlingV2 } from "../../hooks/useApiData";
import { hentVisningsnavn } from "../../hooks/useVisningsnavn";
import type { InntektFormPeriode, InntektFormValues } from "../../types/inntektFormValues";
import { FormControlledSelectField } from "../formFields/FormControlledSelectField";
import { FormControlledTextField } from "../formFields/FormControlledTextField";
import LeggTilPeriodeButton from "../formFields/FormLeggTilPeriode";
import { ExpandableContent } from "./ExpandableContent";
import {
    EditOrSaveButton,
    EditOrSaveButtonBulk,
    InntektTabel,
    type InntektTabelChildrenProps,
    KildeIcon,
    Periode,
    TaMed,
} from "./InntektTable";
import { useInntektTableProvider } from "./InntektTableContext";
import { Opplysninger } from "./Opplysninger";

const ignorerBarnetilleggTyper = [Inntektstype.BARNETILLEGG_SUMMERT, Inntektstype.BARNETILLEGG_TILTAKSPENGER];
const ignorerBarnetilleggBidragTyper = [Inntektstype.BARNETILLEGG_SUMMERT];
const Beskrivelse = ({ item, field }: { item: InntektFormPeriode; field: string }) => {
    const { type } = useBehandlingProvider();

    return item.erRedigerbart && item.kilde === Kilde.MANUELL ? (
        <FormControlledSelectField
            name={`${field}.inntektstype`}
            label={text.label.beskrivelse}
            options={[{ value: "", text: text.select.inntektPlaceholder }].concat(
                Object.entries(Inntektstype)

                    .filter(([, text]) => text.includes("BARNETILLEGG"))
                    .filter(([value]) =>
                        type !== TypeBehandling.BIDRAG
                            ? !ignorerBarnetilleggTyper.includes(value as Inntektstype)
                            : !ignorerBarnetilleggBidragTyper.includes(value as Inntektstype),
                    )
                    .map(([value, text]) => ({
                        value: Inntektstype[value],
                        text: hentVisningsnavn(text),
                    })),
            )}
            hideLabel
        />
    ) : (
        <BodyShort className="leading-6 flex align-center" size="small">
            {hentVisningsnavn(
                item.inntektstype,
                item.opprinneligFom ?? item.datoFom,
                item.opprinneligTom ?? item.datoTom,
            )}
        </BodyShort>
    );
};

const BeløpMånedDagsats = ({ item, field }: { item: InntektFormPeriode; field: string }) => {
    return (
        <>
            {item.erRedigerbart && item.kilde === Kilde.MANUELL ? (
                <FormControlledTextField
                    name={`${field}.beløpMånedDagsats`}
                    label="Totalt"
                    type="number"
                    min="1"
                    inputMode="numeric"
                    hideLabel
                />
            ) : (
                <div className="h-6 flex items-center justify-end">{formatterBeløp(item.beløpMånedDagsats)}</div>
            )}
        </>
    );
};

const Skattesats = ({ item, field }: { item: InntektFormPeriode; field: string }) => {
    return (
        <>
            {item.erRedigerbart || item.kanBarnetilleggSkattesatsRedigeres ? (
                <FormControlledTextField
                    name={`${field}.skattesats`}
                    label="Skattesats"
                    type="number"
                    min="0"
                    max={"100"}
                    step="0.1"
                    inputMode="decimal"
                    hideLabel
                />
            ) : (
                <div className="h-6 flex items-center justify-end">
                    {item.skattesats !== undefined ? `${formatterBeløp(item.skattesats)}%` : null}
                </div>
            )}
        </>
    );
};
const Beløpstype = ({ item, field }: { item: InntektFormPeriode; field: string }) => {
    const { lesemodus } = useBehandlingProvider();

    const options = [
        { value: InntektBelopstype.DAGSATS, text: text.select.dagsats },
        { value: InntektBelopstype.MANEDSBELOP, text: text.select.månedsbeløp },
    ];

    if (lesemodus || !item.erRedigerbart || item.kilde === Kilde.OFFENTLIG) {
        return (
            <BodyShort className="leading-6 flex align-center" size="small">
                {options.find((b) => b.value === item.beløpstype)?.text}
            </BodyShort>
        );
    }
    return (
        <FormControlledSelectField
            name={`${field}.beløpstype`}
            className="w-fit h-max"
            label={text.label.beløpstype}
            hideLabel
            options={options}
        />
    );
};
export const Barnetillegg = () => {
    const { inntekterV2: inntektRoller } = useGetBehandlingV2();
    const { type } = useBehandlingProvider();
    const { gjelderRolleId } = useInntektTableProvider();
    const { getValues, clearErrors, getFieldState, setError, setValue } = useFormContext<InntektFormValues>();
    const inntektRolle = inntektRoller.find((rolle) => rolle.gjelder.id === gjelderRolleId);
    const barna = inntektRolle?.inntekter?.barnetillegg;
    const erBidrag = type === TypeBehandling.BIDRAG;

    const customRowValidation = (fieldName: `barnetillegg.${string}.${string}.${number}`) => {
        const periode = getValues(fieldName);
        if (periode.kilde === Kilde.MANUELL) {
            if (periode.beløpstype === InntektBelopstype.DAGSATS) {
                if (periode.beløpMånedDagsats === undefined || periode.beløpMånedDagsats <= 0) {
                    setError(`${fieldName}.beløpMånedDagsats`, {
                        type: "notValid",
                        message: text.error.dagsatsVerdi,
                    });
                } else {
                    clearErrors(`${fieldName}.beløpMånedDagsats`);
                }
            } else if (periode.beløpstype === InntektBelopstype.MANEDSBELOP) {
                if (periode.beløpMånedDagsats === undefined || periode.beløpMånedDagsats <= 0) {
                    setError(`${fieldName}.beløpMånedDagsats`, {
                        type: "notValid",
                        message: text.error.månedsbeløpVerdi,
                    });
                } else {
                    clearErrors(`${fieldName}.beløpMånedDagsats`);
                }
            }

            if (ObjectUtils.isEmpty(periode.inntektstype)) {
                setError(`${fieldName}.inntektstype`, {
                    type: "notValid",
                    message: text.error.barnetilleggType,
                });
            } else {
                clearErrors(`${fieldName}.inntektstype`);
            }
        }

        if (erBidrag && (periode.skattesats === undefined || periode.skattesats < 0)) {
            setError(`${fieldName}.skattesats`, {
                type: "notValid",
                message: text.error.barnetilleggSkattesats,
            });
        } else if (periode.skattesats > 100) {
            setError(`${fieldName}.skattesats`, {
                type: "notValid",
                message: text.error.barnetilleggSkattesatsOver100,
            });
        } else {
            clearErrors(`${fieldName}.skattesats`);
        }
    };
    const totalBeløp = (periode: InntektFormPeriode) => {
        if (periode.kilde === Kilde.MANUELL) {
            if (periode.beløpstype === InntektBelopstype.DAGSATS) {
                return formatterBeløp((periode.beløpMånedDagsats ?? 0) * 260);
            }
            return formatterBeløp((periode.beløpMånedDagsats ?? 0) * 12);
        }
        return formatterBeløp(periode.beløp);
    };

    function onEditSkattesatsBulk(barn: InntektBarn) {
        const values = getValues(`barnetillegg.${gjelderRolleId}.${barn.gjelderBarn.id}` as const);
        const erIRedigeringsmodus = values.some((periode) => periode.erRedigerbart);
        clearErrors(`barnetillegg.${gjelderRolleId}.${barn.gjelderBarn.id}` as const);

        if (erIRedigeringsmodus) {
            setError(`barnetillegg.${gjelderRolleId}.${barn.gjelderBarn.id}` as const, {
                type: "notValid",
                message: "Kan ikke redigere skattesats når perioden er i redigeringsmodus",
            });
            return false;
        }
        values.forEach((periode, index) => {
            const fieldName = `barnetillegg.${gjelderRolleId}.${barn.gjelderBarn.id}.${index}` as const;
            setValue(fieldName, { ...periode, kanBarnetilleggSkattesatsRedigeres: periode.taMed });
        });
        return true;
    }

    function updateAndSaveSkattesats(
        barn: InntektBarn,
        updatedAndSave: (payload: OppdatereInntektRequestLosnet, onSaveSuccess: () => void) => void,
    ) {
        const values = getValues(`barnetillegg.${gjelderRolleId}.${barn.gjelderBarn.id}` as const);

        values.forEach((p, index) => {
            if (p.taMed) {
                customRowValidation?.(`barnetillegg.${gjelderRolleId}.${barn.gjelderBarn.id}.${index}` as const);
            }
        });

        const hasErrors =
            values.filter((_, index) => {
                return getFieldState(`barnetillegg.${gjelderRolleId}.${barn.gjelderBarn.id}.${index}` as const)?.error;
            }).length > 0;
        if (hasErrors) {
            return;
        }
        const request: OppdatereInntektRequestLosnet = {
            oppdaterInnteksperiodeSkatteprosent: values
                .filter((periode) => periode.taMed)
                .map((periode) => ({
                    id: periode.id,
                    skatteprosent: periode.skattesats,
                })),
        };

        updatedAndSave(request, () =>
            values.forEach((periode, index) => {
                const fieldName = `barnetillegg.${gjelderRolleId}.${barn.gjelderBarn.id}.${index}` as const;
                setValue(fieldName, { ...periode, kanBarnetilleggSkattesatsRedigeres: false });
            }),
        );
    }

    return (
        <Box background="neutral-soft" className="grid gap-y-2 px-4 py-2 w-full">
            <Heading level="2" size="small" id={elementId.seksjon_inntekt_barnetillegg}>
                {text.title.barnetillegg}
            </Heading>
            <Opplysninger fieldName={`barnetillegg.${gjelderRolleId}.${gjelderRolleId}`} />
            <div className="grid gap-y-[24px]">
                {barna.map((barn) => (
                    <div className="grid gap-y-2" key={barn.gjelderBarn.id}>
                        {barna.length > 1 && (
                            <div className="grid grid-cols-[max-content_max-content_auto] p-2 bg-[white] border-0 border-[var(--ax-border-neutral)]">
                                <div className="w-8 mr-2 h-max">
                                    <RolleTag
                                        rolleType={RolleTypeAbbreviation.BA}
                                        ident={barn.gjelderBarn.ident}
                                        stønad18År={barn.gjelderBarn.stønadstype === Stonadstype.BIDRAG18AAR}
                                    />
                                </div>
                                <PersonNavnIdent ident={barn.gjelderBarn.ident} />
                            </div>
                        )}
                        <InntektTabel
                            fieldName={`barnetillegg.${gjelderRolleId}.${barn.gjelderBarn.id}` as const}
                            customRowValidation={customRowValidation}
                        >
                            {({
                                controlledFields,
                                onSaveRow,
                                handleOnSelect,
                                onEditRow,
                                updatedAndSave,
                                addPeriod,
                            }: InntektTabelChildrenProps) => {
                                // const inneholderOffentlig = controlledFields.some(
                                //     (periode) => periode.kilde === Kilde.OFFENTLIG
                                // );
                                const inneholderManuell = controlledFields.some(
                                    (periode) => periode.kilde === Kilde.MANUELL,
                                );
                                const erIRedigeringsmodus = controlledFields.some((periode) => periode.erRedigerbart);
                                const erSkattesatsIRedigeringsmodus = controlledFields.some(
                                    (periode) => periode.kanBarnetilleggSkattesatsRedigeres,
                                );
                                const erOffentligIRedigeringsmodus = controlledFields.some(
                                    (periode) => periode.kilde === Kilde.OFFENTLIG && periode.erRedigerbart,
                                );
                                const error = getFieldState(
                                    `barnetillegg.${gjelderRolleId}.${barn.gjelderBarn.id}` as const,
                                )?.error;

                                return (
                                    <div className="grid gap-y-2">
                                        {controlledFields.length > 0 && (
                                            <div className="overflow-x-auto whitespace-nowrap">
                                                {error?.message && (
                                                    <Alert
                                                        inline
                                                        variant="error"
                                                        className="mb-4"
                                                        hidden={!error?.message}
                                                        size="small"
                                                    >
                                                        {error?.message}
                                                    </Alert>
                                                )}
                                                <Table
                                                    size="small"
                                                    className="table-fixed table bg-[white] w-fit text-wrap"
                                                >
                                                    <Table.Header>
                                                        <Table.Row className="align-baseline">
                                                            <Table.HeaderCell
                                                                textSize="small"
                                                                scope="col"
                                                                align="center"
                                                                className={
                                                                    erIRedigeringsmodus && !erOffentligIRedigeringsmodus
                                                                        ? "w-[50px]"
                                                                        : "w-[50px]"
                                                                }
                                                            >
                                                                {text.label.taMed}
                                                            </Table.HeaderCell>
                                                            <Table.HeaderCell
                                                                textSize="small"
                                                                scope="col"
                                                                className={
                                                                    erIRedigeringsmodus && !erOffentligIRedigeringsmodus
                                                                        ? "w-[134px]"
                                                                        : inneholderManuell
                                                                          ? "w-[94px]"
                                                                          : "w-[94px]"
                                                                }
                                                            >
                                                                {text.label.fraOgMed}
                                                            </Table.HeaderCell>
                                                            <Table.HeaderCell
                                                                textSize="small"
                                                                scope="col"
                                                                className={
                                                                    erIRedigeringsmodus && !erOffentligIRedigeringsmodus
                                                                        ? "w-[134px]"
                                                                        : inneholderManuell
                                                                          ? "w-[90px]"
                                                                          : "w-[94px]"
                                                                }
                                                            >
                                                                {text.label.tilOgMed}
                                                            </Table.HeaderCell>
                                                            <Table.HeaderCell
                                                                textSize="small"
                                                                scope="col"
                                                                align="center"
                                                                className={"w-[43px]"}
                                                            >
                                                                {text.label.kilde}
                                                            </Table.HeaderCell>
                                                            <Table.HeaderCell
                                                                textSize="small"
                                                                scope="col"
                                                                className="w-[150px]"
                                                            >
                                                                {text.label.type}
                                                            </Table.HeaderCell>
                                                            <Table.HeaderCell
                                                                textSize="small"
                                                                scope="col"
                                                                align="right"
                                                                className={
                                                                    erIRedigeringsmodus && !erOffentligIRedigeringsmodus
                                                                        ? "w-[85px]"
                                                                        : "w-[75px]"
                                                                }
                                                            >
                                                                {text.label.beløp}
                                                            </Table.HeaderCell>
                                                            <Table.HeaderCell
                                                                textSize="small"
                                                                scope="col"
                                                                className={
                                                                    erIRedigeringsmodus && !erOffentligIRedigeringsmodus
                                                                        ? "w-[110px]"
                                                                        : "w-[85px]"
                                                                }
                                                            >
                                                                {text.label.beløpstype}
                                                            </Table.HeaderCell>
                                                            {erBidrag && (
                                                                <Table.HeaderCell
                                                                    textSize="small"
                                                                    scope="col"
                                                                    align="right"
                                                                    className={
                                                                        erIRedigeringsmodus &&
                                                                        !erOffentligIRedigeringsmodus
                                                                            ? "w-[100px]"
                                                                            : "w-[120px]"
                                                                    }
                                                                >
                                                                    <div className="flex items-center gap-x-1 justify-end">
                                                                        {text.label.skattesats}
                                                                        {!erIRedigeringsmodus && (
                                                                            <EditOrSaveButtonBulk
                                                                                items={controlledFields}
                                                                                onEditRow={() =>
                                                                                    onEditSkattesatsBulk(barn)
                                                                                }
                                                                                onSaveRow={() =>
                                                                                    updateAndSaveSkattesats(
                                                                                        barn,
                                                                                        updatedAndSave,
                                                                                    )
                                                                                }
                                                                            />
                                                                        )}
                                                                    </div>
                                                                </Table.HeaderCell>
                                                            )}

                                                            <Table.HeaderCell
                                                                textSize="small"
                                                                scope="col"
                                                                align="right"
                                                                className={
                                                                    erIRedigeringsmodus && !erOffentligIRedigeringsmodus
                                                                        ? "w-[75px]"
                                                                        : "w-[115px]"
                                                                }
                                                            >
                                                                {erIRedigeringsmodus && !erOffentligIRedigeringsmodus
                                                                    ? text.label.beløp12MndKort
                                                                    : text.label.beløp12Mnd}
                                                            </Table.HeaderCell>

                                                            <Table.HeaderCell
                                                                textSize="small"
                                                                scope="col"
                                                                className={"w-[46px]"}
                                                            ></Table.HeaderCell>
                                                            {!erIRedigeringsmodus && (
                                                                <Table.HeaderCell
                                                                    textSize="small"
                                                                    scope="col"
                                                                    className={"w-[46px]"}
                                                                ></Table.HeaderCell>
                                                            )}
                                                        </Table.Row>
                                                    </Table.Header>
                                                    <Table.Body>
                                                        {controlledFields.map((item, index) => (
                                                            <Table.ExpandableRow
                                                                key={item.id}
                                                                content={<ExpandableContent item={item} />}
                                                                togglePlacement="right"
                                                                className="align-top"
                                                                expansionDisabled={
                                                                    item.kilde === Kilde.MANUELL || erIRedigeringsmodus
                                                                }
                                                            >
                                                                <Table.DataCell>
                                                                    <TaMed
                                                                        fieldName={`barnetillegg.${gjelderRolleId}.${barn.gjelderBarn.id}`}
                                                                        index={index}
                                                                        handleOnSelect={handleOnSelect}
                                                                    />
                                                                </Table.DataCell>
                                                                <Table.DataCell textSize="small">
                                                                    <Periode
                                                                        index={index}
                                                                        label={text.label.fraOgMed}
                                                                        fieldName={`barnetillegg.${gjelderRolleId}.${barn.gjelderBarn.id}`}
                                                                        field="datoFom"
                                                                        item={{
                                                                            ...item,
                                                                            kanRedigeres: item.kilde === Kilde.MANUELL,
                                                                        }}
                                                                    />
                                                                </Table.DataCell>
                                                                <Table.DataCell textSize="small">
                                                                    <Periode
                                                                        index={index}
                                                                        label={text.label.tilOgMed}
                                                                        fieldName={`barnetillegg.${gjelderRolleId}.${barn.gjelderBarn.id}`}
                                                                        field="datoTom"
                                                                        item={{
                                                                            ...item,
                                                                            kanRedigeres: item.kilde === Kilde.MANUELL,
                                                                        }}
                                                                    />
                                                                </Table.DataCell>
                                                                <Table.DataCell>
                                                                    <KildeIcon kilde={item.kilde} />
                                                                </Table.DataCell>

                                                                <Table.DataCell textSize="small">
                                                                    <Beskrivelse
                                                                        item={item}
                                                                        field={`barnetillegg.${gjelderRolleId}.${barn.gjelderBarn.id}.${index}`}
                                                                    />
                                                                </Table.DataCell>
                                                                <Table.DataCell textSize="small">
                                                                    <BeløpMånedDagsats
                                                                        item={item}
                                                                        field={`barnetillegg.${gjelderRolleId}.${barn.gjelderBarn.id}.${index}`}
                                                                    />
                                                                </Table.DataCell>
                                                                <Table.DataCell textSize="small">
                                                                    <Beløpstype
                                                                        item={item}
                                                                        field={`barnetillegg.${gjelderRolleId}.${barn.gjelderBarn.id}.${index}`}
                                                                    />
                                                                </Table.DataCell>
                                                                {erBidrag && (
                                                                    <Table.DataCell textSize="small">
                                                                        <Skattesats
                                                                            item={item}
                                                                            field={`barnetillegg.${gjelderRolleId}.${barn.gjelderBarn.id}.${index}`}
                                                                        />
                                                                    </Table.DataCell>
                                                                )}

                                                                <Table.DataCell textSize="small">
                                                                    <div className="h-6 flex items-center justify-end">
                                                                        {totalBeløp(item)}
                                                                    </div>
                                                                </Table.DataCell>

                                                                <Table.DataCell>
                                                                    {!erSkattesatsIRedigeringsmodus && (
                                                                        <EditOrSaveButton
                                                                            index={index}
                                                                            item={item}
                                                                            onEditRow={onEditRow}
                                                                            onSaveRow={onSaveRow}
                                                                        />
                                                                    )}
                                                                </Table.DataCell>
                                                            </Table.ExpandableRow>
                                                        ))}
                                                    </Table.Body>
                                                </Table>
                                            </div>
                                        )}
                                        <LeggTilPeriodeButton
                                            addPeriode={() => {
                                                addPeriod({
                                                    gjelderRolleId,
                                                    datoFom: null,
                                                    datoTom: null,
                                                    gjelderBarnId: barn.gjelderBarn.id,
                                                    beløpstype: InntektBelopstype.MANEDSBELOP,
                                                    beløp: 0,
                                                    rapporteringstype: Inntektsrapportering.BARNETILLEGG,
                                                    taMed: true,
                                                    kilde: Kilde.MANUELL,
                                                    inntektsposter: [],
                                                    inntektstyper: [],
                                                });
                                            }}
                                        />
                                    </div>
                                );
                            }}
                        </InntektTabel>
                    </div>
                ))}
            </div>
        </Box>
    );
};
