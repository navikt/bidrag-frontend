import type { RelaxSpecTypes } from "../../../../types/apiSpecFix";
import "../../../../common/components/boforhold/Opplysninger.css";

import {
    Kilde,
    type OppdatereSivilstand,
    OpplysningerType,
    Rolletype,
    type SivilstandDto,
    type SivilstandGrunnlagDto,
    Sivilstandskode,
} from "@bidrag/api/BidragBehandlingApiV1";
import { capitalize, ObjectUtils } from "@bidrag/common";
import { ArrowUndoIcon, FloppydiskIcon, PencilIcon, TrashIcon } from "@navikt/aksel-icons";
import { Box, Button, Heading, HStack, ReadMore, Table, Tag, VStack } from "@navikt/ds-react";
import { useEffect, useState } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { BehandlingAlert } from "../../../../common/components/BehandlingAlert";
import { FormControlledMonthPicker } from "../../../../common/components/formFields/FormControlledMonthPicker";
import { FormControlledSelectField } from "../../../../common/components/formFields/FormControlledSelectField";
import { KildeIcon } from "../../../../common/components/inntekt/InntektTable";
import { OverlayLoader } from "../../../../common/components/OverlayLoader";
import elementIds from "../../../../common/constants/elementIds";
import text from "../../../../common/constants/texts";
import { useBehandlingProvider } from "../../../../common/context/BehandlingContext";
import { calculateFraDato, sivilstandForskuddOptions } from "../../../../common/helpers/boforholdFormHelpers";
import { actionOnEnter } from "../../../../common/helpers/keyboardHelpers";
import {
    useGetBehandlingV2,
    useGetOpplysningerSivilstand,
    useGetOpplysningerSivilstandV2,
} from "../../../../common/hooks/useApiData";
import { useFieldMutationStatus } from "../../../../common/hooks/useFieldMutationStatus";
import { useFomTomDato } from "../../../../common/hooks/useFomTomDato";
import { useOnActivateGrunnlag } from "../../../../common/hooks/useOnActivateGrunnlag";
import { useOnSaveBoforhold } from "../../../../common/hooks/useOnSaveBoforhold";
import { useVirkningsdato } from "../../../../common/hooks/useVirkningsdato";
import { hentVisningsnavn } from "../../../../common/hooks/useVisningsnavn";
import { DateToDDMMYYYYString, dateOrNull, isAfterDate } from "../../../../utils/date-utils";
import type { BoforholdFormValues } from "../../../types/boforholdFormValues";

const DeleteButton = ({ onRemovePeriode, index }: { onRemovePeriode: (index) => void; index: number }) => {
    const { lesemodus } = useBehandlingProvider();

    return index && !lesemodus ? (
        <Button
            type="button"
            onClick={() => onRemovePeriode(index)}
            icon={<TrashIcon aria-hidden />}
            variant="tertiary"
            size="small"
        />
    ) : (
        <div className="min-w-[40px]"></div>
    );
};
const EditOrSaveButton = ({
    index,
    editableRow,
    onSaveRow,
    onEditRow,
}: {
    index: number;
    editableRow: boolean;
    onSaveRow: (index: number) => void;
    onEditRow: (index: number) => void;
}) => {
    const { lesemodus } = useBehandlingProvider();

    if (lesemodus) return null;

    return editableRow ? (
        <Button
            type="button"
            onClick={() => onSaveRow(index)}
            icon={<FloppydiskIcon aria-hidden />}
            variant="tertiary"
            size="small"
        />
    ) : (
        <Button
            type="button"
            onClick={() => onEditRow(index)}
            icon={<PencilIcon aria-hidden />}
            variant="tertiary"
            size="small"
        />
    );
};

const Status = ({
    editableRow,
    fieldName,
    item,
}: {
    editableRow: boolean;
    fieldName: `sivilstand.${number}.sivilstand`;
    item: SivilstandDto;
}) => {
    return editableRow ? (
        <FormControlledSelectField
            name={fieldName}
            label="Sivilstand"
            className="w-52"
            options={sivilstandForskuddOptions.map((value) => ({
                value,
                text: hentVisningsnavn(value.toString()),
            }))}
            hideLabel
        />
    ) : (
        <div className="h-8 flex items-center">{hentVisningsnavn(item.sivilstand)}</div>
    );
};

