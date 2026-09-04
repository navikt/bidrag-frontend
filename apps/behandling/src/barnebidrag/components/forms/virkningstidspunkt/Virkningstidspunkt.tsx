import {
    BeregnTil,
    type EksisterendeOpphorsvedtakDto,
    type OppdatereVirkningstidspunkt,
    type OppdatereVirkningstidspunktBegrunnelseDto,
    Resultatkode,
    Rolletype,
    SoktAvType,
    Stonadstype,
    TypeArsakstype,
    Vedtakstype,
    type VirkningstidspunktBarnDtoV2,
    type VirkningstidspunktDtoV3,
} from "@bidrag/api/BidragBehandlingApiV1";
import { deductDays, toISODateString } from "@bidrag/common";
import { ExternalLinkIcon } from "@navikt/aksel-icons";
import {
    BodyShort,
    Box,
    Button,
    Heading,
    HStack,
    Label,
    Modal,
    Radio,
    RadioGroup,
    Switch,
    VStack,
} from "@navikt/ds-react";
import type React from "react";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormProvider, useFieldArray, useForm, useFormContext, useWatch } from "react-hook-form";
import { Link, useSearchParams } from "react-router";
import { ActionButtons } from "../../../../common/components/ActionButtons";
import { BehandlingAlert } from "../../../../common/components/BehandlingAlert";
import { CustomTextareaEditor } from "../../../../common/components/CustomEditor";
import { FormControlledCustomTextareaEditor } from "../../../../common/components/formFields/FormControlledCustomTextEditor";
import { FormControlledMonthPicker } from "../../../../common/components/formFields/FormControlledMonthPicker";
import { FormControlledSelectField } from "../../../../common/components/formFields/FormControlledSelectField";
import KlagetPåVedtakButton, { OpprinneligVedtakButton } from "../../../../common/components/KlagetPåVedtakButton";
import { FlexRow } from "../../../../common/components/layout/grid/FlexRow";
import { NewFormLayout } from "../../../../common/components/layout/grid/NewFormLayout";
import { ConfirmationModal } from "../../../../common/components/modal/ConfirmationModal";
import { QueryErrorWrapper } from "../../../../common/components/query-error-boundary/QueryErrorWrapper";
import Tabs from "../../../../common/components/wrappingtabs/WrappingTabs";
import urlSearchParams from "../../../../common/constants/behandlingQueryKeys";
import { SOKNAD_LABELS } from "../../../../common/constants/soknadFraLabels";
import text from "../../../../common/constants/texts";
import { useBehandlingProvider } from "../../../../common/context/BehandlingContext";
import {
    getFirstDayOfMonthAfterEighteenYears,
    isOver18YearsOld,
} from "../../../../common/helpers/boforholdFormHelpers";
import { aarsakToVirkningstidspunktMapper } from "../../../../common/helpers/virkningstidspunktHelpers";
import { useGetBehandlingV2, useRefetchOnlyFFInfoFn } from "../../../../common/hooks/useApiData";
import { useDebounce } from "../../../../common/hooks/useDebounce";
import { useFieldMutationStatus } from "../../../../common/hooks/useFieldMutationStatus";
import { useFomTomDato } from "../../../../common/hooks/useFomTomDato";
import { useOnSaveVirkningstidspunktBegrunnelse } from "../../../../common/hooks/useOnSaveVirkningstidspunktBegrunnelse";
import { usePageTabs } from "../../../../common/hooks/usePageTabs";
import { useQueryParams } from "../../../../common/hooks/useQueryParams";
import { hentVisningsnavn, hentVisningsnavnVedtakstype } from "../../../../common/hooks/useVisningsnavn";
import {
    OpphørsVarighet,
    type VirkningstidspunktFormValues,
    type VirkningstidspunktFormValuesPerBarn,
} from "../../../../common/types/virkningstidspunktFormValues";
import { addMonths, DateToDDMMYYYYString, dateOrNull, deductMonths } from "../../../../utils/date-utils";
import { removePlaceholder } from "../../../../utils/string-utils";
import { BarnebidragStepper } from "../../../enum/BarnebidragStepper";
import { useGetActiveAndDefaultVirkningstidspunktTab } from "../../../hooks/useGetActiveAndDefaultVirkningstidspunktTab";
import { useOnMergeVirkningtidspunkt } from "../../../hooks/useOnMergeVirkningtidspunkt";
import { useOnSaveVirkningstidspunkt } from "../../../hooks/useOnSaveVirkningstidspunkt";
import { useOnUpdateBeregnTilDato } from "../../../hooks/useOnUpdateBeregnTilDato";
import { useOnUpdateOpphørsdato } from "../../../hooks/useOnUpdateOpphørsdato";
import PersonIdentSak from "../../PersonIdentSak";
import { VedtaksListeVirkningstidspunkt } from "../../Vedtakliste";
import { BegrunnelseSidemeny } from "../BegrunnelseSidemeny";

const årsakListe = [
    TypeArsakstype.FRABARNETSFODSEL,
    TypeArsakstype.FRABARNETSFLYTTEMANED,
    TypeArsakstype.FRA_SAMLIVSBRUDD,
    TypeArsakstype.FRASOKNADSTIDSPUNKT,
    TypeArsakstype.TREARSREGELEN,
    TypeArsakstype.FRA_KRAVFREMSETTELSE,
    TypeArsakstype.FRAMANEDENETTERPRIVATAVTALE,
    TypeArsakstype.BIDRAGSPLIKTIGHARIKKEBIDRATTTILFORSORGELSE,
];
const årsakListe18årsBidrag = [
    TypeArsakstype.FRAMANEDENETTERFYLTE18AR,
    TypeArsakstype.FRABARNETSFLYTTEMANED,
    TypeArsakstype.FRA_SAMLIVSBRUDD,
    TypeArsakstype.FRASOKNADSTIDSPUNKT,
    TypeArsakstype.TREARSREGELEN,
    TypeArsakstype.FRA_KRAVFREMSETTELSE,
    TypeArsakstype.FRAMANEDENETTERPRIVATAVTALE,
    TypeArsakstype.BIDRAGSPLIKTIGHARIKKEBIDRATTTILFORSORGELSE,
];
const harLøpendeBidragÅrsakListe = [
    TypeArsakstype.MANEDETTERBETALTFORFALTBIDRAG,
    TypeArsakstype.FRA_ENDRINGSTIDSPUNKT,
    TypeArsakstype.FRASOKNADSTIDSPUNKT,
    TypeArsakstype.FRA_KRAVFREMSETTELSE,
];
const avslagsListe = [Resultatkode.IKKE_OMSORG_FOR_BARNET, Resultatkode.BIDRAGSPLIKTIGERDOD];
const avslagsListe18År = [Resultatkode.IKKE_DOKUMENTERT_SKOLEGANG, Resultatkode.BIDRAGSPLIKTIGERDOD];
const avslagsListe18ÅrOpphør = [
    Resultatkode.AVSLUTTET_SKOLEGANG,
    Resultatkode.BIDRAGSPLIKTIGERDOD,
    Resultatkode.AVSLAG_PRIVAT_AVTALE_BIDRAG,
    Resultatkode.BARNETERDODT,
];
const avvisningslisteListe18ÅrOpphør = [
    Resultatkode.IKKESTERKNOKGRUNNOGBIDRAGETHAROPPHORT,
    Resultatkode.BIDRAGSMOTTAKER_HAR_OMSORG_FOR_BARNET,
];
const avslagsListeOpphør = [
    Resultatkode.IKKE_OMSORG_FOR_BARNET,
    Resultatkode.BIDRAGSPLIKTIGERDOD,
    Resultatkode.BARNETERDODT,
    Resultatkode.PARTENE_BOR_SAMMEN,
    Resultatkode.AVSLAG_PRIVAT_AVTALE_BIDRAG,
];
const avslagsListeOpphørBidragspliktigErDød = [Resultatkode.BIDRAGSPLIKTIGERDOD];
export const avvisningsListeOpphør = [
    Resultatkode.IKKESTERKNOKGRUNNOGBIDRAGETHAROPPHORT,
    Resultatkode.BIDRAGSMOTTAKER_HAR_OMSORG_FOR_BARNET,
];

