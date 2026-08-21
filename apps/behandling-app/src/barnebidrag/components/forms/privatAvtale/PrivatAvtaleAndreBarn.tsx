import {
    type BarnDto,
    Kilde,
    type OppdaterePrivatAvtaleRequest,
    type PrivatAvtaleType,
    Stonadstype,
} from "@bidrag/api/BidragBehandlingApiV1";
import { dateOrNull, PersonNavnIdent } from "@bidrag/common";
import { PlusIcon } from "@navikt/aksel-icons";
import { Alert, BodyShort, Box, Button, HStack, Label, Loader, VStack } from "@navikt/ds-react";
import { useFlag } from "@unleash/proxy-client-react";
import React, { useState } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { AddBarnForm } from "../../../../common/components/AddBarnForm";
import { FormControlledSwitch } from "../../../../common/components/formFields/FormControlledSwitch";
import SakLenke from "../../../../common/components/SakLenke";
import text from "../../../../common/constants/texts";
import { useBehandlingProvider } from "../../../../common/context/BehandlingContext";
import { getFirstDayOfMonthAfterEighteenYears } from "../../../../common/helpers/boforholdFormHelpers";
import { useGetBehandlingV2, useRefetchFFInfoFn } from "../../../../common/hooks/useApiData";
import { StønadstypeTilVisningsnavn } from "../../../../common/hooks/useVisningsnavn";
import { useOnCreatePrivatAvtale } from "../../../hooks/useOnCreatePrivatAvtale";
import { useOnUpdatePrivatAvtale } from "../../../hooks/useOnUpdatePrivatAvtale";
import type { PrivatAvtaleFormValue, PrivatAvtaleFormValues } from "../../../types/privatAvtaleFormValues";
import { createPrivatAvtaleInitialValues, sjekkSammeBarnFinnesMedStønadstype } from "../helpers/PrivatAvtaleHelpers";
import PrivatAvtaleAndreBarnLeggTilSak from "./PrivatAvtaleAndreBarnLeggTilSak";
import { PrivatAvtalePerioder } from "./PrivatAvtalePerioder";

