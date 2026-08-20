import {
    type OppdatereVirkningstidspunkt,
    type OppdatereVirkningstidspunktBegrunnelseDto,
    Resultatkode,
    TypeArsakstype,
    Vedtakstype,
    type VirkningstidspunktBarnDtoV2,
    type VirkningstidspunktDtoV3,
} from "@bidrag/api/BidragBehandlingApiV1";
import { PersonNavnIdent, toISODateString } from "@bidrag/common";
import { BodyShort, Label, Tabs } from "@navikt/ds-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FormProvider, useFieldArray, useForm, useFormContext, useWatch } from "react-hook-form";
import { useSearchParams } from "react-router";
import { useGetActiveAndDefaultVirkningstidspunktTab } from "../../../../barnebidrag/hooks/useGetActiveAndDefaultVirkningstidspunktTab";
import { useOnSaveVirkningstidspunkt } from "../../../../barnebidrag/hooks/useOnSaveVirkningstidspunkt";
import { ActionButtons } from "../../../../common/components/ActionButtons";
import { BehandlingAlert } from "../../../../common/components/BehandlingAlert";
import { CustomTextareaEditor } from "../../../../common/components/CustomEditor";
import { FormControlledCustomTextareaEditor } from "../../../../common/components/formFields/FormControlledCustomTextEditor";
import { FormControlledMonthPicker } from "../../../../common/components/formFields/FormControlledMonthPicker";
import { FormControlledSelectField } from "../../../../common/components/formFields/FormControlledSelectField";
import KlagetPåVedtakButton from "../../../../common/components/KlagetPåVedtakButton";
import { FlexRow } from "../../../../common/components/layout/grid/FlexRow";
import { NewFormLayout } from "../../../../common/components/layout/grid/NewFormLayout";
import { QueryErrorWrapper } from "../../../../common/components/query-error-boundary/QueryErrorWrapper";
import urlSearchParams from "../../../../common/constants/behandlingQueryKeys";
import { SOKNAD_LABELS } from "../../../../common/constants/soknadFraLabels";
import text from "../../../../common/constants/texts";
import { useBehandlingProvider } from "../../../../common/context/BehandlingContext";
import { tilRolleType } from "../../../../common/helpers/rolletypeHelpers";
import { aarsakToVirkningstidspunktMapper } from "../../../../common/helpers/virkningstidspunktHelpers";
import { useGetBehandlingV2 } from "../../../../common/hooks/useApiData";
import { useDebounce } from "../../../../common/hooks/useDebounce";
import { useFomTomDato } from "../../../../common/hooks/useFomTomDato";
import { useOnSaveVirkningstidspunktBegrunnelse } from "../../../../common/hooks/useOnSaveVirkningstidspunktBegrunnelse";
import { hentVisningsnavn, hentVisningsnavnVedtakstype } from "../../../../common/hooks/useVisningsnavn";
import type {
    VirkningstidspunktFormValues,
    VirkningstidspunktFormValuesPerBarn,
} from "../../../../common/types/virkningstidspunktFormValues";
import { addMonths, DateToDDMMYYYYString, dateOrNull } from "../../../../utils/date-utils";
import { ForskuddStepper } from "../../../enum/ForskuddStepper";

const årsakListe = [
    TypeArsakstype.TREMANEDERTILBAKE,
    TypeArsakstype.TREARSREGELEN,
    TypeArsakstype.FRABARNETSFODSEL,
    TypeArsakstype.FRABARNETSFLYTTEMANED,
    TypeArsakstype.FRA_KRAVFREMSETTELSE,
    TypeArsakstype.FRA_OPPHOLDSTILLATELSE,
    TypeArsakstype.FRASOKNADSTIDSPUNKT,
    TypeArsakstype.FRA_SAMLIVSBRUDD,
    TypeArsakstype.PRIVAT_AVTALE,
    TypeArsakstype.REVURDERINGMANEDENETTER,
    TypeArsakstype.SOKNADSTIDSPUNKTENDRING,
    TypeArsakstype.TIDLIGERE_FEILAKTIG_AVSLAG,
    TypeArsakstype.FRAMANEDENETTERIPAVENTEAVBIDRAGSSAK,
];

