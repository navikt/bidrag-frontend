import {
    Kilde,
    type OppdaterePrivatAvtaleRequest,
    PrivatAvtaleType,
    type Stonadstype,
} from "@bidrag/api/BidragBehandlingApiV1";
import { dateOrNull } from "@bidrag/common";
import { useEffect, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { FormControlledMonthPicker } from "../../../../common/components/formFields/FormControlledMonthPicker";
import { FormControlledSelectField } from "../../../../common/components/formFields/FormControlledSelectField";
import { FormControlledSwitch } from "../../../../common/components/formFields/FormControlledSwitch";
import { FlexRow } from "../../../../common/components/layout/grid/FlexRow";
import text from "../../../../common/constants/texts";
import { useBehandlingProvider } from "../../../../common/context/BehandlingContext";
import { getFirstDayOfMonthAfterEighteenYears } from "../../../../common/helpers/boforholdFormHelpers";
import { useGetBehandlingV2, useRefetchFFInfoFn } from "../../../../common/hooks/useApiData";
import { hentVisningsnavn } from "../../../../common/hooks/useVisningsnavn";
import { isAfterDate } from "../../../../utils/date-utils";
import { useOnDeletePrivatAvtale } from "../../../hooks/useOnDeletePrivatAvtale";
import { useOnUpdatePrivatAvtale } from "../../../hooks/useOnUpdatePrivatAvtale";
import type { PrivatAvtaleFormValue, PrivatAvtaleFormValues } from "../../../types/privatAvtaleFormValues";
import { VedtaksListe } from "../../Vedtakliste";
import { BeregnetTabel } from "./BeregnetTabel";
import { Perioder } from "./Perioder";
import { getFomForPrivatAvtale, getTomForPrivatAvtale, RemoveButton } from "./PrivatAvtale";
import { konverterMotsattStønadstype } from "./PrivatAvtaleAndreBarn";

export const PrivatAvtalePerioder = ({
    prefix = "roller",
    item,
    barnIndex,
    initialValues,
}: {
    prefix: "roller" | "andreBarn";
    item: PrivatAvtaleFormValue;
    barnIndex: number;
    initialValues: PrivatAvtaleFormValues;
}) => {
    const { privatAvtaleV3: privatAvtale, virkningstidspunktV3: virkningstidspunkt, roller } = useGetBehandlingV2();
    const { setSaveErrorState, lesemodus } = useBehandlingProvider();
    const deletePrivatAvtale = useOnDeletePrivatAvtale();
    const updatePrivatAvtaleQuery = useOnUpdatePrivatAvtale(item.privatAvtale.avtaleId);
    const selectedVirkningstidspunktObjekt = virkningstidspunkt.barn.find(
        (virkingstingspunkt) => virkingstingspunkt.rolle.id === item.gjelderBarn.id,
    );
    const søknadsBarnAndAndreBarn = privatAvtale.søknadsbarn
        .map((barn) => ({ gjelderBarn: barn.gjelderBarn, privatAvtale: barn.privatAvtale }))
        .concat(
            privatAvtale.andreBarn.barn.map((barn) => ({
                gjelderBarn: barn.gjelderBarn,
                privatAvtale: barn.privatAvtale,
            })),
        );
    const manuelleVedtakUtenInnkreving = søknadsBarnAndAndreBarn.find(
        (barn) => barn.privatAvtale?.id === item.privatAvtale.avtaleId,
    )?.privatAvtale?.manuelleVedtakUtenInnkreving;
    const hasManuelleVedtakUtenInnkreving = !!manuelleVedtakUtenInnkreving?.length;
    const valgManuelleVedtakUtenInnkreving = manuelleVedtakUtenInnkreving?.find((vedtak) => vedtak.valgt)?.vedtaksid;
    const manuelleVedtak = {
        vedtaksliste: hasManuelleVedtakUtenInnkreving
            ? manuelleVedtakUtenInnkreving
            : selectedVirkningstidspunktObjekt?.manuelleVedtak,
        valgtVedtak: hasManuelleVedtakUtenInnkreving
            ? valgManuelleVedtakUtenInnkreving
            : selectedVirkningstidspunktObjekt?.grunnlagFraVedtak,
    };
    const privatAvtaleItem = søknadsBarnAndAndreBarn.find(
        (barn) => barn.privatAvtale?.id === item.privatAvtale?.avtaleId,
    );
    const selectedPrivatAvtale = privatAvtaleItem?.privatAvtale;
    const selectedBarn = privatAvtaleItem?.gjelderBarn;

    const beregnetPrivatAvtale = selectedPrivatAvtale?.beregnetPrivatAvtale;
    const valideringsfeil = selectedPrivatAvtale?.valideringsfeil;
    const vedtakFraNav = item.privatAvtale.avtaleType === PrivatAvtaleType.VEDTAK_FRA_NAV;
    const { watch, setValue, setError, getFieldState, getValues } = useFormContext<PrivatAvtaleFormValues>();
    const selectedRolle = roller.find((rolle) => rolle.id === selectedBarn?.id);
    const fom = useMemo(() => {
        return getFomForPrivatAvtale(
            selectedRolle?.stønadstype ?? item?.gjelderBarn?.stønadstype,
            selectedBarn?.fødselsdato ?? item?.gjelderBarn?.fødselsdato,
        );
    }, [
        selectedRolle?.stønadstype,
        selectedBarn?.fødselsdato,
        item?.gjelderBarn?.stønadstype,
        item?.gjelderBarn?.fødselsdato,
    ]);
    const tom = useMemo(
        () =>
            getTomForPrivatAvtale(
                selectedBarn?.fødselsdato ?? item?.gjelderBarn?.fødselsdato,
                selectedRolle?.stønadstype ?? item?.gjelderBarn?.stønadstype,
            ),
        [
            selectedBarn?.fødselsdato,
            selectedRolle?.stønadstype,
            item?.gjelderBarn?.fødselsdato,
            item?.gjelderBarn?.stønadstype,
        ],
    );
    const refetchFFInfo = useRefetchFFInfoFn();

    useEffect(() => {
        const { error: avtaleDatoError } = getFieldState(`${prefix}.${barnIndex}.privatAvtale.avtaleDato`);
        const { error: manglerBegrunnelseError } = getFieldState(`${prefix}.${barnIndex}.begrunnelse`);
        if (valideringsfeil?.manglerAvtaledato && !avtaleDatoError) {
            setError(`${prefix}.${barnIndex}.privatAvtale.avtaleDato`, {
                type: "notValid",
                message: text.error.feltErPåkrevd,
            });
        }
        if (valideringsfeil?.manglerBegrunnelse && !manglerBegrunnelseError) {
            setError(`${prefix}.${barnIndex}.begrunnelse`, {
                type: "notValid",
                message: text.error.feltErPåkrevd,
            });
        }
    }, [valideringsfeil?.manglerAvtaledato, valideringsfeil?.manglerBegrunnelse]);

    const onDeletePrivatAvtale = () => {
        deletePrivatAvtale.mutation.mutate(item.privatAvtale.avtaleId, {
            onSuccess: () => {
                if (slettingVilFjerneRevurderingsbarn) {
                    window.location.reload();
                    return;
                }
                setValue(`${prefix}.${barnIndex}.privatAvtale`, null);
                setValue(`${prefix}.${barnIndex}.privatAvtale.avtaleId`, null);
                deletePrivatAvtale.queryClientUpdater((currentData) => {
                    if (prefix === "andreBarn" && item.gjelderBarn.kilde === Kilde.MANUELL) {
                        const andreBarn = getValues("andreBarn");
                        const updatedAndreBarn = andreBarn.filter(
                            (barn) =>
                                (barn.gjelderBarn.ident === item.gjelderBarn.ident &&
                                    barn.gjelderBarn.stønadstype === item.gjelderBarn.stønadstype) === false,
                        );
                        setValue("andreBarn", updatedAndreBarn);
                    }
                    return {
                        ...currentData,
                        privatAvtaleV3: {
                            andreBarn:
                                prefix === "andreBarn"
                                    ? {
                                          ...currentData.privatAvtaleV3.andreBarn,
                                          barn: currentData.privatAvtaleV3.andreBarn.barn.filter(
                                              (barn) => barn.gjelderBarn.id !== item.gjelderBarn.id,
                                          ),
                                      }
                                    : currentData.privatAvtaleV3.andreBarn,
                            søknadsbarn:
                                prefix === "roller"
                                    ? currentData.privatAvtaleV3.søknadsbarn.map((barn) => {
                                          if (barn.gjelderBarn.id === item.gjelderBarn.id) {
                                              return {
                                                  ...barn,
                                                  privatAvtale: null,
                                              };
                                          }
                                          return barn;
                                      })
                                    : currentData.privatAvtaleV3.søknadsbarn,
                        },
                    };
                });
                refetchFFInfo();
            },
            onError: () => {
                setSaveErrorState({
                    error: true,
                    retryFn: () => onDeletePrivatAvtale(),
                });
            },
        });
    };

    const updatePrivatAvtale = (payload: OppdaterePrivatAvtaleRequest) => {
        updatePrivatAvtaleQuery.mutation.mutate(payload, {
            onSuccess: () => {
                refetchFFInfo();
            },
            onError: () => {
                setSaveErrorState({
                    error: true,
                    retryFn: () => updatePrivatAvtale(payload),
                });
            },
        });
    };

    useEffect(() => {
        const subscription = watch((value, { name }) => {
            if (
                name === `${prefix}.${barnIndex}.privatAvtale.avtaleDato` &&
                value[prefix][barnIndex].privatAvtale.avtaleDato
            ) {
                const payload = { avtaleDato: value[prefix][barnIndex].privatAvtale.avtaleDato };
                updatePrivatAvtale(payload);
            }

            if (
                name === `${prefix}.${barnIndex}.privatAvtale.avtaleType` &&
                value[prefix][barnIndex].privatAvtale.avtaleType
            ) {
                const payload = {
                    avtaleType: value[prefix][barnIndex].privatAvtale.avtaleType as PrivatAvtaleType,
                };
                updatePrivatAvtale(payload);
            }

            if (
                name === `${prefix}.${barnIndex}.gjelderBarn.stønadstype` &&
                value[prefix][barnIndex].gjelderBarn.stønadstype
            ) {
                const payload = {
                    stønadstype: value[prefix][barnIndex].gjelderBarn.stønadstype as Stonadstype,
                };
                updatePrivatAvtale(payload);
            }
        });
        return () => subscription.unsubscribe();
    }, [updatePrivatAvtale]);

    const onToggle = (checked: boolean) => {
        updatePrivatAvtale({ skalIndeksreguleres: checked });
    };

    const kanIndeksregulere =
        item.privatAvtale?.gjelderUtland === false ||
        item.privatAvtale.perioder.every((periode) => periode.valutakode === null || periode.valutakode === "NOK");

    const sammeBarnFinnesMedMotsattStønadstype = søknadsBarnAndAndreBarn.some(
        (barn) =>
            barn.gjelderBarn.ident === item.gjelderBarn.ident &&
            barn.gjelderBarn.stønadstype === konverterMotsattStønadstype[item.gjelderBarn.stønadstype],
    );

    const barnetFyller18ÅrFørBeregnTilDato = useMemo(() => {
        const firstMonth18YearsOld = getFirstDayOfMonthAfterEighteenYears(new Date(item.gjelderBarn.fødselsdato));
        const beregnTilDato = dateOrNull(virkningstidspunkt.beregnTilDato);
        if (!beregnTilDato) {
            return true;
        }
        return isAfterDate(beregnTilDato, firstMonth18YearsOld);
    }, [søknadsBarnAndAndreBarn, item.gjelderBarn.ident, item.gjelderBarn.stønadstype]);

    const slettingVilFjerneRevurderingsbarn =
        selectedRolle?.harLøpendeBidrag === false && selectedRolle?.erRevurdering === true;
    const slettPrivatAvtaleVarseltekst = slettingVilFjerneRevurderingsbarn
        ? text.varsel.ønskerDuÅSlettePrivatAvtaleRevurderingsbarn
        : text.varsel.ønskerDuÅSlettePrivatAvtale;

    if (!privatAvtaleItem) {
        return null;
    }
    return (
        <>
            <FlexRow className="justify-between">
                <div className="flex flex-row gap-2">
                    <FormControlledMonthPicker
                        name={`${prefix}.${barnIndex}.privatAvtale.avtaleDato`}
                        label={text.label.avtaleDato}
                        placeholder="DD.MM.ÅÅÅÅ"
                        defaultValue={initialValues[prefix][barnIndex]?.privatAvtale?.avtaleDato ?? null}
                        fromDate={fom}
                        toDate={tom}
                        readonly={lesemodus || vedtakFraNav}
                        required
                    />
                    <FormControlledSelectField
                        name={`${prefix}.${barnIndex}.privatAvtale.avtaleType`}
                        label={"Avtaletype"}
                        className="w-max max-h-[10px]"
                    >
                        {Object.keys(PrivatAvtaleType)
                            .filter((value) =>
                                value === PrivatAvtaleType.VEDTAK_FRA_NAV
                                    ? !!manuelleVedtak?.vedtaksliste?.length
                                    : true,
                            )
                            .map((value) => (
                                <option key={value} value={value}>
                                    {hentVisningsnavn(value)}
                                </option>
                            ))}
                    </FormControlledSelectField>
                    {prefix === "andreBarn" && (
                        <FormControlledSelectField
                            name={`${prefix}.${barnIndex}.gjelderBarn.stønadstype`}
                            className="w-fit h-max"
                            label={"Stønadstype"}
                            disabled={
                                lesemodus ||
                                vedtakFraNav ||
                                sammeBarnFinnesMedMotsattStønadstype ||
                                !barnetFyller18ÅrFørBeregnTilDato
                            }
                            options={[
                                {
                                    value: "BIDRAG",
                                    text: "Bidrag",
                                },
                                {
                                    value: "BIDRAG18AAR",
                                    text: "Bidrag 18 år",
                                },
                            ]}
                        />
                    )}
                </div>
                <RemoveButton onDelete={onDeletePrivatAvtale} confirmationDescription={slettPrivatAvtaleVarseltekst} />
            </FlexRow>
            {!vedtakFraNav && (
                <Perioder
                    prefix={prefix}
                    barnIndex={barnIndex}
                    privatAvtaleItem={item.privatAvtale}
                    valideringsfeil={valideringsfeil}
                />
            )}
            {vedtakFraNav && (
                <VedtaksListe
                    barnIdent={item.gjelderBarn.ident}
                    omgjøring={false}
                    vedtaksLista={manuelleVedtak.vedtaksliste}
                    valgVedtak={manuelleVedtak.valgtVedtak}
                />
            )}
            <FlexRow>
                <FormControlledSwitch
                    name={`${prefix}.${barnIndex}.privatAvtale.skalIndeksreguleres`}
                    legend={text.label.skalIndeksreguleres}
                    onChange={onToggle}
                    readOnly={!item.privatAvtale?.perioder?.length || vedtakFraNav || !kanIndeksregulere}
                />
            </FlexRow>
            {item.privatAvtale.skalIndeksreguleres && beregnetPrivatAvtale?.perioder && (
                <BeregnetTabel perioder={beregnetPrivatAvtale.perioder} />
            )}
        </>
    );
};