export const avvisningsListe = [Resultatkode.IKKESTERKNOKGRUNNOGBIDRAGETHAROPPHORT];

const avslaglisteAlle = Array.from(
    new Set([...avslagsListe, ...avslagsListe18År, ...avslagsListe18ÅrOpphør, ...avslagsListeOpphør]),
);
const årsakslisteAlle = Array.from(new Set([...årsakListe, ...årsakListe18årsBidrag, ...harLøpendeBidragÅrsakListe]));
const avslagsListeDeprekert = [Resultatkode.IKKESOKTOMINNKREVINGAVBIDRAG];

const getDefaultOpphørsvarighet = (opphørsdato: string, eksisterendeOpphør: string, stønadstype: Stonadstype) => {
    const opphørsdatoSameAsEkisterende = opphørsdato && opphørsdato === eksisterendeOpphør;
    const varighet = opphørsdatoSameAsEkisterende ? OpphørsVarighet.FORTSETTE_OPPHØR : OpphørsVarighet.VELG_OPPHØRSDATO;

    if (stønadstype === Stonadstype.BIDRAG18AAR) {
        return varighet;
    }
    if (!opphørsdato) {
        return OpphørsVarighet.LØPENDE;
    }
    return varighet;
};

const createInitialValues = (
    input: VirkningstidspunktDtoV3,
    stønadstypeInput: Stonadstype,
    vedtakstype: Vedtakstype,
): VirkningstidspunktFormValues => {
    const response = input.barn;
    return {
        beregnTil: input.beregnTil,
        roller: response.map((virkningstidspunkt) => {
            const stønadstype = virkningstidspunkt.rolle.stønadstype ?? stønadstypeInput;
            const opphørsvarighet = getDefaultOpphørsvarighet(
                virkningstidspunkt?.opphørsdato,
                virkningstidspunkt?.eksisterendeOpphør?.opphørsdato,
                stønadstype,
            );

            let initalValues: VirkningstidspunktFormValuesPerBarn = {
                opphørsvarighet,
                rolle: virkningstidspunkt.rolle,
                virkningstidspunkt: virkningstidspunkt.virkningstidspunkt,
                årsakAvslag: virkningstidspunkt.årsak ?? virkningstidspunkt.avslag ?? "",
                begrunnelse: virkningstidspunkt.begrunnelse?.innhold ?? "",
                opphørsdato: virkningstidspunkt.opphørsdato ?? null,
                beregnTil: virkningstidspunkt.beregnTil ?? null,
                beregnTilDato: virkningstidspunkt.beregnTilDato ?? null,
                stønadstype: stønadstype,
            };

            if (stønadstype === Stonadstype.BIDRAG18AAR && vedtakstype !== Vedtakstype.OPPHOR) {
                initalValues = {
                    ...initalValues,
                    begrunnelseVurderingAvSkolegang: virkningstidspunkt.begrunnelseVurderingAvSkolegang?.innhold ?? "",
                    kanSkriveVurderingAvSkolegang: virkningstidspunkt.kanSkriveVurderingAvSkolegang,
                };
            }

            return initalValues;
        }),
    };
};

const createPayload = (values: VirkningstidspunktFormValuesPerBarn, rolleId?: number): OppdatereVirkningstidspunkt => {
    const årsak = [...årsakListe, ...årsakListe18årsBidrag, ...harLøpendeBidragÅrsakListe].find(
        (value) => value === values.årsakAvslag,
    );
    const avslag = [
        ...avslagsListe,
        ...avslagsListe18År,
        ...avslagsListe18ÅrOpphør,
        ...avslagsListeOpphør,
        ...avvisningsListeOpphør,
        ...avvisningslisteListe18ÅrOpphør,
    ].find((value) => value === values.årsakAvslag);

    let payload: OppdatereVirkningstidspunkt = {
        rolleId,
        virkningstidspunkt: values.virkningstidspunkt,
        årsak,
        avslag,
        oppdatereBegrunnelse: {
            nyBegrunnelse: values.begrunnelse,
        },
    };

    if (values.begrunnelseVurderingAvSkolegang !== undefined && values.kanSkriveVurderingAvSkolegang) {
        payload = {
            ...payload,
            oppdaterBegrunnelseVurderingAvSkolegang: {
                nyBegrunnelse: values.begrunnelseVurderingAvSkolegang,
            },
        };
    }

    return payload;
};

const getOpphørOptions = (
    eksisterendeOpphør: EksisterendeOpphorsvedtakDto,
    stønadstype: Stonadstype,
    fødselsdato: string,
    currentVarighet: OpphørsVarighet,
) => {
    let options: OpphørsVarighet[];
    if (
        stønadstype === Stonadstype.BIDRAG18AAR ||
        (stønadstype === Stonadstype.BIDRAG && isOver18YearsOld(fødselsdato))
    ) {
        if (eksisterendeOpphør) {
            options = [OpphørsVarighet.VELG_OPPHØRSDATO, OpphørsVarighet.FORTSETTE_OPPHØR];
        } else {
            options = [OpphørsVarighet.VELG_OPPHØRSDATO];
        }
    } else {
        if (eksisterendeOpphør) {
            options = [OpphørsVarighet.LØPENDE, OpphørsVarighet.VELG_OPPHØRSDATO, OpphørsVarighet.FORTSETTE_OPPHØR];
        } else {
            options = [OpphørsVarighet.LØPENDE, OpphørsVarighet.VELG_OPPHØRSDATO];
        }
    }

    if (currentVarighet && !options.includes(currentVarighet)) {
        options.push(currentVarighet);
    }

    return options;
};

const Beregningsperiode = ({ barnIndex }: { barnIndex: number }) => {
    const { getValues } = useFormContext<VirkningstidspunktFormValues>();
    const [virkningstidspunkt, beregnTilDato] = getValues([
        `roller.${barnIndex}.virkningstidspunkt`,
        `roller.${barnIndex}.beregnTilDato`,
    ]);
    const [flash, setFlash] = useState(false);
    const prevValues = useRef([virkningstidspunkt, beregnTilDato]);

    useEffect(() => {
        if (prevValues.current[0] !== virkningstidspunkt || prevValues.current[1] !== beregnTilDato) {
            setFlash(true);
            prevValues.current = [virkningstidspunkt, beregnTilDato];
            const timeout = setTimeout(() => setFlash(false), 800);
            return () => clearTimeout(timeout);
        }
    }, [virkningstidspunkt, beregnTilDato]);

    return (
        <VStack className="mt-4">
            <Label spacing size="small">
                Beregningsperiode
            </Label>
            <Box
                background="default"
                padding="space-8"
                borderRadius="4"
                borderColor="neutral-subtle"
                borderWidth="1"
                className={`w-max border-ax-neutral-600 transition-all duration-700${flash ? " border-ax-success-600 ring-2 ring-ax-success-400" : ""}`}
            >
                <BodyShort size="small">
                    <HStack gap="space-2">
                        <div>{DateToDDMMYYYYString(dateOrNull(virkningstidspunkt))}</div>
                        <div> -</div>
                        <div>{DateToDDMMYYYYString(deductDays(dateOrNull(beregnTilDato), 1))}</div>
                    </HStack>
                </BodyShort>
            </Box>
        </VStack>
    );
};

