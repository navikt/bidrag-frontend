import { type GebyrDtoV3, Stonadstype } from "@bidrag/api/BidragBehandlingApiV1";
import { ModiaLink, PersonNavnIdent, RolleTag, type RolleTypeAbbreviation } from "@bidrag/common";
import { BodyShort, Box, Heading, Label } from "@navikt/ds-react";
import { type UseMutationResult, useSuspenseQueries } from "@tanstack/react-query";
import { Fragment, useCallback, useEffect, useMemo } from "react";
import { type FieldPathByValue, FormProvider, useFieldArray, useForm, useFormContext, useWatch } from "react-hook-form";
import { ActionButtons } from "../../../../common/components/ActionButtons";
import { BehandlingAlert } from "../../../../common/components/BehandlingAlert";
import { FormControlledSelectField } from "../../../../common/components/formFields/FormControlledSelectField";
import { FormControlledTextarea } from "../../../../common/components/formFields/FormControlledTextArea";
import AinntektLink from "../../../../common/components/inntekt/AinntektLink";
import { NyOpplysningerAlert } from "../../../../common/components/inntekt/NyOpplysningerAlert";
import { NewFormLayout } from "../../../../common/components/layout/grid/NewFormLayout";
import { QueryErrorWrapper } from "../../../../common/components/query-error-boundary/QueryErrorWrapper";
import { PERSON_API } from "../../../../common/constants/api";
import elementIds from "../../../../common/constants/elementIds";
import text from "../../../../common/constants/texts";
import { useBehandlingProvider } from "../../../../common/context/BehandlingContext";
import { type GebyrPayload, useGetBehandlingV2 } from "../../../../common/hooks/useApiData";
import { useDebounce } from "../../../../common/hooks/useDebounce";
import { useFieldMutationStatus } from "../../../../common/hooks/useFieldMutationStatus";
import { formatterBeløp } from "../../../../utils/number-utils";
import { STEPS } from "../../../constants/steps";
import { BarnebidragStepper } from "../../../enum/BarnebidragStepper";
import ForholdsmessigFordelingInfo from "../../../forholdsmessigfordeling/ForholdsmessigFordelingInfo";
import { useOnUpdateGebyr } from "../../../hooks/useOnUpdateGebyr";
import {
    EndeligIlagtGebyr,
    type GebyrDetaljer,
    type GebyrFormRolle,
    type GebyrFormValues,
} from "../../../types/gebyrFormValues";
import { createInitialValues } from "../helpers/GebryFormHelpers";

type GebyrDetailPath = FieldPathByValue<GebyrFormValues, GebyrDetaljer>;

const booleanValueOfEndeligIlagtGebyr = {
    [EndeligIlagtGebyr.Ilagt]: true,
    [EndeligIlagtGebyr.Fritatt]: false,
};

const checkIfOverstyrt = (gebyrDetaljer: GebyrDetaljer) =>
    booleanValueOfEndeligIlagtGebyr[gebyrDetaljer.endeligIlagtGebyr] !== gebyrDetaljer.beregnetIlagtGebyr;

const createPayload = (gebyrDetaljer: GebyrDetaljer): GebyrPayload => {
    const overstyrGebyr = checkIfOverstyrt(gebyrDetaljer);

    return {
        ...gebyrDetaljer,
        søknadsid: gebyrDetaljer.søknad?.søknadsid,
        overstyrGebyr,
        rolleId: gebyrDetaljer.rolle.id,
        begrunnelse: overstyrGebyr ? gebyrDetaljer.begrunnelse : null,
    };
};

const Begrunnelse = ({
    fieldName,
    mutation,
}: {
    fieldName: GebyrDetailPath;
    mutation: UseMutationResult<GebyrDtoV3, Error, GebyrPayload, unknown>;
}) => {
    const fieldMutateState = useFieldMutationStatus(mutation, `${fieldName}.begrunnelse`);

    return (
        <FormControlledTextarea
            name={`${fieldName}.begrunnelse`}
            label={text.label.begrunnelse}
            className="w-[444px]"
            minRows={1}
            mutationState={fieldMutateState}
        />
    );
};