const Periode = ({
    editableRow,
    item,
    field,
    fieldName,
    label,
}: {
    editableRow: boolean;
    item: SivilstandDto;
    fieldName: `sivilstand.${number}`;
    field: "datoFom" | "datoTom";
    label: string;
}) => {
    const { erVirkningstidspunktNåværendeMånedEllerFramITid, lesemodus } = useBehandlingProvider();
    const { getValues, clearErrors, setError } = useFormContext<BoforholdFormValues>();
    const fieldIsDatoTom = field === "datoTom";
    const [fom, tom] = useFomTomDato(fieldIsDatoTom);

    const validateFomOgTom = () => {
        const periode = getValues(fieldName);
        const fomOgTomInvalid = !ObjectUtils.isEmpty(periode.datoTom) && isAfterDate(periode?.datoFom, periode.datoTom);

        if (fomOgTomInvalid) {
            setError(`${fieldName}.datoFom`, {
                type: "notValid",
                message: text.error.tomDatoKanIkkeVæreFørFomDato,
            });
        } else {
            clearErrors(`${fieldName}.datoFom`);
        }
    };

    return editableRow && !erVirkningstidspunktNåværendeMånedEllerFramITid ? (
        <FormControlledMonthPicker
            name={`${fieldName}.${field}`}
            label={label}
            placeholder="DD.MM.ÅÅÅÅ"
            defaultValue={item[field]}
            customValidation={validateFomOgTom}
            fromDate={fom}
            toDate={tom}
            lastDayOfMonthPicker={fieldIsDatoTom}
            required={!fieldIsDatoTom}
            readonly={lesemodus}
            hideLabel
        />
    ) : (
        <div className="h-8 flex items-center">{item[field] && DateToDDMMYYYYString(dateOrNull(item[field]))}</div>
    );
};
export const Sivilstand = () => {
    const datoFom = useVirkningsdato();
    return (
        <div className="mt-8">
            <Heading level="2" size="small" id={elementIds.seksjon_sivilstand} title="Sivilstand V2">
                {text.label.sivilstand}
            </Heading>
            <SivilistandPerioder virkningstidspunkt={datoFom} />
        </div>
    );
};