const avslagsListe = [
    Resultatkode.PAGRUNNAVBARNEPENSJON,
    Resultatkode.BARNETS_EKTESKAP,
    Resultatkode.BARNETS_INNTEKT,
    Resultatkode.PAGRUNNAVYTELSEFRAFOLKETRYGDEN,
    Resultatkode.FULLT_UNDERHOLDT_AV_OFFENTLIG,
    Resultatkode.IKKE_OMSORG,
    Resultatkode.IKKE_OPPHOLD_I_RIKET,
    Resultatkode.MANGLENDE_DOKUMENTASJON,
    Resultatkode.BARNETANSESABOSAMMENMEDBEGGEFORELDRE,
    Resultatkode.OPPHOLD_I_UTLANDET,
    Resultatkode.AVSLAG_PRIVAT_AVTALE_BIDRAG,
    Resultatkode.IKKE_INNKREVING_AV_BIDRAG,
    Resultatkode.UTENLANDSK_YTELSE,
];

const opphørAvslagsListe = [...avslagsListe, Resultatkode.PARTENBEROMOPPHOR, Resultatkode.BARNETERDODT];

const avslagsListeDeprekert = [Resultatkode.IKKESOKTOMINNKREVINGAVBIDRAG];

const createInitialValues = (response: VirkningstidspunktDtoV3): VirkningstidspunktFormValues => {
    return {
        roller: response.barn.map((virkningstidspunkt) => {
            return {
                rolle: virkningstidspunkt.rolle,
                virkningstidspunkt: virkningstidspunkt.virkningstidspunkt,
                årsakAvslag: virkningstidspunkt.årsak ?? virkningstidspunkt.avslag ?? "",
                begrunnelse: virkningstidspunkt.begrunnelse?.innhold,
            };
        }),
    };
};

const createPayload = (values: VirkningstidspunktFormValuesPerBarn, rolleId?: number): OppdatereVirkningstidspunkt => {
    const årsak = årsakListe.find((value) => value === values.årsakAvslag);
    const avslag = opphørAvslagsListe.find((value) => value === values.årsakAvslag);
    return {
        rolleId,
        virkningstidspunkt: values.virkningstidspunkt,
        årsak,
        avslag,
        oppdatereBegrunnelse: {
            nyBegrunnelse: values.begrunnelse,
        },
    };
};