const Opphør = ({
    item,
    barnIndex,
    initialValues,
    previousValues,
    setPreviousValues,
}: {
    item: VirkningstidspunktFormValuesPerBarn;
    barnIndex: number;
    initialValues: VirkningstidspunktFormValuesPerBarn;
    previousValues: VirkningstidspunktFormValuesPerBarn;
    setPreviousValues: React.Dispatch<React.SetStateAction<VirkningstidspunktFormValuesPerBarn>>;
}) => {
    const behandling = useGetBehandlingV2();
    const selectedBarnsVirkningstidspunkt = behandling.virkningstidspunktV3.barn.find(
        ({ rolle }) => rolle.id === item.rolle.id,
    );
    const stønadstype = item.rolle.stønadstype ?? behandling.stønadstype;
    const {
        setSaveErrorState,
        lesemodus,
        vurderSeparatVirkningstidspunkt: vurderSeparat,
        setVurderSeparatSamværForSaker,
    } = useBehandlingProvider();
    const oppdaterOpphørsdato = useOnUpdateOpphørsdato();
    const { getValues, reset, setValue } = useFormContext();
    const [opphørsvarighet, setOpphørsvarighet] = useState(getValues(`roller.${barnIndex}.opphørsvarighet`));
    const opphørsvarighetIsLøpende = opphørsvarighet === OpphørsVarighet.LØPENDE;
    const opphørsvarighetIsFortsetteOpphør = opphørsvarighet === OpphørsVarighet.FORTSETTE_OPPHØR;
    const fom = useMemo(() => {
        if (item.rolle.erRevurdering) {
            return addMonths(dateOrNull(behandling.virkningstidspunktV3.eldsteVirkningstidspunkt), 1);
        }
        return addMonths(dateOrNull(initialValues.virkningstidspunkt), 1);
    }, [item, initialValues, behandling.virkningstidspunktV3.eldsteVirkningstidspunkt]);
    const valideringsfeilForBarn =
        selectedBarnsVirkningstidspunkt.valideringsfeil?.kanIkkeSetteOpphørsdatoEtterEtterfølgendeVedtak?.find(
            (p) => p.id === item.rolle.id,
        );
    const tom = useMemo(() => {
        if (
            selectedBarnsVirkningstidspunkt.etterfølgendeVedtak != null &&
            selectedBarnsVirkningstidspunkt.beregnTil !== BeregnTil.INNEVAeRENDEMANED
        ) {
            return dateOrNull(selectedBarnsVirkningstidspunkt.etterfølgendeVedtak.virkningstidspunkt);
        }
        if (stønadstype === Stonadstype.BIDRAG)
            return getFirstDayOfMonthAfterEighteenYears(new Date(item.rolle.fødselsdato));
        return addMonths(new Date(), 50 * 12);
    }, [selectedBarnsVirkningstidspunkt]);

    const updateOpphørsdato = () => {
        const values = getValues(`roller.${barnIndex}`);
        oppdaterOpphørsdato.mutation.mutate(
            {
                idRolle: vurderSeparat ? selectedBarnsVirkningstidspunkt.rolle.id : null,
                opphørsdato: values.opphørsdato,
                simulerEndring: false,
            },
            {
                onSuccess: (response) => {
                    oppdaterOpphørsdato.queryClientUpdater((currentData) => {
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
                                        begrunnelseVurderingAvSkolegang: currentBarn?.begrunnelseVurderingAvSkolegang,
                                    };
                                }),
                            },
                        };
                    });
                    setVurderSeparatSamværForSaker(response.samværV2.erSammeForAlleSaker);

                    const updatedValues = createInitialValues(
                        response.virkningstidspunktV3,
                        response.stønadstype,
                        response.vedtakstype,
                    );
                    const updatedBarn = Object.values(updatedValues.roller).find(
                        ({ rolle }) => rolle.id === selectedBarnsVirkningstidspunkt.rolle.id,
                    );
                    setValue(`roller.${barnIndex}.beregnTilDato`, updatedBarn.beregnTilDato);

                    setPreviousValues(updatedBarn);
                },
                onError: () => {
                    setSaveErrorState({
                        error: true,
                        retryFn: () => updateOpphørsdato(),
                        rollbackFn: () => {
                            reset(previousValues, {
                                keepIsSubmitSuccessful: true,
                                keepDirty: true,
                                keepIsSubmitted: true,
                            });
                        },
                    });
                },
            },
        );
    };

    const onMonthChange = (date) => {
        const currentDate = getValues(`roller.${barnIndex}.opphørsdato`);
        if (date && date !== currentDate) {
            setValue(`roller.${barnIndex}.opphørsdato`, date);
            updateOpphørsdato();
        }
    };

    const onSelectVarighet = (value) => {
        setOpphørsvarighet(value);
        if (value === OpphørsVarighet.LØPENDE) {
            setValue(`roller.${barnIndex}.opphørsdato`, null);
            updateOpphørsdato();
        } else if (value === OpphørsVarighet.FORTSETTE_OPPHØR) {
            setValue(
                `roller.${barnIndex}.opphørsdato`,
                selectedBarnsVirkningstidspunkt.eksisterendeOpphør?.opphørsdato || null,
            );
            updateOpphørsdato();
        }
    };

    const renderBidragOpphørtAlert = () => {
        if (!lesemodus && selectedBarnsVirkningstidspunkt.eksisterendeOpphør?.opphørsdato) {
            return (
                <BehandlingAlert variant="info" className="!w-[520px] mt-4 mb-2">
                    <BodyShort>
                        {removePlaceholder(
                            text.alert.bidragOpphørt,
                            DateToDDMMYYYYString(
                                dateOrNull(selectedBarnsVirkningstidspunkt.eksisterendeOpphør?.opphørsdato),
                            ),
                            DateToDDMMYYYYString(
                                dateOrNull(selectedBarnsVirkningstidspunkt.eksisterendeOpphør?.vedtaksdato),
                            ),
                        )}
                    </BodyShort>
                </BehandlingAlert>
            );
        }
        return null;
    };

    if (selectedBarnsVirkningstidspunkt.avslag != null) return renderBidragOpphørtAlert();
    return (
        <>
            {renderBidragOpphørtAlert()}
            {valideringsfeilForBarn && !lesemodus && (
                <BehandlingAlert variant="warning" className="!w-[520px]">
                    <Heading spacing size="xsmall" level="3">
                        Ugyldig opphørsdato
                    </Heading>
                    <BodyShort size="small">
                        Kan ikke sette opphørsdato etter virkningstidspunkt til etterfølgende vedtak
                    </BodyShort>
                </BehandlingAlert>
            )}
            <FlexRow className="gap-x-8">
                {selectedBarnsVirkningstidspunkt.kanEndreVirkningstidspunktOpphør !== false && (
                    <FormControlledSelectField
                        name={`roller.${barnIndex}.opphørsvarighet`}
                        label={text.label.varighet}
                        className="w-max"
                        onSelect={(value) => onSelectVarighet(value)}
                    >
                        {getOpphørOptions(
                            selectedBarnsVirkningstidspunkt.eksisterendeOpphør,
                            stønadstype,
                            selectedBarnsVirkningstidspunkt.rolle.fødselsdato,
                            getValues(`roller.${barnIndex}.opphørsvarighet`),
                        ).map((value) => (
                            <option key={value} value={value}>
                                {value}
                            </option>
                        ))}
                    </FormControlledSelectField>
                )}
                {!opphørsvarighetIsLøpende && (
                    <FormControlledMonthPicker
                        name={`roller.${barnIndex}.opphørsdato`}
                        onChange={(date) => onMonthChange(date)}
                        label={text.label.opphørsdato}
                        defaultValue={initialValues.virkningstidspunkt}
                        placeholder="DD.MM.ÅÅÅÅ"
                        fromDate={fom}
                        toDate={tom}
                        readonly={
                            lesemodus ||
                            selectedBarnsVirkningstidspunkt.kanEndreVirkningstidspunktOpphør === false ||
                            opphørsvarighetIsFortsetteOpphør
                        }
                        required
                    />
                )}
            </FlexRow>
        </>
    );
};