export const konverterMotsattStønadstype = {
    [Stonadstype.BIDRAG]: Stonadstype.BIDRAG18AAR,
    [Stonadstype.BIDRAG18AAR]: Stonadstype.BIDRAG,
};
export const PrivatAvtaleAndreBarn = ({ initialValues }: { initialValues: PrivatAvtaleFormValues }) => {
    const { setSaveErrorState, lesemodus } = useBehandlingProvider();
    const { privatAvtaleV3 } = useGetBehandlingV2();
    const { control, setValue } = useFormContext<PrivatAvtaleFormValues>();
    const [openForm, setOpenForm] = useState<boolean>(false);
    const [error, setError] = useState(null);
    const fieldArray = useFieldArray({
        control,
        name: "andreBarn",
    });
    const watchFieldArray = useWatch({ control, name: "andreBarn" });
    const andreBarnFieldArray = fieldArray.fields.map((field, index) => {
        return {
            ...field,
            ...watchFieldArray[index],
        };
    });
    const createPrivatAvtale = useOnCreatePrivatAvtale();
    const refetchFFInfo = useRefetchFFInfoFn();

    const onCreatePrivatAvtale = (item: PrivatAvtaleFormValue, index?: number) => {
        const sammeBarnFinnesMedStønadstypeAndreBarn = sjekkSammeBarnFinnesMedStønadstype(
            item.gjelderBarn.ident,
            item.gjelderBarn.stønadstype,
            privatAvtaleV3.andreBarn.barn,
        );
        const sammeBarnFinnesMedStønadstypeSøknadsbarn = sjekkSammeBarnFinnesMedStønadstype(
            item.gjelderBarn.ident,
            item.gjelderBarn.stønadstype,
            privatAvtaleV3.søknadsbarn,
        );
        const sammeBarnFinnesMedStønadstype =
            sammeBarnFinnesMedStønadstypeAndreBarn || sammeBarnFinnesMedStønadstypeSøknadsbarn;
        setError(null);
        if (sammeBarnFinnesMedStønadstype && item.gjelderBarn.id === null) {
            setError(`Samme barn for ${StønadstypeTilVisningsnavn[item.gjelderBarn.stønadstype]} finnes allerede.`);
            return;
        }
        const stønadstype = item.gjelderBarn.stønadstype ?? Stonadstype.BIDRAG;
        const payload: BarnDto = {
            personident: item.gjelderBarn.ident,
            navn: item.gjelderBarn.navn,
            fødselsdato: item.gjelderBarn.fødselsdato,
            stønadstype: sammeBarnFinnesMedStønadstype
                ? (konverterMotsattStønadstype[item.gjelderBarn.stønadstype] ?? stønadstype)
                : stønadstype,
        };
        createPrivatAvtale.mutation.mutate(payload, {
            onSuccess: (response) => {
                const itemBarn = response.privatAvtale.andreBarn.barn.find(
                    (barn) =>
                        barn.gjelderBarn.ident === item.gjelderBarn.ident &&
                        (barn.gjelderBarn.stønadstype === payload.stønadstype || barn.gjelderBarn.stønadstype === null),
                );
                const itemsPrivatAvtale = itemBarn?.privatAvtale;
                if (index !== undefined) {
                    setValue(`andreBarn.${index}.privatAvtale`, createPrivatAvtaleInitialValues(itemsPrivatAvtale));
                } else {
                    fieldArray.append({
                        ...item,
                        saksnummer: itemBarn?.saksnummer,
                        enhet: itemBarn?.enhet,
                        gjelderBarn: {
                            ...item.gjelderBarn,
                            kilde: Kilde.MANUELL,
                            stønadstype: item.gjelderBarn.stønadstype ?? payload.stønadstype,
                        },
                        privatAvtale: createPrivatAvtaleInitialValues(itemsPrivatAvtale),
                    });
                }
                refetchFFInfo();
                setOpenForm(false);
            },
            onError: () => {
                setSaveErrorState({
                    error: true,
                    retryFn: () => onCreatePrivatAvtale(item, index),
                });
            },
        });
    };

    return (
        <div>
            <div className="mt-2 mb-2">
                {!openForm && !lesemodus && (
                    <Button
                        type="button"
                        onClick={() => setOpenForm(true)}
                        variant="tertiary"
                        iconPosition="left"
                        className="w-max"
                        icon={<PlusIcon />}
                        size="small"
                    >
                        {text.label.leggTilBarn}
                    </Button>
                )}
                {error && (
                    <Alert variant="error" className="mt-2" size="small">
                        {error}
                    </Alert>
                )}
                {openForm && (
                    <AddBarnForm
                        setOpenAddBarnForm={setOpenForm}
                        showFritekst={false}
                        showStønadstype
                        onSave={(barn) =>
                            onCreatePrivatAvtale({
                                gjelderBarn: {
                                    id: null,
                                    ident: barn.personident,
                                    fødselsdato: barn.fødselsdato,
                                    navn: barn.navn,
                                    stønadstype: barn.stønadstype,
                                },
                                harLøpendeBidrag: false,
                                privatAvtale: null,
                            })
                        }
                    />
                )}
            </div>
            {andreBarnFieldArray.length === 0 && <BodyShort>{text.description.ingenBarn}</BodyShort>}
            <React.Suspense
                fallback={
                    <VStack gap="space-2" align="center">
                        <Loader size="medium" />
                    </VStack>
                }
            >
                <VStack gap="space-2">
                    {andreBarnFieldArray.map((privatAvtale, index) => {
                        return (
                            <PrivatAvtaleAnnenBarnDetaljer
                                key={privatAvtale.gjelderBarn?.id}
                                item={privatAvtale}
                                barnIndex={index}
                                initialValues={initialValues}
                                onCreatePrivatAvtale={onCreatePrivatAvtale}
                            />
                        );
                    })}
                </VStack>
            </React.Suspense>
        </div>
    );
};