const VirkningstidspunktRolle = ({
    item,
    rolleIndex,
    initialValues,
}: {
    item: VirkningstidspunktFormValuesPerBarn;
    rolleIndex: number;
    initialValues: VirkningstidspunktFormValuesPerBarn;
}) => {
    const { lesemodus, setSaveErrorState } = useBehandlingProvider();
    const behandling = useGetBehandlingV2();
    const { setValue, clearErrors, getValues, watch } = useFormContext();
    const oppdaterBehandling = useOnSaveVirkningstidspunkt();
    const kunEtRolleIBehandlingen = behandling.virkningstidspunktV3.barn.length === 1;
    const selectedVirkningstidspunkt = behandling.virkningstidspunktV3.barn.find(
        ({ rolle }) => rolle.ident === item.rolle.ident,
    );
    const [previousValues, setPreviousValues] = useState<VirkningstidspunktFormValuesPerBarn>(initialValues);
    const [initialVirkningsdato, setInitialVirkningsdato] = useState(selectedVirkningstidspunkt.virkningstidspunkt);
    const [showChangedVirkningsDatoAlert, setShowChangedVirkningsDatoAlert] = useState(false);
    const søktFomDato = selectedVirkningstidspunkt.søktFomDato ?? behandling.søktFomDato;

    const [fom] = useFomTomDato(false, new Date(søktFomDato));
    const tom = useMemo(
        () => dateOrNull(selectedVirkningstidspunkt.opprinneligVirkningstidspunkt) ?? addMonths(new Date(), 50 * 12),
        [fom],
    );

    useEffect(() => {
        if (
            initialVirkningsdato &&
            selectedVirkningstidspunkt.virkningstidspunkt &&
            initialVirkningsdato !== selectedVirkningstidspunkt.virkningstidspunkt &&
            selectedVirkningstidspunkt.avslag == null
        ) {
            setShowChangedVirkningsDatoAlert(true);
        }

        if (
            initialVirkningsdato &&
            showChangedVirkningsDatoAlert &&
            initialVirkningsdato === selectedVirkningstidspunkt.virkningstidspunkt
        ) {
            setShowChangedVirkningsDatoAlert(false);
        }

        if (!initialVirkningsdato && selectedVirkningstidspunkt.virkningstidspunkt) {
            setInitialVirkningsdato(selectedVirkningstidspunkt.virkningstidspunkt);
        }
    }, [selectedVirkningstidspunkt.virkningstidspunkt]);

    const onSave = useCallback(
        (payload: OppdatereVirkningstidspunkt) => {
            oppdaterBehandling.mutation.mutate(payload, {
                onSuccess: (response) => {
                    oppdaterBehandling.queryClientUpdater((currentData) => {
                        return {
                            ...currentData,
                            ...response,
                            virkningstidspunktV3: {
                                ...response.virkningstidspunktV3,
                                barn: response.virkningstidspunktV3.barn.map((barn) => {
                                    const currentBarn = currentData?.virkningstidspunktV3?.barn.find(
                                        ({ rolle }) => rolle.id === barn.rolle.id,
                                    );
                                    return {
                                        ...barn,
                                        begrunnelse: currentBarn?.begrunnelse,
                                    };
                                }),
                            },
                        };
                    });
                    const updatedValues = createInitialValues(response.virkningstidspunktV3);
                    const selectedBarn = Object.values(updatedValues.roller).find(
                        ({ rolle }) => rolle.ident === selectedVirkningstidspunkt.rolle.ident,
                    );
                    setPreviousValues(selectedBarn);
                },
                onError: () => {
                    setSaveErrorState({
                        error: true,
                        retryFn: () => onSave(payload),
                        rollbackFn: () => {
                            setValue(`roller.${rolleIndex}`, previousValues);
                        },
                    });
                },
            });
        },
        [oppdaterBehandling, setPreviousValues],
    );

    useEffect(() => {
        const subscription = watch((value, { name, type }) => {
            if (
                (name === `roller.${rolleIndex}.virkningstidspunkt` && !value.roller[rolleIndex].virkningstidspunkt) ||
                name === `roller.${rolleIndex}.begrunnelse` ||
                name === `roller.${rolleIndex}.årsakAvslag` ||
                type !== "change"
            ) {
                return;
            }
            const payload = createPayload(value.roller[rolleIndex], selectedVirkningstidspunkt.rolle.id);
            onSave(payload);
        });
        return () => subscription.unsubscribe();
    }, [onSave, watch]);

    const onAarsakSelect = (value: string) => {
        const date = aarsakToVirkningstidspunktMapper(value, behandling, selectedVirkningstidspunkt);
        const virkningsdato = date ? toISODateString(date) : null;
        setValue(`roller.${rolleIndex}.virkningstidspunkt`, virkningsdato);
        clearErrors(`roller.${rolleIndex}.virkningstidspunkt`);

        const values = getValues(`roller.${rolleIndex}.virkningstidspunkt`);
        const payload = createPayload(
            { ...values, årsakAvslag: value, virkningstidspunkt: virkningsdato },
            selectedVirkningstidspunkt.rolle.id,
        );
        onSave(payload);
    };

    const erTypeOpphør = behandling.vedtakstype === Vedtakstype.OPPHOR;
    const avslagsOpphørsliste = erTypeOpphør ? opphørAvslagsListe : avslagsListe;
    const erÅrsakAvslagIkkeValgt = getValues(`roller.${rolleIndex}.årsakAvslag`) === "";

    const erOpphørEllerLøpendeForskudd = erTypeOpphør || selectedVirkningstidspunkt.harLøpendeForskudd;
    return (
        <>
            <FlexRow className="gap-x-12">
                <div className="flex gap-x-2">
                    <Label size="small">{text.label.søknadstype}:</Label>
                    <BodyShort size="small">{hentVisningsnavn(behandling.vedtakstype)}</BodyShort>
                    <KlagetPåVedtakButton />
                </div>
                <div className="flex gap-x-2">
                    <Label size="small">{text.label.søknadfra}:</Label>
                    <BodyShort size="small">{SOKNAD_LABELS[behandling.søktAv]}</BodyShort>
                </div>
                <div className="flex gap-x-2">
                    <Label size="small">{text.label.mottattdato}:</Label>
                    <BodyShort size="small">{DateToDDMMYYYYString(new Date(behandling.mottattdato))}</BodyShort>
                </div>
                <div className="flex gap-x-2">
                    <Label size="small">{text.label.søktfradato}:</Label>
                    <BodyShort size="small">{DateToDDMMYYYYString(new Date(behandling.søktFomDato))}</BodyShort>
                </div>
            </FlexRow>
            <FlexRow className="gap-x-8">
                <FormControlledSelectField
                    name={`roller.${rolleIndex}.årsakAvslag`}
                    label={text.label.årsak}
                    onSelect={onAarsakSelect}
                    className="w-max"
                >
                    {lesemodus && (
                        <option value={getValues(`roller.${rolleIndex}.årsakAvslag`)}>
                            {hentVisningsnavnVedtakstype(
                                getValues(`roller.${rolleIndex}.årsakAvslag`),
                                behandling.vedtakstype,
                            )}
                        </option>
                    )}
                    {!lesemodus && erÅrsakAvslagIkkeValgt && (
                        <option value="">{text.select.årsakAvslagPlaceholder}</option>
                    )}
                    {!lesemodus && !erTypeOpphør && (
                        <optgroup label={text.label.årsak}>
                            {årsakListe
                                .filter((value) => {
                                    if (kunEtRolleIBehandlingen) return true;
                                    return value !== TypeArsakstype.FRABARNETSFODSEL;
                                })
                                .map((value) => (
                                    <option key={value} value={value}>
                                        {hentVisningsnavnVedtakstype(value, behandling.vedtakstype)}
                                    </option>
                                ))}
                        </optgroup>
                    )}
                    {!lesemodus && (
                        <optgroup label={erOpphørEllerLøpendeForskudd ? text.label.opphør : text.label.avslag}>
                            {avslagsOpphørsliste.map((value) => (
                                <option key={value} value={value}>
                                    {hentVisningsnavnVedtakstype(value, behandling.vedtakstype)}
                                </option>
                            ))}
                            {avslagsListeDeprekert.includes(getValues(`roller.${rolleIndex}.årsakAvslag`)) && (
                                <>
                                    {avslagsListeDeprekert.map((value) => (
                                        <option key={value} value={value} disabled>
                                            {hentVisningsnavnVedtakstype(value, behandling.vedtakstype)}
                                        </option>
                                    ))}
                                </>
                            )}
                        </optgroup>
                    )}
                </FormControlledSelectField>
                <FormControlledMonthPicker
                    name={`roller.${rolleIndex}.virkningstidspunkt`}
                    label={text.label.virkningstidspunkt}
                    placeholder="DD.MM.ÅÅÅÅ"
                    defaultValue={initialValues.virkningstidspunkt}
                    fromDate={fom}
                    toDate={tom}
                    readonly={lesemodus}
                    required
                />
            </FlexRow>
            {showChangedVirkningsDatoAlert && (
                <BehandlingAlert variant="warning" className={"w-[488px]"}>
                    <div dangerouslySetInnerHTML={{ __html: text.alert.endretVirkningstidspunkt }}></div>
                </BehandlingAlert>
            )}
        </>
    );
};