const Side = () => {
    const { onStepChange, getNextStep, vurderSeparatVirkningstidspunkt, selectedSaksnummer } = useBehandlingProvider();
    const { erBisysVedtak, virkningstidspunktV3: virkningstidspunkt, vedtakstype, roller } = useGetBehandlingV2();
    const harFlereSaksnummer = new Set(roller.map((rolle) => rolle.saksnummer).filter(Boolean)).size > 1;
    const saveBegrunnelseMutation = useOnSaveVirkningstidspunktBegrunnelse();
    const { getValues, watch, setError, clearErrors } = useFormContext<VirkningstidspunktFormValues>();
    const [activeTab] = useGetActiveAndDefaultVirkningstidspunktTab();
    const fieldIndex = getValues("roller")?.findIndex(({ rolle }) => rolle?.id?.toString() === activeTab) ?? 0;
    const values = getValues(`roller.${fieldIndex}`);
    const begrunnelseFraOpprinneligVedtak = virkningstidspunkt?.barn?.find(
        ({ rolle }) => rolle.id === values?.rolle?.id,
    )?.begrunnelseFraOpprinneligVedtak;
    const barnVirkning = virkningstidspunkt?.barn?.find(({ rolle }) => rolle.id === values?.rolle?.id);
    const erAldersjusteringsVedtakstype = vedtakstype === Vedtakstype.ALDERSJUSTERING;
    const begrunnelseMutationStatus = useFieldMutationStatus(
        saveBegrunnelseMutation.mutation,
        `roller.${fieldIndex}.begrunnelse`,
    );
    const begrunnelseVurderingAvSkolegangMutationStatus = useFieldMutationStatus(
        saveBegrunnelseMutation.mutation,
        `roller.${fieldIndex}.begrunnelseVurderingAvSkolegang`,
    );

    const createBegrunnelsePayload = (currentValues: VirkningstidspunktFormValuesPerBarn) => {
        let payload: OppdatereVirkningstidspunktBegrunnelseDto = {
            rolleId: vurderSeparatVirkningstidspunkt ? currentValues.rolle.id : undefined,
            saksnummer: harFlereSaksnummer ? selectedSaksnummer : undefined,
            oppdatereBegrunnelse: {
                nyBegrunnelse: currentValues.begrunnelse,
                rolleid: currentValues.rolle.id,
            },
        };
        if (
            currentValues.begrunnelseVurderingAvSkolegang !== undefined &&
            currentValues.kanSkriveVurderingAvSkolegang
        ) {
            payload = {
                ...payload,
                rolleId: currentValues.rolle.id,
                oppdaterBegrunnelseVurderingAvSkolegang: {
                    nyBegrunnelse: values.begrunnelseVurderingAvSkolegang,
                    rolleid: currentValues.rolle.id,
                },
            };
        }
        return payload;
    };

    const onSave = useCallback(
        async (fieldName: string, currentValues: VirkningstidspunktFormValuesPerBarn) => {
            try {
                await saveBegrunnelseMutation.mutation.mutateAsync({
                    triggeredBy: fieldName,
                    ...createBegrunnelsePayload(currentValues),
                });
            } catch {
                // @ts-expect-error
                setError(fieldName as unknown as string, {
                    type: "notValid",
                    message: "Det skjedde en feil ved lagring. Prøv igjen senere.",
                });
            }
        },
        [saveBegrunnelseMutation, setError],
    );

    const debouncedOnSave = useDebounce(onSave);

    useEffect(() => {
        const subscription = watch((value, { name, type }) => {
            if (
                [`roller.${fieldIndex}.begrunnelse`, `roller.${fieldIndex}.begrunnelseVurderingAvSkolegang`].includes(
                    name,
                ) &&
                type === "change"
            ) {
                const currentRolleValues = value.roller[fieldIndex];
                debouncedOnSave(name, currentRolleValues);
            }
        });
        return () => subscription.unsubscribe();
    }, [watch, fieldIndex, debouncedOnSave]);

    function updateBegrunnelseError(virkningRolle: VirkningstidspunktBarnDtoV2) {
        if (virkningRolle?.valideringsfeilV2?.manglerBegrunnelse) {
            setError(`roller.${fieldIndex}.begrunnelse`, {
                type: "notValid",
                message: text.error.feltErPåkrevd,
            });
        } else {
            clearErrors(`roller.${fieldIndex}.begrunnelse`);
        }
        if (virkningRolle?.valideringsfeilV2?.manglerVurderingAvSkolegang) {
            setError(`roller.${fieldIndex}.begrunnelseVurderingAvSkolegang`, {
                type: "notValid",
                message: text.error.feltErPåkrevd,
            });
        } else {
            clearErrors(`roller.${fieldIndex}.begrunnelseVurderingAvSkolegang`);
        }
        if (virkningRolle?.valideringsfeilV2?.manglerOpphørsdato) {
            setError(`roller.${fieldIndex}.opphørsdato`, {
                type: "notValid",
                message: text.error.feltErPåkrevd,
            });
        } else {
            clearErrors(`roller.${fieldIndex}.opphørsdato`);
        }
    }

    useEffect(() => {
        updateBegrunnelseError(barnVirkning);
    }, [barnVirkning]);

    return (
        <Fragment key={activeTab}>
            {!erBisysVedtak && !erAldersjusteringsVedtakstype && (
                <BegrunnelseSidemeny
                    name={`roller.${fieldIndex}.begrunnelse`}
                    label={text.title.begrunnelse}
                    mutationState={begrunnelseMutationStatus}
                    resize
                />
            )}
            {!erBisysVedtak && !erAldersjusteringsVedtakstype && begrunnelseFraOpprinneligVedtak?.innhold && (
                <CustomTextareaEditor
                    name={`roller.${fieldIndex}.begrunnelseFraOpprinneligVedtak`}
                    label={text.label.begrunnelseFraOpprinneligVedtak}
                    value={begrunnelseFraOpprinneligVedtak?.innhold}
                    mutationState={begrunnelseVurderingAvSkolegangMutationStatus}
                    resize
                    readOnly
                />
            )}
            <ActionButtons onNext={() => onStepChange(getNextStep(BarnebidragStepper.VIRKNINGSTIDSPUNKT))} />
        </Fragment>
    );
};