const GebyrSelect = ({
    fieldName,
    onSave,
}: {
    fieldName: GebyrDetailPath;
    onSave: (fieldName: GebyrDetailPath, gebyrDetaljer: GebyrDetaljer) => void;
}) => {
    const { getValues, setValue } = useFormContext<GebyrFormValues>();

    const onSelect = (value: EndeligIlagtGebyr.Fritatt | EndeligIlagtGebyr.Ilagt) => {
        const gebyrDetaljer = getValues(fieldName);
        const updateGebyrDetaljer = {
            ...gebyrDetaljer,
            endeligIlagtGebyr: value,
        };
        const overstyrGebyr = checkIfOverstyrt(updateGebyrDetaljer);

        if (!overstyrGebyr) {
            setValue(`${fieldName}.begrunnelse`, "");
        }

        onSave(fieldName, updateGebyrDetaljer);
    };

    return (
        <FormControlledSelectField
            name={`${fieldName}.endeligIlagtGebyr`}
            className="w-fit h-max"
            label={text.label.gebyr}
            options={[
                { value: EndeligIlagtGebyr.Fritatt, text: text.select.fritatt },
                { value: EndeligIlagtGebyr.Ilagt, text: text.select.ilagt },
            ]}
            onSelect={onSelect}
        />
    );
};

const Side = () => {
    const { onStepChange } = useBehandlingProvider();
    const { virkningstidspunktV3: virkningstidspunkt } = useGetBehandlingV2();

    return (
        <>
            <ForholdsmessigFordelingInfo />
            <ActionButtons
                onNext={() =>
                    onStepChange(
                        virkningstidspunkt.erAvslagForAlle
                            ? STEPS[BarnebidragStepper.VEDTAK]
                            : STEPS[BarnebidragStepper.BOFORHOLD],
                    )
                }
            />
        </>
    );
};