const Main = ({ initialValues }: { initialValues: VirkningstidspunktFormValues }) => {
    const { control } = useFormContext<VirkningstidspunktFormValues>();
    const { onNavigateToTab } = useBehandlingProvider();
    const [searchParams] = useSearchParams();
    const roller = useFieldArray({
        control,
        name: "roller",
    });
    const watchFieldArray = useWatch({ control, name: "roller" });
    const controlledFields = roller.fields.map((field, index) => ({
        ...field,
        ...watchFieldArray?.[index],
    }));

    const defaultTab = useMemo(() => {
        const rolleId = controlledFields
            .find(({ rolle }) => rolle.id?.toString() === searchParams.get(urlSearchParams.tab))
            ?.rolle?.id?.toString();
        return rolleId ?? controlledFields[0].rolle.id?.toString();
    }, []);
    const selectedTab = searchParams.get(urlSearchParams.tab) ?? defaultTab;

    if (controlledFields.length > 1) {
        return (
            <Tabs
                defaultValue={defaultTab}
                value={selectedTab}
                onChange={onNavigateToTab}
                className="ax-lg:max-w-saksbehandling-inner ax-md:max-w-saksbehandling-inner-md ax-sm:max-w-saksbehandling-inner-sm w-full"
            >
                <Tabs.List>
                    {controlledFields.map(({ rolle }) => (
                        <Tabs.Tab
                            key={rolle.id}
                            value={rolle.id.toString()}
                            className="[&>*:first-child]:w-max p-2.5"
                            label={
                                <PersonNavnIdent ident={rolle.ident} rolle={tilRolleType(rolle.rolletype)} skjulNavn />
                            }
                        />
                    ))}
                </Tabs.List>
                {controlledFields.map((item, index) => {
                    return (
                        <Tabs.Panel key={item.rolle.id} value={item.rolle.id.toString()} className="grid gap-y-4 py-4">
                            <VirkningstidspunktRolle
                                item={item}
                                rolleIndex={index}
                                initialValues={initialValues.roller[index]}
                            />
                        </Tabs.Panel>
                    );
                })}
            </Tabs>
        );
    }

    return (
        <div className="grid gap-y-4 py-4">
            <VirkningstidspunktRolle
                key={controlledFields[0].id}
                item={controlledFields[0]}
                rolleIndex={0}
                initialValues={initialValues.roller[0]}
            />
        </div>
    );
};