const VirkningstidspunktBarn = ({
    item,
    barnIndex,
    initialValues,
}: {
    item: VirkningstidspunktFormValuesPerBarn;
    barnIndex: number;
    initialValues: VirkningstidspunktFormValuesPerBarn;
}) => {
    const {
        lesemodus,
        setSaveErrorState,
        setVurderSeparatVirkningstidspunkt: setVurderSeparat,
        setVurderSeparatVirkningstidspunktForSaker,
        setVurderSeparatSamværForSaker,
        vurderSeparatVirkningstidspunkt: vurderSeparat,
    } = useBehandlingProvider();
    const behandling = useGetBehandlingV2();
    const { setValue, clearErrors, getValues, watch, reset } = useFormContext();
    const oppdaterBehandling = useOnSaveVirkningstidspunkt();
    const refreshFF = useRefetchOnlyFFInfoFn();
    const kunEtBarnIBehandlingen = behandling.virkningstidspunktV3.barn.length === 1;
    const selectedVirkningstidspunkt = behandling.virkningstidspunktV3.barn.find(
        ({ rolle }) => rolle.id === item.rolle.id,
    );
    const selectedRolle = behandling.roller.find(({ id }) => id === item.rolle.id);
    const vedtakstype = selectedVirkningstidspunkt.vedtakstype ?? behandling.vedtakstype;
    const søktAv = selectedVirkningstidspunkt.søktAv ?? behandling.søktAv;
    const søktFomDato = selectedVirkningstidspunkt.søktFomDato ?? behandling.søktFomDato;
    const stønadstype = item.rolle.stønadstype ?? behandling.stønadstype;
    const [previousValues, setPreviousValues] = useState<VirkningstidspunktFormValuesPerBarn>(initialValues);
    const [initialVirkningsdato, setInitialVirkningsdato] = useState(selectedVirkningstidspunkt.virkningstidspunkt);
    const [showChangedVirkningsDatoAlert, setShowChangedVirkningsDatoAlert] = useState(false);
    const [confirmationModal, setConfirmationModal] = useState<{
        open: boolean;
        previousÅrsakAvslag: string;
        currentÅrsakAvslag: string;
        title?: string;
        content?: string;
    }>({
        open: false,
        previousÅrsakAvslag: item.årsakAvslag,
        currentÅrsakAvslag: item.årsakAvslag,
    });
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
        (values: VirkningstidspunktFormValuesPerBarn) => {
            oppdaterBehandling.mutation.mutate(
                createPayload(values, vurderSeparat ? selectedVirkningstidspunkt.rolle.id : null),
                {
                    onSuccess: (response) => {
                        refreshFF();
                        oppdaterBehandling.queryClientUpdater((currentData) => {
                            setVurderSeparatVirkningstidspunktForSaker(
                                response.virkningstidspunktV3.erLikForAlleBasertPåSak,
                            );
                            setVurderSeparatSamværForSaker(response.samværV2.erSammeForAlleSaker);
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
                                            begrunnelseVurderingAvSkolegang:
                                                currentBarn?.begrunnelseVurderingAvSkolegang,
                                        };
                                    }),
                                },
                            };
                        });
                        const updatedValues = createInitialValues(
                            response.virkningstidspunktV3,
                            response.stønadstype,
                            response.vedtakstype,
                        );
                        const selectedBarn = Object.values(updatedValues.roller).find(
                            ({ rolle }) => rolle.id === selectedVirkningstidspunkt.rolle.id,
                        );
                        setValue("roller", updatedValues.roller);

                        setPreviousValues(selectedBarn);
                    },
                    onError: () => {
                        setSaveErrorState({
                            error: true,
                            retryFn: () => onSave(values),
                            rollbackFn: () => {
                                reset(previousValues, {
                                    keepIsSubmitSuccessful: true,
                                    keepDirty: true,
                                    keepIsSubmitted: true,
                                });
                            },
                        });
                    },
                },
            );
        },
        [
            oppdaterBehandling,
            setVurderSeparat,
            setVurderSeparatSamværForSaker,
            previousValues,
            setPreviousValues,
            reset,
            setValue,
        ],
    );

    useEffect(() => {
        const subscription = watch((value, { name, type }) => {
            if (
                (name === `roller.${barnIndex}.virkningstidspunkt` && !value.roller[barnIndex].virkningstidspunkt) ||
                [
                    `roller.${barnIndex}.begrunnelse`,
                    `roller.${barnIndex}.begrunnelseVurderingAvSkolegang`,
                    `roller.${barnIndex}.opphørsvarighet`,
                    `roller.${barnIndex}.opphørsdato`,
                    `roller.${barnIndex}.årsakAvslag`,
                ].includes(name) ||
                type === undefined
            ) {
                return;
            }
            const values = value.roller[barnIndex];
            onSave(values);
        });
        return () => subscription.unsubscribe();
    }, [watch, onSave]);

    const onAarsakSelect = (value: string, save?: boolean) => {
        setValue(`roller.${barnIndex}.årsakAvslag`, value);
        const søknadsbarnAlle = behandling.roller.filter((b) => b.rolletype === Rolletype.BA);
        const shouldConfirm = vurderSeparat && !save;
        const avslagEndretTilBidragspliktigErDød = value === Resultatkode.BIDRAGSPLIKTIGERDOD;
        const avslagEndretFraTilBidragspliktigErDød =
            previousValues.årsakAvslag === Resultatkode.BIDRAGSPLIKTIGERDOD || avslagEndretTilBidragspliktigErDød;

        if (shouldConfirm && avslagEndretFraTilBidragspliktigErDød && søknadsbarnAlle.length > 1) {
            const title = avslagEndretTilBidragspliktigErDød
                ? text.alert.endreAvslagsgrunnTilBidragspliktigErDød
                : text.alert.endreAvslagsgrunn;
            setConfirmationModal((prev) => ({
                ...prev,
                title,
                currentÅrsakAvslag: value,
                open: true,
                content: text.description.endreAvslagsgrunn,
            }));
            return;
        }

        const date = aarsakToVirkningstidspunktMapper(value, behandling, selectedVirkningstidspunkt);
        const virkningsdato = date ? toISODateString(date) : null;
        setValue(`roller.${barnIndex}.virkningstidspunkt`, virkningsdato);
        clearErrors(`roller.${barnIndex}.virkningstidspunkt`);
        setConfirmationModal((prev) => ({
            ...prev,
            open: false,
            currentÅrsakAvslag: value,
        }));

        const values = { ...getValues(`roller.${barnIndex}`), årsakAvslag: value, virkningstidspunkt: virkningsdato };
        onSave(values);
    };

    const erÅrsakAvslagIkkeValgt = getValues(`roller.${barnIndex}.årsakAvslag`) === "";

    const [fom] = useFomTomDato(false, new Date(søktFomDato));

    const tom = useMemo(() => {
        const etterfølgendeVedtak =
            selectedVirkningstidspunkt.etterfølgendeVedtak && behandling.erKlageEllerOmgjøring
                ? dateOrNull(selectedVirkningstidspunkt.etterfølgendeVedtak?.virkningstidspunkt)
                : null;
        const opphørsdato = dateOrNull(selectedVirkningstidspunkt.opphørsdato);
        if (opphørsdato) return deductMonths(opphørsdato, 1);
        if (etterfølgendeVedtak) return deductMonths(etterfølgendeVedtak, 1);

        if (stønadstype === Stonadstype.BIDRAG)
            return getFirstDayOfMonthAfterEighteenYears(new Date(item.rolle.fødselsdato));
        return addMonths(new Date(), 50 * 12);
    }, [selectedVirkningstidspunkt.opphørsdato]);

    const erInnkreving = vedtakstype === Vedtakstype.INNKREVING;
    const erSøktAVIkkeBM = søktAv !== SoktAvType.BIDRAGSMOTTAKER;
    const erTypeOpphør = vedtakstype === Vedtakstype.OPPHOR || behandling.opprinneligVedtakstype === Vedtakstype.OPPHOR;
    const erTypeOpphørOrLøpendeBidrag = erTypeOpphør || selectedVirkningstidspunkt.harLøpendeBidrag;
    const er18ÅrsBidrag = stønadstype === Stonadstype.BIDRAG18AAR;
    const virkningsårsaker = lesemodus
        ? årsakslisteAlle
        : er18ÅrsBidrag
          ? årsakListe18årsBidrag
          : selectedVirkningstidspunkt.harLøpendeBidrag
            ? harLøpendeBidragÅrsakListe
            : årsakListe;

    function renderConfirmationModal() {
        if (!confirmationModal.open) return null;
        return (
            <Modal
                aria-label="Bekreft endring av årsak"
                onClose={() => onAarsakSelect(confirmationModal.previousÅrsakAvslag)}
                open={confirmationModal != null}
            >
                <Modal.Header>{confirmationModal.title}</Modal.Header>
                <Modal.Body>
                    <BodyShort size="small">{confirmationModal.content}</BodyShort>
                </Modal.Body>
                <Modal.Footer>
                    <Button size="xsmall" onClick={() => onAarsakSelect(confirmationModal.currentÅrsakAvslag, true)}>
                        Fortsett
                    </Button>
                    <Button
                        variant="secondary"
                        size="xsmall"
                        onClick={() => onAarsakSelect(confirmationModal.previousÅrsakAvslag)}
                    >
                        Angre
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    }

    function renderAvslagsgrunner() {
        if (selectedVirkningstidspunkt.kanVelgeOpphør === false)
            return (
                // Kan velge bidragspliktig er død som avslagsgrunn mtp at det gjelder enten for alle eller ingen barn
                <optgroup label={erTypeOpphørOrLøpendeBidrag ? text.label.opphør : text.label.avslag}>
                    {avslagsListeOpphørBidragspliktigErDød.map((value) => (
                        <option key={value} value={value}>
                            {hentVisningsnavnVedtakstype(value, vedtakstype)}
                        </option>
                    ))}
                </optgroup>
            );
        if (!lesemodus && er18ÅrsBidrag) {
            return (
                <optgroup label={erTypeOpphørOrLøpendeBidrag ? text.label.opphør : text.label.avslag}>
                    {(erTypeOpphørOrLøpendeBidrag ? avslagsListe18ÅrOpphør : avslagsListe18År).map((value) => (
                        <option key={value} value={value}>
                            {hentVisningsnavnVedtakstype(value, vedtakstype)}
                        </option>
                    ))}
                </optgroup>
            );
        }
        const avslagslisteIkkeLesemodus = erTypeOpphørOrLøpendeBidrag ? avslagsListeOpphør : avslagsListe;
        const avslagsliste = lesemodus ? avslaglisteAlle : avslagslisteIkkeLesemodus;
        const harEksisterendeOpphør = selectedVirkningstidspunkt.eksisterendeOpphør != null;
        if (erTypeOpphørOrLøpendeBidrag) {
            return (
                <>
                    <optgroup label={text.label.opphør}>
                        {avslagsliste.map((value) => (
                            <option key={value} value={value}>
                                {hentVisningsnavnVedtakstype(value, vedtakstype)}
                            </option>
                        ))}
                        {avslagsListeDeprekert.includes(getValues(`roller.${barnIndex}.årsakAvslag`)) &&
                            avslagsListeDeprekert.map((value) => (
                                <option key={value} value={value} disabled>
                                    {hentVisningsnavnVedtakstype(value, vedtakstype)}
                                </option>
                            ))}
                    </optgroup>
                    {((erSøktAVIkkeBM && erTypeOpphør) || harEksisterendeOpphør) && (
                        <optgroup label={text.label.avslag}>
                            {(erSøktAVIkkeBM && erTypeOpphør ? avvisningsListeOpphør : avvisningsListe).map((value) => (
                                <option key={value} value={value}>
                                    {hentVisningsnavnVedtakstype(value, vedtakstype)}
                                </option>
                            ))}
                        </optgroup>
                    )}
                </>
            );
        }

        return (
            <optgroup label={erTypeOpphørOrLøpendeBidrag ? text.label.opphør : text.label.avslag}>
                {(lesemodus ? avslaglisteAlle : erTypeOpphørOrLøpendeBidrag ? avslagsListeOpphør : avslagsListe).map(
                    (value) => (
                        <option key={value} value={value}>
                            {hentVisningsnavnVedtakstype(value, vedtakstype)}
                        </option>
                    ),
                )}
                {avslagsListeDeprekert.includes(getValues(`roller.${barnIndex}.årsakAvslag`)) &&
                    avslagsListeDeprekert.map((value) => (
                        <option key={value} value={value} disabled>
                            {hentVisningsnavnVedtakstype(value, vedtakstype)}
                        </option>
                    ))}
                {(erSøktAVIkkeBM && erTypeOpphør ? avvisningsListeOpphør : avvisningsListe).map((value) => (
                    <option key={value} value={value}>
                        {hentVisningsnavnVedtakstype(value, vedtakstype)}
                    </option>
                ))}
            </optgroup>
        );
    }

    return (
        <div className="mt-4">
            {renderConfirmationModal()}
            <FlexRow className="grid grid-cols-4 grid-rows-2 gap-4">
                <div className="flex gap-x-2 w-max">
                    <Label size="small">{text.label.søknadstype}:</Label>
                    <BodyShort size="small">{`${hentVisningsnavn(vedtakstype)}${stønadstype === Stonadstype.BIDRAG18AAR ? " (18-år)" : ""}`}</BodyShort>
                    <KlagetPåVedtakButton />
                </div>
                <div className="flex gap-x-2">
                    <Label size="small">{text.label.søknadfra}:</Label>
                    <BodyShort size="small">{SOKNAD_LABELS[søktAv]}</BodyShort>
                </div>
                <div className="flex gap-x-2">
                    <Label size="small">{text.label.mottattdato}:</Label>
                    <BodyShort size="small">
                        {DateToDDMMYYYYString(
                            new Date(selectedVirkningstidspunkt.mottattdato ?? behandling.mottattdato),
                        )}
                    </BodyShort>
                </div>

                <div className="flex gap-x-2">
                    <Label size="small">{text.label.søktfradato}:</Label>
                    <BodyShort size="small">
                        {DateToDDMMYYYYString(
                            new Date(selectedVirkningstidspunkt.søktFomDato ?? behandling.søktFomDato),
                        )}
                    </BodyShort>
                </div>
                {behandling.erKlageEllerOmgjøring && selectedVirkningstidspunkt.opprinneligVedtakstidspunkt && (
                    <div className="flex gap-x-2">
                        <Label size="small">{text.label.opprinneligvedtakstidspunkt}:</Label>
                        <BodyShort size="small">
                            {DateToDDMMYYYYString(dateOrNull(selectedVirkningstidspunkt.opprinneligVedtakstidspunkt))}
                        </BodyShort>
                        <OpprinneligVedtakButton />
                    </div>
                )}
                {selectedVirkningstidspunkt.løpendeBidragPeriode && (
                    <div className="flex gap-x-2">
                        <Label size="small">{text.label.løperBidragFra}:</Label>
                        <BodyShort size="small">
                            {DateToDDMMYYYYString(new Date(selectedVirkningstidspunkt.løpendeBidragPeriode.fom))}
                        </BodyShort>
                    </div>
                )}
                {!selectedVirkningstidspunkt.medInnkreving && (
                    <div className="flex gap-x-2">
                        <Label size="small">{text.label.innkreving}:</Label>
                        <BodyShort size="small">{"Uten innkreving"}</BodyShort>
                    </div>
                )}
            </FlexRow>

            <FlexRow className="gap-x-8 pt-2 pb-2">
                {vedtakstype !== Vedtakstype.ALDERSJUSTERING && (
                    <FormControlledSelectField
                        name={`roller.${barnIndex}.årsakAvslag`}
                        label={text.label.årsak}
                        onSelect={onAarsakSelect}
                        disabled={selectedRolle.erRevurdering}
                        className="w-max"
                    >
                        {(lesemodus || selectedRolle.erRevurdering) && (
                            <option value={getValues(`roller.${barnIndex}.årsakAvslag`)}>
                                {hentVisningsnavnVedtakstype(getValues(`roller.${barnIndex}.årsakAvslag`), vedtakstype)}
                            </option>
                        )}
                        {!lesemodus && erÅrsakAvslagIkkeValgt && (
                            <option value="">{text.select.årsakAvslagPlaceholder}</option>
                        )}
                        {!lesemodus && !erTypeOpphør && (
                            <optgroup label={text.label.årsak}>
                                {virkningsårsaker
                                    .filter((value) => {
                                        if (kunEtBarnIBehandlingen) return true;
                                        return value !== TypeArsakstype.FRABARNETSFODSEL;
                                    })
                                    .map((value) => (
                                        <option key={value} value={value}>
                                            {hentVisningsnavnVedtakstype(value, vedtakstype)}
                                        </option>
                                    ))}
                            </optgroup>
                        )}

                        {renderAvslagsgrunner()}
                    </FormControlledSelectField>
                )}
                {!avvisningsListeOpphør.includes(selectedVirkningstidspunkt.avslag) && (
                        <HStack gap={"space-2"}>
                            <FormControlledMonthPicker
                                name={`roller.${barnIndex}.virkningstidspunkt`}
                                label={text.label.virkningstidspunkt}
                                placeholder="DD.MM.ÅÅÅÅ"
                                defaultValue={initialValues.virkningstidspunkt}
                                fromDate={fom}
                                toDate={tom}
                                readonly={lesemodus || vedtakstype === Vedtakstype.ALDERSJUSTERING || selectedVirkningstidspunkt.kanEndreVirkningstidspunkt === false}
                                required
                            />
                        </HStack>
                    )}
            </FlexRow>

            {showChangedVirkningsDatoAlert && !erInnkreving && (
                <BehandlingAlert variant="warning" className={"w-[488px]"}>
                    <div dangerouslySetInnerHTML={{ __html: text.alert.endretVirkningstidspunkt }}></div>
                </BehandlingAlert>
            )}

            <Opphør
                item={item}
                barnIndex={barnIndex}
                initialValues={initialValues}
                previousValues={previousValues}
                setPreviousValues={setPreviousValues}
            />

            {behandling.erKlageEllerOmgjøring && selectedVirkningstidspunkt.avslag == null && (
                <Beregningsperiode barnIndex={barnIndex} />
            )}

            {er18ÅrsBidrag && !erTypeOpphør && !(lesemodus && !item.kanSkriveVurderingAvSkolegang) && (
                <>
                    <FormControlledCustomTextareaEditor
                        name={`roller.${barnIndex}.begrunnelseVurderingAvSkolegang`}
                        label={text.title.begrunnelseVurderingAvSkolegang}
                        readOnly={!getValues(`roller.${barnIndex}.kanSkriveVurderingAvSkolegang`)}
                        resize
                    />
                    {selectedVirkningstidspunkt.begrunnelseVurderingAvSkolegangFraOpprinneligVedtak?.innhold && (
                        <CustomTextareaEditor
                            name={`roller.${barnIndex}.begrunnelseVurderingAvSkolegangFraOpprinneligVedtak`}
                            label={text.label.vurderingAvSkolegangOpprinneligVedtak}
                            value={
                                selectedVirkningstidspunkt.begrunnelseVurderingAvSkolegangFraOpprinneligVedtak.innhold
                            }
                            resize
                            readOnly
                        />
                    )}
                </>
            )}

            <VedtaksListeVirkningstidspunkt barnIdent={item.rolle.ident} omgjøring={false} />
        </div>
    );
};