const GebyrRoller = ({ fieldArrayName }: { fieldArrayName: FieldPathByValue<GebyrFormValues, GebyrFormRolle[]> }) => {
    const fieldArrayType = fieldArrayName.split(".")[2];
    const { selectedSaksnummer, setSaveErrorState } = useBehandlingProvider();
    const { gebyrV3: gebyr, virkningstidspunktV3: virkningstidspunkt } = useGetBehandlingV2();
    const { control, setValue, watch } = useFormContext<GebyrFormValues>();
    const gebyrRollerFieldArray = useFieldArray({
        control,
        name: fieldArrayName,
    });
    const watchFieldArray = useWatch({ control, name: fieldArrayName });
    const controlledFields = gebyrRollerFieldArray.fields
        .map((field, index) => {
            return {
                ...field,
                ...watchFieldArray[index],
                fieldIndex: index,
            };
        })
        .filter((item) => {
            if (!selectedSaksnummer) {
                return true;
            }

            return item.rolle.saksnummer === selectedSaksnummer;
        });

    const updateGebyr = useOnUpdateGebyr();

    const onSave = useCallback(
        (fieldName: GebyrDetailPath, gebyrDetaljer: GebyrDetaljer) => {
            const payload = createPayload(gebyrDetaljer);
            updateGebyr.mutation.mutate(
                { triggeredBy: fieldName, ...payload },
                {
                    onError: () => {
                        setSaveErrorState({
                            error: true,
                            retryFn: () => onSave(fieldName, gebyrDetaljer),
                            rollbackFn: () => {
                                const cachedGebryRolleDetaljer = gebyr.saker
                                    .find((sak) => sak.saksnummer === gebyrDetaljer.søknad.saksnummer)
                                    [fieldArrayType].find((gR) => gR.rolle.id === gebyrDetaljer.rolle.id).gebyrDetaljer;
                                setValue(fieldName, {
                                    ...cachedGebryRolleDetaljer,
                                    endeligIlagtGebyr: cachedGebryRolleDetaljer.endeligIlagtGebyr
                                        ? EndeligIlagtGebyr.Ilagt
                                        : EndeligIlagtGebyr.Fritatt,
                                });
                            },
                        });
                    },
                },
            );
        },
        [updateGebyr, setSaveErrorState, setValue, gebyr, createPayload],
    );

    const debouncedOnSave = useDebounce(onSave);

    useEffect(() => {
        const subscription = watch((value, { name, type }) => {
            if (name?.includes("begrunnelse") && type === "change") {
                const [_, sakIndex, typeRolle, rolleIndex] = name.split(".");
                const gebyrDetaljer = value.gebyrSaker[sakIndex][typeRolle][rolleIndex].gebyrDetaljer;
                debouncedOnSave(name, gebyrDetaljer);
            }
        });
        return () => subscription.unsubscribe();
    }, [debouncedOnSave, watch]);

    return (
        <>
            {controlledFields.map((item) => {
                const avslag = virkningstidspunkt.erAvslagForAlle;
                return (
                    <Fragment key={item?.rolle?.id}>
                        <Box
                            background="neutral-soft"
                            className="grid gap-2"
                            id={`${elementIds.seksjon_gebyr}_${item?.rolle?.id}`}
                        >
                            <div className="grid grid-cols-[max-content_max-content_auto] p-4 bg-[white]">
                                <div>
                                    <RolleTag
                                        rolleType={item.rolle.rolletype as unknown as RolleTypeAbbreviation}
                                        ident={item.rolle.ident}
                                        stønad18År={item.rolle.stønadstype === Stonadstype.BIDRAG18AAR}
                                    />
                                </div>
                                <PersonNavnIdent ident={item.rolle.ident} />
                                <div className="pl-2">
                                    {avslag && (
                                        <div className="flex gap-x-2">
                                            <AinntektLink ident={item.rolle.ident} />
                                            <ModiaLink ident={item.rolle.ident} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {item.gebyrDetaljer && (
                                <Box
                                    background="default"
                                    padding="space-8"
                                    key={item.gebyrDetaljer.søknad.saksnummer}
                                    className="grid gap-2"
                                >
                                    <div className="grid gap-2">
                                        <div className="flex gap-x-2">
                                            <Label size="small">{text.label.skattepliktigeInntekt}:</Label>
                                            <BodyShort size="small">
                                                {formatterBeløp(item.gebyrDetaljer.inntekt.skattepliktigInntekt)}
                                            </BodyShort>
                                        </div>
                                        {!avslag && (
                                            <>
                                                <div className="flex gap-x-2">
                                                    <Label size="small">{text.label.høyesteBarnetillegg}:</Label>
                                                    <BodyShort size="small">
                                                        {formatterBeløp(item.gebyrDetaljer.inntekt.maksBarnetillegg)}
                                                    </BodyShort>
                                                </div>
                                                <div className="flex gap-x-2">
                                                    <Label size="small">{text.label.totalt}:</Label>
                                                    <BodyShort size="small">
                                                        {formatterBeløp(item.gebyrDetaljer.inntekt.totalInntekt)}
                                                    </BodyShort>
                                                </div>
                                            </>
                                        )}
                                        <div className="flex items-start gap-x-2">
                                            <GebyrSelect
                                                fieldName={`${fieldArrayName}.${item.fieldIndex}.gebyrDetaljer`}
                                                onSave={onSave}
                                            />
                                            {booleanValueOfEndeligIlagtGebyr[item.gebyrDetaljer.endeligIlagtGebyr] && (
                                                <div className="h-[60px] flex">
                                                    <div className="flex self-end gap-x-2">
                                                        <Label size="small">{text.label.beløp}:</Label>
                                                        <BodyShort size="small">
                                                            {formatterBeløp(item.gebyrDetaljer.beløpGebyrsats)}
                                                        </BodyShort>
                                                    </div>
                                                </div>
                                            )}
                                            {booleanValueOfEndeligIlagtGebyr[item.gebyrDetaljer.endeligIlagtGebyr] !==
                                                item.gebyrDetaljer.beregnetIlagtGebyr && (
                                                <div>
                                                    <Begrunnelse
                                                        fieldName={`${fieldArrayName}.${item.fieldIndex}.gebyrDetaljer`}
                                                        mutation={updateGebyr.mutation}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Box>
                            )}
                        </Box>
                    </Fragment>
                );
            })}
        </>
    );
};

const Main = () => {
    const { control } = useFormContext<GebyrFormValues>();
    const { selectedSaksnummer } = useBehandlingProvider();
    const gebyrSakerFieldArray = useFieldArray({
        control,
        name: "gebyrSaker",
    });
    const visibleGebyrSaker = useMemo(() => {
        const items = gebyrSakerFieldArray.fields.map((item, index) => ({
            item,
            index,
        }));

        if (!selectedSaksnummer) {
            return items;
        }

        return items.filter(({ item }) => item.saksnummer === selectedSaksnummer);
    }, [gebyrSakerFieldArray.fields, selectedSaksnummer]);
    const hasGebyrForVisibleSaker = visibleGebyrSaker.some(
        ({ item }) => item.gebyrRoller.length > 0 || item.gebyr18År.length > 0,
    );
    const showIngenGebyrForSelectedSaksnummer =
        Boolean(selectedSaksnummer) && (visibleGebyrSaker.length === 0 || !hasGebyrForVisibleSaker);

    return (
        <>
            {showIngenGebyrForSelectedSaksnummer && (
                <BehandlingAlert variant="info">Ingen gebyr for valgt saksnummer.</BehandlingAlert>
            )}
            {visibleGebyrSaker.map(({ item, index }) => {
                return (
                    <Fragment key={item.saksnummer}>
                        <Box background="neutral-soft" className="grid gap-4 py-2 px-4">
                            {visibleGebyrSaker.length > 1 && (
                                <Heading level="3" size="small">
                                    {text.title.sak} {item.saksnummer}
                                </Heading>
                            )}
                            {item.gebyrRoller.length > 0 && (
                                <GebyrRoller fieldArrayName={`gebyrSaker.${index}.gebyrRoller`} />
                            )}
                            {item.gebyr18År.length > 0 && (
                                <Fragment>
                                    <Heading level="3" size="small">
                                        {text.title.attenÅrsSøknad}
                                    </Heading>
                                    <GebyrRoller fieldArrayName={`gebyrSaker.${index}.gebyr18År`} />
                                </Fragment>
                            )}
                        </Box>
                    </Fragment>
                );
            })}
        </>
    );
};

const GebyrForm = () => {
    const {
        gebyrV3: { saker },
    } = useGetBehandlingV2();

    const unikeIdenterForGebyr = useMemo(
        () =>
            Array.from(
                new Set(
                    saker.flatMap((sak) =>
                        [...sak.gebyrRoller, ...sak.gebyr18År].map((gebyrRolle) => gebyrRolle.rolle.ident),
                    ),
                ),
            ).filter((ident): ident is string => Boolean(ident)),
        [saker],
    );

    useSuspenseQueries({
        queries: unikeIdenterForGebyr.map((ident) => ({
            queryKey: ["persons", ident],
            queryFn: async () => (await PERSON_API.informasjon.hentPersonPost({ ident })).data,
            staleTime: Infinity,
        })),
    });

    const initialValues = useMemo(() => createInitialValues(saker), [saker]);

    const useFormMethods = useForm({
        defaultValues: initialValues,
    });

    return (
        <FormProvider {...useFormMethods}>
            <form onSubmit={(e) => e.preventDefault()}>
                <NewFormLayout title="Gebyr" main={<Main />} side={<Side />} pageAlert={<NyOpplysningerAlert />} />
            </form>
        </FormProvider>
    );
};

export default () => {
    return (
        <QueryErrorWrapper>
            <GebyrForm />
        </QueryErrorWrapper>
    );
};