function PrivatAvtaleAnnenBarnDetaljer({
    item,
    barnIndex,
    initialValues,
    onCreatePrivatAvtale,
}: {
    onCreatePrivatAvtale: (item: PrivatAvtaleFormValue, index?: number) => void;
    item: PrivatAvtaleFormValue;
    barnIndex: number;
    initialValues: PrivatAvtaleFormValues;
}) {
    const { lesemodus, setSaveErrorState } = useBehandlingProvider();
    const { privatAvtaleV3, virkningstidspunktV3 } = useGetBehandlingV2();
    const { setValue } = useFormContext<PrivatAvtaleFormValues>();
    const updatePrivatAvtaleQuery = useOnUpdatePrivatAvtale(item.privatAvtale?.avtaleId);

    const erUtenlandsbidragSkruddPå = useFlag("behandling.fattevedtak_barnebidrag_utenlandskvaluta");
    const onToggleUtelandsBidrag = (checked: boolean) => {
        const payload: OppdaterePrivatAvtaleRequest = {
            ...item.privatAvtale,
            avtaleType: item.privatAvtale.avtaleType ? (item.privatAvtale.avtaleType as PrivatAvtaleType) : null,
            gjelderUtland: checked,
        };
        updatePrivatAvtaleQuery.mutation.mutate(payload, {
            onError: () => {
                setSaveErrorState({
                    error: true,
                    retryFn: () => onToggleUtelandsBidrag(checked),
                    rollbackFn: () => setValue(`andreBarn.${barnIndex}.privatAvtale.gjelderUtland`, !checked),
                });
            },
        });
    };

    function renderBarnUtenLøpendeBidragDetaljer() {
        if (item.harLøpendeBidrag) return null;
        if (!item.saksnummer) {
            return (
                <Box background="neutral-soft" padding="space-16">
                    <PrivatAvtaleAndreBarnLeggTilSak item={item} />
                </Box>
            );
        }

        const motsattStønadstype = konverterMotsattStønadstype[item.gjelderBarn.stønadstype ?? Stonadstype.BIDRAG];
        const motsattStønadstypeFinnesForSammeBarn =
            sjekkSammeBarnFinnesMedStønadstype(
                item.gjelderBarn.ident,
                motsattStønadstype,
                privatAvtaleV3.søknadsbarn,
            ) ||
            sjekkSammeBarnFinnesMedStønadstype(
                item.gjelderBarn.ident,
                motsattStønadstype,
                privatAvtaleV3.andreBarn?.barn ?? [],
            );
        const beregnTilDato = virkningstidspunktV3.beregnTilDato ? new Date(virkningstidspunktV3.beregnTilDato) : null;
        const barnHarFylt18ÅrFørBeregnTilDato = beregnTilDato
            ? getFirstDayOfMonthAfterEighteenYears(dateOrNull(item.gjelderBarn.fødselsdato)) < beregnTilDato
            : false;
        const kanOppretteMotsattStønadstype =
            !motsattStønadstypeFinnesForSammeBarn && barnHarFylt18ÅrFørBeregnTilDato && item.privatAvtale?.avtaleId;
        return (
            <Box background="neutral-soft" padding="space-16">
                <HStack gap="space-2" className="flex items-center">
                    <HStack className="flex gap-x-2">
                        <Label size="small">Tilhører sak: </Label>
                        <BodyShort size="small">
                            <SakLenke saksnummer={item.saksnummer} />
                        </BodyShort>
                    </HStack>
                    <HStack className="flex gap-x-2">
                        <Label size="small">Enhet: </Label>
                        <BodyShort size="small">{item.enhet}</BodyShort>
                    </HStack>
                    {kanOppretteMotsattStønadstype && (
                        <Button
                            type="button"
                            size="xsmall"
                            onClick={() =>
                                onCreatePrivatAvtale({
                                    ...item,
                                    gjelderBarn: {
                                        ...item.gjelderBarn,
                                        stønadstype: motsattStønadstype,
                                    },
                                })
                            }
                            icon={<PlusIcon />}
                            variant="tertiary"
                            className="w-fit"
                        >
                            opprett avtale om {motsattStønadstype === Stonadstype.BIDRAG ? "bidrag" : "bidrag 18 år"}
                        </Button>
                    )}
                </HStack>
            </Box>
        );
    }
    console.log("rendering barn uten løpende bidrag detaljer", { item });
    return (
        <Box background="default" padding="space-12" borderRadius="12" borderColor="neutral-subtle" borderWidth="1">
            <VStack gap="space-2">
                <RolleInfoBox item={item} />
                {renderBarnUtenLøpendeBidragDetaljer()}
                {!item.privatAvtale?.avtaleId && (
                    <Button
                        type="button"
                        onClick={() => onCreatePrivatAvtale(item, barnIndex)}
                        variant="tertiary"
                        size="small"
                        className="w-fit"
                        disabled={false}
                    >
                        {text.label.opprettePrivatAvtale}
                    </Button>
                )}
                {item.privatAvtale?.avtaleId && (
                    <>
                        {erUtenlandsbidragSkruddPå && (
                            <FormControlledSwitch
                                name={`andreBarn.${barnIndex}.privatAvtale.gjelderUtland`}
                                legend={text.label.utlandsbidrag}
                                readOnly={lesemodus || !item.privatAvtale}
                                onChange={onToggleUtelandsBidrag}
                                loading={updatePrivatAvtaleQuery.mutation.isPending}
                            />
                        )}
                        <PrivatAvtalePerioder
                            prefix="andreBarn"
                            initialValues={initialValues}
                            item={item}
                            barnIndex={barnIndex}
                        />
                    </>
                )}
            </VStack>
        </Box>
    );
}
export const RolleInfoBox = ({ item }: { item: PrivatAvtaleFormValue }) => {
    return (
        <div className="grid grid-cols-[max-content_auto] items-center p-2 bg-[white] border border-solid border-[var(--ax-border-neutral)]">
            <div className="flex">
                <PersonNavnIdent
                    ident={item.gjelderBarn.ident}
                    navn={item.gjelderBarn.navn}
                    fødselsdato={item.gjelderBarn.fødselsdato}
                    visAlder
                />
            </div>
        </div>
    );
};