const BeregnTilVelger = ({ initialValues }) => {
    const { lesemodus } = useBehandlingProvider();
    const { erKlageEllerOmgjøring, virkningstidspunktV3, saksnummer } = useGetBehandlingV2();
    const { setValue, getValues } = useFormContext<VirkningstidspunktFormValues>();
    const enhet = useQueryParams().get("enhet");
    const sessionState = useQueryParams().get("sessionState");
    const [previousValues, setPreviousValues] = useState<VirkningstidspunktFormValues>(initialValues);

    const { setSaveErrorState } = useBehandlingProvider();
    const { reset } = useFormContext<VirkningstidspunktFormValues>();
    const oppdaterBeregnTilDato = useOnUpdateBeregnTilDato();

    if (erKlageEllerOmgjøring === false || virkningstidspunktV3.erAvslagForAlle) {
        return null;
    }

    const updateBeregnTilDato = (beregnTil: BeregnTil) => {
        oppdaterBeregnTilDato.mutation.mutate(
            { beregnTil: beregnTil },
            {
                onSuccess: (response) => {
                    oppdaterBeregnTilDato.queryClientUpdater((currentData) => {
                        return {
                            ...currentData,
                            ...response,
                        };
                    });
                    const updatedValues = createInitialValues(
                        response.virkningstidspunktV3,
                        response.stønadstype,
                        response.vedtakstype,
                    );

                    updatedValues.roller.forEach((barnValues, index) => {
                        setValue(`roller.${index}.beregnTilDato`, barnValues.beregnTilDato);
                    });
                    setPreviousValues(updatedValues);
                },
                onError: () => {
                    setSaveErrorState({
                        error: true,
                        retryFn: () => updateBeregnTilDato(beregnTil),
                        rollbackFn: () => {
                            reset(previousValues, {
                                keepIsSubmitSuccessful: true,
                                keepDirty: true,
                                keepIsSubmitted: true,
                            });
                        },
                    });
                },
            },
        );
    };
    return (
        <RadioGroup
            name={`beregnTil.beregnTil`}
            legend="Velg hvilken periode vedtaket skal vurderes"
            size="small"
            onChange={updateBeregnTilDato}
            readOnly={lesemodus}
            className="w-[550px] mt-2"
            defaultValue={getValues("beregnTil")}
        >
            <Radio
                value={BeregnTil.OPPRINNELIG_VEDTAKSTIDSPUNKT}
                description={`Beregn og periodiser til og med måneden opprinnelig vedtak ble fattet. Etterfølgende vedtak vil løpe etter beregningsperioden.`}
            >
                Ut måneden opprinnelig vedtak ble fattet
            </Radio>
            <Radio
                value={BeregnTil.INNEVAeRENDEMANED}
                description="Beregn og periodiser ut nåværende måned. Dette vil overskrive perioder fra etterfølgende vedtak"
            >
                Ut nåværende måned
            </Radio>
            <Radio
                value={BeregnTil.ETTERFOLGENDEMANUELLVEDTAK}
                readOnly={virkningstidspunktV3.etterfølgendeVedtak === undefined}
                description={
                    virkningstidspunktV3.etterfølgendeVedtak
                        ? `Beregn og periodiser fram til etterfølgende vedtak med virkningstidspunkt ${DateToDDMMYYYYString(dateOrNull(virkningstidspunktV3.etterfølgendeVedtak?.virkningstidspunkt))}. Etterfølgende vedtak vil løpe etter beregningsperioden.`
                        : ""
                }
            >
                <div className="flex flex-row gap-2">
                    {" "}
                    <div>Til etterfølgende vedtak</div>
                    {virkningstidspunktV3.etterfølgendeVedtak && (
                        <Link
                            className="w-max"
                            to={`/sak/${saksnummer}/vedtak/${virkningstidspunktV3.etterfølgendeVedtak?.vedtaksid}/?steg=vedtak&enhet=${enhet}&sessionState=${sessionState}`}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <BodyShort size="small">
                                <ExternalLinkIcon aria-hidden />
                            </BodyShort>
                        </Link>
                    )}
                </div>
            </Radio>
        </RadioGroup>
    );
};