const Side = () => {
    const { onStepChange, getNextStep } = useBehandlingProvider();
    const { erBisysVedtak, virkningstidspunktV3: virkningstidspunkt, vedtakstype } = useGetBehandlingV2();
    const saveBegrunnelseMutation = useOnSaveVirkningstidspunktBegrunnelse();
    const { getValues, watch, setError, clearErrors } = useFormContext<VirkningstidspunktFormValues>();
    const [activeTab] = useGetActiveAndDefaultVirkningstidspunktTab();
    const fieldIndex = getValues("roller").findIndex(({ rolle }) => rolle.id?.toString() === activeTab);
    const values = getValues(`roller.${fieldIndex}`);
    const begrunnelseFraOpprinneligVedtak = virkningstidspunkt.barn.find(
        ({ rolle }) => rolle.id === values.rolle.id,
    ).begrunnelseFraOpprinneligVedtak;
    const barnVirkning = virkningstidspunkt.barn.find(({ rolle }) => rolle.id === values.rolle.id);

    const onNext = () => onStepChange(getNextStep(ForskuddStepper.VIRKNINGSTIDSPUNKT));

    const erAldersjusteringsVedtakstype = vedtakstype === Vedtakstype.ALDERSJUSTERING;

    const onSave = useCallback(
        async (name: string, payload: OppdatereVirkningstidspunktBegrunnelseDto) => {
            try {
                await saveBegrunnelseMutation.mutation.mutateAsync({ triggeredBy: name, ...payload });
            } catch {
                // Error state is handled by mutation observers and validation updates.
            }
        },
        [saveBegrunnelseMutation],
    );

    const debouncedOnSave = useDebounce(onSave);

    useEffect(() => {
        const subscription = watch((value, { name, type }) => {
            if (name === `roller.${fieldIndex}.begrunnelse` && type === "change") {
                const currentRolleValues = value.roller[fieldIndex];
                const payload: OppdatereVirkningstidspunktBegrunnelseDto = {
                    rolleId: currentRolleValues.rolle.id,
                    oppdatereBegrunnelse: {
                        nyBegrunnelse: currentRolleValues.begrunnelse,
                        rolleid: currentRolleValues.rolle.id,
                    },
                };
                debouncedOnSave(name, payload);
            }
        });
        return () => subscription.unsubscribe();
    }, [watch, fieldIndex, debouncedOnSave]);

    function updateBegrunnelseError(virkningRolle: VirkningstidspunktBarnDtoV2) {
        const validerignsfeil = virkningRolle?.valideringsfeilV2 ?? virkningRolle?.valideringsfeil;
        if (validerignsfeil?.manglerBegrunnelse) {
            setError(`roller.${fieldIndex}.begrunnelse`, {
                type: "notValid",
                message: text.error.feltErPåkrevd,
            });
        } else {
            clearErrors(`roller.${fieldIndex}.begrunnelse`);
        }
    }

    useEffect(() => {
        updateBegrunnelseError(barnVirkning);
    }, [barnVirkning]);

    return (
        <>
            {!erBisysVedtak && !erAldersjusteringsVedtakstype && (
                <FormControlledCustomTextareaEditor
                    name={`roller.${fieldIndex}.begrunnelse`}
                    label={text.title.begrunnelse}
                    mutationState={saveBegrunnelseMutation.mutation.status}
                    resize
                />
            )}
            {!erBisysVedtak && !erAldersjusteringsVedtakstype && begrunnelseFraOpprinneligVedtak?.innhold && (
                <CustomTextareaEditor
                    name={`roller.${fieldIndex}.begrunnelseFraOpprinneligVedtak`}
                    label={text.label.begrunnelseFraOpprinneligVedtak}
                    value={begrunnelseFraOpprinneligVedtak.innhold}
                    resize
                    readOnly
                />
            )}
            <ActionButtons onNext={onNext} />
        </>
    );
};