const SivilistandPerioder = ({ virkningstidspunkt }: { virkningstidspunkt: Date }) => {
    const {
        setErrorMessage,
        setErrorModalOpen,
        lesemodus,
        erVirkningstidspunktNåværendeMånedEllerFramITid,
        setSaveErrorState,
        setPageErrorsOrUnsavedState,
    } = useBehandlingProvider();
    const {
        boforhold: { valideringsfeil, sivilstand: sivilstandBehandling },
        feilOppståttVedSisteGrunnlagsinnhenting,
    } = useGetBehandlingV2();
    const saveBoforhold = useOnSaveBoforhold();
    const sivilstandMutationStatus = useFieldMutationStatus(saveBoforhold.mutation, "sivilstand");

    const [showResetButton, setShowResetButton] = useState(false);
    const [showUndoButton, setShowUndoButton] = useState(false);

    const [editableRow, setEditableRow] = useState<number>(undefined);
    const sivilstandOpplysninger = useGetOpplysningerSivilstand();
    const {
        control,
        getValues,
        getFieldState,
        setError,
        setValue,
        clearErrors,
        formState: { errors },
    } = useFormContext<BoforholdFormValues>();
    const sivilstandPerioder = useFieldArray({
        control,
        name: `sivilstand`,
    });
    const feilVedInnhentingAvOffentligData = feilOppståttVedSisteGrunnlagsinnhenting?.some(
        (innhentingsFeil) => innhentingsFeil.grunnlagsdatatype === OpplysningerType.SIVILSTAND,
    );

    const watchFieldArray = useWatch({ control, name: `sivilstand` });
    const controlledFields = sivilstandPerioder.fields.map((field, index) => ({
        ...field,
        ...watchFieldArray[index],
    }));

    useEffect(() => {
        setPageErrorsOrUnsavedState((prevState) => ({
            ...prevState,
            boforhold: {
                ...prevState.boforhold,
                openFields: {
                    ...prevState.boforhold.openFields,
                    sivilstand: editableRow !== undefined,
                },
            },
        }));
    }, [JSON.stringify(errors), editableRow]);

    const onSaveRow = (index: number) => {
        const perioderValues = getValues(`sivilstand`);
        if (perioderValues[index].datoFom === null) {
            setError(`sivilstand.${index}.datoFom`, {
                type: "notValid",
                message: text.error.datoMåFyllesUt,
            });
        }

        const fieldState = getFieldState(`sivilstand.${index}`);
        if (!fieldState.error) {
            const updatedSivilstand = perioderValues[index];
            updateAndSave(
                {
                    nyEllerEndretSivilstandsperiode: {
                        fraOgMed: updatedSivilstand.datoFom,
                        tilOgMed: updatedSivilstand.datoTom,
                        sivilstand: updatedSivilstand.sivilstand,
                        id: updatedSivilstand.id,
                    },
                    tilbakestilleHistorikk: false,
                    angreSisteEndring: false,
                },
                index,
            );
        }
    };

    const updateAndSave = (payload: RelaxSpecTypes<OppdatereSivilstand>, index?: number) => {
        saveBoforhold.mutation.mutate(
            { triggeredBy: "sivilstand", oppdatereSivilstand: payload },
            {
                onSuccess: (response) => {
                    setShowUndoButton(true);
                    sivilstandPerioder.replace(
                        response.oppdatertSivilstandshistorikk?.sort((a, b) => (a.datoFom > b.datoFom ? 1 : -1)),
                    );
                },
                onError: () => {
                    setSaveErrorState({
                        error: true,
                        retryFn: () => updateAndSave(payload),
                        rollbackFn: () => {
                            if (
                                payload.nyEllerEndretSivilstandsperiode &&
                                payload.nyEllerEndretSivilstandsperiode.id == null
                            ) {
                                sivilstandPerioder.remove(index);
                            } else {
                                setValue("sivilstand", sivilstandBehandling);
                            }
                            if (payload.tilbakestilleHistorikk) {
                                setShowResetButton(true);
                            }
                        },
                    });
                },
            },
        );
        setShowResetButton(true);
        setEditableRow(undefined);
    };

    const addPeriode = () => {
        if (checkIfAnotherRowIsEdited()) {
            showErrorModal();
        } else {
            const sivilstandPerioderValues = getValues("sivilstand");
            sivilstandPerioder.append({
                datoFom: calculateFraDato(sivilstandPerioderValues, virkningstidspunkt),
                datoTom: null,
                sivilstand: Sivilstandskode.BOR_ALENE_MED_BARN,
                kilde: Kilde.MANUELL,
            });

            setEditableRow(sivilstandPerioderValues.length);
        }
    };

    const onRemovePeriode = (index: number) => {
        if (checkIfAnotherRowIsEdited(index)) {
            showErrorModal();
        } else {
            const perioderValues = getValues(`sivilstand`) as SivilstandDto[];
            if (perioderValues[index]?.id) {
                updateAndSave({
                    sletteSivilstandsperiode: perioderValues[index].id,
                    tilbakestilleHistorikk: false,
                    angreSisteEndring: false,
                });
            } else {
                sivilstandPerioder.remove(index);
            }
            clearErrors(`sivilstand.${index}.datoFom`);
            setEditableRow(undefined);
        }
    };

    const checkIfAnotherRowIsEdited = (index?: number) => {
        return editableRow !== undefined && Number(editableRow) !== index;
    };

    const showErrorModal = () => {
        setErrorMessage({
            title: text.alert.fullførRedigering,
            text: text.alert.periodeUnderRedigering,
        });
        setErrorModalOpen(true);
    };

    const onEditRow = (index: number) => {
        if (checkIfAnotherRowIsEdited(index)) {
            showErrorModal();
        } else {
            setEditableRow(index);
            const editPeriode = controlledFields[index];
            if (editPeriode?.sivilstand === Sivilstandskode.UKJENT) {
                setValue(`sivilstand.${index}.sivilstand`, Sivilstandskode.BOR_ALENE_MED_BARN);
            }
        }
    };
    const undoAction = () => {
        updateAndSave({
            angreSisteEndring: true,
            tilbakestilleHistorikk: false,
        });
    };
    const resetTilDataFraFreg = () => {
        updateAndSave({
            tilbakestilleHistorikk: true,
            angreSisteEndring: false,
        });
        setShowResetButton(false);
    };

    const valideringsfeilSivilstand = valideringsfeil?.sivilstand;
    return (
        <div>
            <Box padding="space-12" background="neutral-soft" className="overflow-hidden">
                {valideringsfeilSivilstand?.harFeil && (
                    <div className="mb-4">
                        {valideringsfeilSivilstand && (
                            <BehandlingAlert variant="warning">
                                <Heading spacing size="small" level="3">
                                    {text.alert.feilIPeriodisering}
                                </Heading>
                                {valideringsfeilSivilstand.fremtidigPeriode && (
                                    <p>{text.error.framoverPeriodisering}</p>
                                )}
                                {valideringsfeilSivilstand.hullIPerioder.length > 0 && (
                                    <p>{text.error.hullIPerioder}</p>
                                )}
                                {valideringsfeilSivilstand.manglerPerioder && (
                                    <p>{text.error.boforholdManglerPerioder}</p>
                                )}
                                {valideringsfeilSivilstand.ingenLøpendePeriode && (
                                    <p>{text.error.ingenLoependePeriode}</p>
                                )}
                                {valideringsfeilSivilstand.ugyldigStatus && <p>{text.error.ugyldigStatus}</p>}
                            </BehandlingAlert>
                        )}
                    </div>
                )}
                <div className="grid grid-cols-2 gap-4" data-section={elementIds.seksjon_offentlige_opplysninger}>
                    <Opplysninger />
                    {sivilstandOpplysninger != null && showResetButton && (
                        <div className="flex justify-end mb-4">
                            <Button
                                variant="tertiary"
                                type="button"
                                size="small"
                                className="w-fit h-fit"
                                onClick={resetTilDataFraFreg}
                            >
                                {text.resetTilOpplysninger}
                            </Button>
                        </div>
                    )}
                </div>
                <NyOpplysningerFraFolkeregistreTabell
                    onActivateOpplysninger={(overskriveManuelleOpplysninger) => {
                        setShowUndoButton((prevValue) => prevValue || overskriveManuelleOpplysninger);
                        setShowResetButton(!overskriveManuelleOpplysninger);
                    }}
                />

                {feilVedInnhentingAvOffentligData && (
                    <BehandlingAlert variant="info" className="w-[708px] mb-2">
                        <Heading size="small" level="3">
                            {text.alert.feilVedInnhentingAvOffentligData}
                        </Heading>
                        {text.feilVedInnhentingAvOffentligData}
                    </BehandlingAlert>
                )}

                {controlledFields.length > 0 && (
                    <div
                        className={`${
                            sivilstandMutationStatus === "pending" ? "relative" : "inherit"
                        } block overflow-x-auto whitespace-nowrap`}
                        data-section={elementIds.seksjon_perioder}
                    >
                        <OverlayLoader loading={sivilstandMutationStatus === "pending"} />
                        <Table size="small" className="table-fixed table bg-[white] w-full">
                            <Table.Header>
                                <Table.Row className="align-baseline">
                                    <Table.HeaderCell textSize="small" scope="col" align="left" className="w-[134px]">
                                        {text.label.fraOgMed}
                                    </Table.HeaderCell>
                                    <Table.HeaderCell textSize="small" scope="col" align="left" className="w-[134px]">
                                        {text.label.tilOgMed}
                                    </Table.HeaderCell>
                                    <Table.HeaderCell textSize="small" scope="col" align="left">
                                        {text.label.sivilstand}
                                    </Table.HeaderCell>
                                    <Table.HeaderCell textSize="small" scope="col" align="left" className="w-[54px]">
                                        {text.label.kilde}
                                    </Table.HeaderCell>
                                    <Table.HeaderCell scope="col" className="w-[56px]"></Table.HeaderCell>
                                    <Table.HeaderCell scope="col" className="w-[56px]"></Table.HeaderCell>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {controlledFields.map((item, index) => (
                                    <Table.Row
                                        key={item?.id}
                                        className="align-top"
                                        onKeyDown={actionOnEnter(() => onSaveRow(index))}
                                    >
                                        <Table.DataCell textSize="small">
                                            <Periode
                                                editableRow={editableRow === index}
                                                label={text.label.fraOgMed}
                                                fieldName={`sivilstand.${index}`}
                                                field="datoFom"
                                                item={item}
                                            />
                                        </Table.DataCell>
                                        <Table.DataCell textSize="small">
                                            <Periode
                                                editableRow={editableRow === index}
                                                label={text.label.tilOgMed}
                                                fieldName={`sivilstand.${index}`}
                                                field="datoTom"
                                                item={item}
                                            />
                                        </Table.DataCell>
                                        <Table.DataCell textSize="small">
                                            <Status
                                                item={item}
                                                editableRow={editableRow === index}
                                                fieldName={`sivilstand.${index}.sivilstand`}
                                            />
                                        </Table.DataCell>
                                        <Table.DataCell>
                                            <KildeIcon kilde={item.kilde} />
                                        </Table.DataCell>
                                        <Table.DataCell>
                                            <EditOrSaveButton
                                                index={index}
                                                editableRow={editableRow === index}
                                                onEditRow={onEditRow}
                                                onSaveRow={onSaveRow}
                                            />
                                        </Table.DataCell>
                                        <Table.DataCell>
                                            <DeleteButton index={index} onRemovePeriode={onRemovePeriode} />
                                        </Table.DataCell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table>
                    </div>
                )}
                <VStack gap="space-2">
                    {showUndoButton && (
                        <Button
                            variant="tertiary"
                            type="button"
                            size="small"
                            className="w-fit mt-2"
                            onClick={undoAction}
                            iconPosition="right"
                            icon={<ArrowUndoIcon aria-hidden />}
                        >
                            {text.label.angreSisteSteg}
                        </Button>
                    )}
                    {!lesemodus && !erVirkningstidspunktNåværendeMånedEllerFramITid && (
                        <Button
                            variant="tertiary"
                            type="button"
                            size="small"
                            className="w-fit mt-4"
                            onClick={addPeriode}
                        >
                            {text.label.leggTilPeriode}
                        </Button>
                    )}
                </VStack>
            </Box>
        </div>
    );
};

const Opplysninger = () => {
    const { aktiveOpplysninger, ikkeAktiverteOpplysninger } = useGetOpplysningerSivilstandV2();

    if (!aktiveOpplysninger) {
        return null;
    }

    const renderTable = (opplysninger: SivilstandGrunnlagDto[]) => {
        return (
            <Table className="w-[200px] opplysninger" size="small">
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell style={{ width: "120px" }}>{text.label.fraDato}</Table.HeaderCell>
                        <Table.HeaderCell>{text.label.status}</Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {opplysninger.map((periode, index) => (
                        <Table.Row key={`${periode.type}-${index}`}>
                            <Table.DataCell className="flex justify-start gap-2">
                                {periode.gyldigFom ? DateToDDMMYYYYString(new Date(periode.gyldigFom)) : "\u00A0"}
                            </Table.DataCell>
                            <Table.DataCell>{capitalize(periode.type)?.replaceAll("_", " ")}</Table.DataCell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table>
        );
    };

    const harNyeOpplysninger = ikkeAktiverteOpplysninger && ikkeAktiverteOpplysninger.grunnlag.length > 0;
    return (
        <ReadMore
            header={
                <HStack gap="space-2">
                    {text.title.opplysningerFraFolkeregistret}
                    {harNyeOpplysninger && (
                        <Tag size="xsmall" variant="success">
                            {text.label.nytt}
                        </Tag>
                    )}
                </HStack>
            }
            size="small"
            className="pb-4"
        >
            <HStack gap="space-2" className="w-max">
                <Box padding="space-1">{renderTable(aktiveOpplysninger.grunnlag)}</Box>
                {harNyeOpplysninger && (
                    <Box padding="space-1" className="border-[var(--ax-border-success)] border-l-2 border-solid">
                        {renderTable(ikkeAktiverteOpplysninger.grunnlag)}
                    </Box>
                )}
            </HStack>
        </ReadMore>
    );
};

type NyOpplysningerFraFolkeregistreTabellProps = {
    onActivateOpplysninger: (overskriveManuelleOpplysninger: boolean) => void;
};
function NyOpplysningerFraFolkeregistreTabell({ onActivateOpplysninger }: NyOpplysningerFraFolkeregistreTabellProps) {
    const { ikkeAktiverteOpplysninger } = useGetOpplysningerSivilstandV2();
    const hasNewOpplysningerFraFolkeregistre = ikkeAktiverteOpplysninger != null;
    const activateGrunnlag = useOnActivateGrunnlag();
    const { setSaveErrorState } = useBehandlingProvider();
    const { setValue } = useFormContext<BoforholdFormValues>();
    const behandling = useGetBehandlingV2();
    const bidragsmottaker = behandling.roller.find((r) => r.rolletype === Rolletype.BM);
    const onActivate = (overskriveManuelleOpplysninger: boolean) => {
        activateGrunnlag.mutation.mutate(
            {
                overskriveManuelleOpplysninger,
                personident: bidragsmottaker.ident,
                grunnlagstype: OpplysningerType.SIVILSTAND,
            },
            {
                onSuccess: (response) => {
                    onActivateOpplysninger(overskriveManuelleOpplysninger);
                    activateGrunnlag.queryClientUpdater((currentData) => {
                        return {
                            ...currentData,
                            boforhold: {
                                ...currentData.boforhold,
                                sivilstand: response.boforhold.sivilstand,
                                valideringsfeil: {
                                    ...currentData.boforhold.valideringsfeil,
                                    sivilstand: currentData.boforhold.valideringsfeil.sivilstand,
                                },
                            },
                            aktiveGrunnlagsdata: response.aktiveGrunnlagsdata,
                            ikkeAktiverteEndringerIGrunnlagsdata: response.ikkeAktiverteEndringerIGrunnlagsdata,
                        };
                    });

                    setValue("sivilstand", response.boforhold.sivilstand);
                },
                onError: () => {
                    setSaveErrorState({
                        error: true,
                        retryFn: () => onActivate(overskriveManuelleOpplysninger),
                    });
                },
            },
        );
    };
    const pendingActivate = activateGrunnlag.mutation.isPending ? activateGrunnlag.mutation.variables : null;
    if (!hasNewOpplysningerFraFolkeregistre) return null;
    return (
        <Box
            padding="space-4"
            background="default"
            borderWidth="1"
            borderRadius="4"
            borderColor="neutral"
            className="w-[708px]"
        >
            <Heading size="xsmall">{text.alert.nyOpplysningerBoforhold}</Heading>
            <table className="mt-2">
                <thead>
                    <tr>
                        <th align="left">{text.label.fraOgMed}</th>
                        <th align="left">{text.label.tilOgMed}</th>
                        <th align="left">{text.label.status}</th>
                    </tr>
                </thead>
                <tbody>
                    {ikkeAktiverteOpplysninger.sivilstand?.map((periode, index) => (
                        <tr key={index + periode.datoFom}>
                            <td width="100px">{DateToDDMMYYYYString(new Date(periode.datoFom))}</td>
                            <td width="100px">
                                {" "}
                                {periode.datoTom ? DateToDDMMYYYYString(new Date(periode.datoTom)) : ""}
                            </td>
                            <td width="250px">{hentVisningsnavn(periode.sivilstand)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <HStack gap="space-6" className="mt-4">
                <Button
                    type="button"
                    variant="secondary"
                    size="xsmall"
                    onClick={() => onActivate(true)}
                    loading={pendingActivate?.overskriveManuelleOpplysninger === true}
                    disabled={pendingActivate?.overskriveManuelleOpplysninger === false}
                >
                    Ja
                </Button>
                <Button
                    type="button"
                    variant="secondary"
                    size="xsmall"
                    onClick={() => onActivate(false)}
                    loading={pendingActivate?.overskriveManuelleOpplysninger === false}
                    disabled={pendingActivate?.overskriveManuelleOpplysninger === true}
                >
                    Nei
                </Button>
            </HStack>
        </Box>
    );
}