const Main = ({ initialValues }: { initialValues: VirkningstidspunktFormValues }) => {
    const { control, reset } = useFormContext<VirkningstidspunktFormValues>();
    const {
        onNavigateToTab,
        setSaveErrorState,
        lesemodus,
        vurderSeparatVirkningstidspunkt: vurderSeparat,
        setVurderSeparatVirkningstidspunkt: setVurderSeparat,
        setVurderSeparatVirkningstidspunktForSaker,
        setVurderSeparatSamværForSaker,
        selectedRoller,
    } = useBehandlingProvider();
    const [searchParams] = useSearchParams();
    const { virkningstidspunktV3: virkningstidspunkt, forholdsmessigFordeling, søktFomDato } = useGetBehandlingV2();
    const mergeVirkningstidspunkterMutation = useOnMergeVirkningtidspunkt();
    const ref = useRef<HTMLDialogElement>(null);
    const roller = useFieldArray({
        control,
        name: "roller",
    });
    const watchFieldArray = useWatch({ control, name: "roller" });
    const controlledFields = roller.fields.map((field, index) => ({
        ...field,
        ...watchFieldArray?.[index],
    }));
    const visibleControlledFields = useMemo(() => {
        const visibleIds = new Set(selectedRoller.map((rolle) => rolle.id));
        const mapped = controlledFields.map((item, index) => ({
            ...item,
            originalIndex: index,
        }));

        if (visibleIds.size === 0) {
            return mapped;
        }

        const filtered = mapped.filter(({ rolle }) => visibleIds.has(rolle.id));
        return filtered.length > 0 ? filtered : mapped;
    }, [controlledFields, selectedRoller]);

    const defaultTab = useMemo(() => {
        return visibleControlledFields[0].rolle.id?.toString();
    }, [visibleControlledFields]);

    // Fall tilbake til første barn hvis ingen er valgt, eller hvis tab-verdien i URL-en peker
    // på et barn som ikke lenger er synlig (f.eks. etter bytte av sak i `SakHeader`).
    const selectedTabParam = searchParams.get(urlSearchParams.tab)?.toString();
    const selectedTab = visibleControlledFields.some(({ rolle }) => rolle.id?.toString() === selectedTabParam)
        ? selectedTabParam
        : defaultTab?.toString();

    const onChangeVurderSeparat = () => {
        mergeVirkningstidspunkterMutation.mutation.mutate(undefined, {
            onSuccess: (response) => {
                setVurderSeparatVirkningstidspunktForSaker(response.virkningstidspunktV3.erLikForAlleBasertPåSak);
                setVurderSeparatSamværForSaker(response.samværV2.erSammeForAlleSaker);
                mergeVirkningstidspunkterMutation.queryClientUpdater((_) => response);
                reset(createInitialValues(response.virkningstidspunktV3, response.stønadstype, response.vedtakstype));
            },
            onError: () => {
                setSaveErrorState({
                    error: true,
                    retryFn: () => onChangeVurderSeparat(),
                    rollbackFn: () => void 0,
                });
            },
            onSettled: () => {
                ref?.current?.close();
            },
        });
    };

    const harUlikSøktFraDato =
        new Set(
            visibleControlledFields.map(
                ({ rolle }) => virkningstidspunkt.barn.find((barn) => barn.rolle.id === rolle.id)?.søktFomDato,
            ),
        ).size > 1;

    usePageTabs({
        items: visibleControlledFields,
        mapToTab: (rolle) => ({
            id: rolle.rolle.id.toString(),
            label: rolle.rolle.rolletype,
        }),
        selectedTabId: selectedTab,
        enabled: vurderSeparat && visibleControlledFields.length > 1,
    });

    return (
        <div>
            <ConfirmationModal
                ref={ref}
                closeable
                description={text.varsel.ønskerDuÅSlåSammenVerdierDescription}
                heading={<Heading size="small">{text.varsel.ønskerDuÅSlåSammenVerdier}</Heading>}
                footer={
                    <>
                        <Button
                            type="button"
                            onClick={onChangeVurderSeparat}
                            size="small"
                            loading={mergeVirkningstidspunkterMutation.mutation.isPending}
                        >
                            {text.label.ja}
                        </Button>
                        <Button type="button" variant="secondary" size="small" onClick={() => ref.current?.close()}>
                            {text.label.avbryt}
                        </Button>
                    </>
                }
            />
            {visibleControlledFields.length > 1 && !harUlikSøktFraDato && (
                <Switch
                    value="erLikForAlle"
                    checked={vurderSeparat}
                    readOnly={lesemodus}
                    onChange={(e) => {
                        if (e.target.checked) {
                            setVurderSeparat(e.target.checked);
                        }
                        if (!e.target.checked) {
                            ref.current?.showModal();
                        }
                    }}
                    size="small"
                >
                    {text.label.vurderSeparatPerBarn}
                </Switch>
            )}
            {vurderSeparat && visibleControlledFields.length > 1 && (
                <Tabs
                    defaultValue={defaultTab}
                    value={selectedTab}
                    onChange={onNavigateToTab}
                    className="ax-lg:max-w-saksbehandling-inner ax-md:max-w-saksbehandling-inner-md ax-sm:max-w-saksbehandling-inner-sm w-full"
                >
                    <Tabs.List>
                        {visibleControlledFields.map(({ rolle }) => (
                            <Tabs.Tab
                                key={rolle.id}
                                value={rolle.id?.toString()}
                                className="[&>*:first-child]:w-max p-2.5"
                                label={
                                    <PersonIdentSak
                                        ident={rolle.ident}
                                        rolle={rolle.rolletype}
                                        stønadstype={rolle.stønadstype}
                                    />
                                }
                            />
                        ))}
                    </Tabs.List>
                    {visibleControlledFields.map((item) => {
                        return (
                            <Tabs.Panel key={item.rolle.id} value={item.rolle.id?.toString()}>
                                <VirkningstidspunktBarn
                                    item={item}
                                    barnIndex={item.originalIndex}
                                    initialValues={initialValues.roller[item.originalIndex]}
                                />
                            </Tabs.Panel>
                        );
                    })}
                </Tabs>
            )}

            {(visibleControlledFields.length === 1 || !vurderSeparat) && (
                <div className="grid gap-y-4 py-4">
                    <VirkningstidspunktBarn
                        key={visibleControlledFields[0].id}
                        item={visibleControlledFields[0]}
                        barnIndex={visibleControlledFields[0].originalIndex}
                        initialValues={initialValues.roller[visibleControlledFields[0].originalIndex]}
                    />
                </div>
            )}
            <BeregnTilVelger initialValues={initialValues} />
        </div>
    );
};

const VirkningstidspunktForm = () => {
    const { virkningstidspunktV3: virkningstidspunkt, stønadstype, vedtakstype } = useGetBehandlingV2();
    const { setPageErrorsOrUnsavedState } = useBehandlingProvider();
    const initialValues = useMemo(
        () => createInitialValues(virkningstidspunkt, stønadstype, vedtakstype),
        [virkningstidspunkt, stønadstype, vedtakstype],
    );

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
                            rollerError &&
                            Object.keys(rollerError).some(
                                (field) =>
                                    field !== "begrunnelse" &&
                                    field !== "begrunnelseVurderingAvSkolegang" &&
                                    field !== "opphørsdato",
                            ),
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
        <FormProvider {...useFormMethods}>
            <form onSubmit={(e) => e.preventDefault()}>
                <NewFormLayout
                    title={text.label.virkningstidspunkt}
                    main={<Main initialValues={initialValues} />}
                    side={<Side />}
                />
            </form>
        </FormProvider>
    );
};

export default () => {
    return (
        <QueryErrorWrapper>
            <VirkningstidspunktForm />
        </QueryErrorWrapper>
    );
};