const VirkningstidspunktForm = () => {
    const { virkningstidspunktV3: virkningstidspunkt } = useGetBehandlingV2();
    const { setPageErrorsOrUnsavedState } = useBehandlingProvider();
    const initialValues = useMemo(() => createInitialValues(virkningstidspunkt), [virkningstidspunkt]);

    const useFormMethods = useForm({
        defaultValues: initialValues,
    });

    useEffect(() => {
        const hasSignificantErrors = () => {
            const errors = useFormMethods.formState.errors;

            for (const [key, value] of Object.entries(errors)) {
                if (key === "roller" && Array.isArray(value)) {
                    const rollerErrors = value as unknown[];
                    const hasNonBegrunnelseError = rollerErrors.some(
                        (rollerError) =>
                            rollerError && Object.keys(rollerError).some((field) => field !== "begrunnelse"),
                    );
                    if (hasNonBegrunnelseError) return true;
                } else {
                    if (value) return true;
                }
            }
            return false;
        };

        setPageErrorsOrUnsavedState((prevState) => ({
            ...prevState,
            virkningstidspunkt: {
                error: hasSignificantErrors(),
            },
        }));
    }, [JSON.stringify(useFormMethods.formState.errors)]);

    return (
        <>
            <FormProvider {...useFormMethods}>
                <form onSubmit={(e) => e.preventDefault()}>
                    <NewFormLayout
                        title={text.label.virkningstidspunkt}
                        main={<Main initialValues={initialValues} />}
                        side={<Side />}
                    />
                </form>
            </FormProvider>
        </>
    );
};

export default () => {
    return (
        <QueryErrorWrapper>
            <VirkningstidspunktForm />
        </QueryErrorWrapper>
    );
};
