import {
    type PrivatAvtaleValideringsfeilDto,
    Rolletype,
    type SamvaerValideringsfeilDto,
    Vedtakstype,
    type VirkningstidspunktFeilV2Dto,
} from "@bidrag/api/BidragBehandlingApiV1";
import { PersonNavnIdent, StringUtils } from "@bidrag/common";
import { Alert, Heading } from "@navikt/ds-react";
import type React from "react";
import { Fragment, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router";
import { MenuButton, SideMenu } from "../../common/components/SideMenu/SideMenu";
import behandlingQueryKeys, {
    toUnderholdskostnadTabQueryParameter,
    toUnderholdskostnadTabQueryParameterForUnderhold,
} from "../../common/constants/behandlingQueryKeys";
import elementIds from "../../common/constants/elementIds";
import text from "../../common/constants/texts";
import { useBehandlingProvider } from "../../common/context/BehandlingContext";
import {
    checkForValidationErrors,
    checkIfRolleHasValideringsfeil,
    erDelAvValgtSaksnummer,
    getSaksnummerForIdent,
    inntektPageHasValideringsFeil,
} from "../../common/helpers/inntektFormHelpers";
import { shouldShowGrunnlagLoadingProgressbar } from "../../common/helpers/shouldShowGrunnlagProgressbar";
import { useGetBehandlingV2 } from "../../common/hooks/useApiData";
import { STEPS } from "../constants/steps";
import { BarnebidragStepper } from "../enum/BarnebidragStepper";

const VirkingstidspunktMenuButton = ({ activeButton, step }: { activeButton: string; step: string }) => {
    const { onStepChange, vurderSeparatVirkningstidspunkt, isGrunnlagLoading, selectedSaksnummer } =
        useBehandlingProvider();
    const { virkningstidspunktV3: virkningstidspunkt, lesemodus } = useGetBehandlingV2();

    const barnIValgtSak = virkningstidspunkt.barn.filter((b) =>
        erDelAvValgtSaksnummer(b.rolle.saksnummer, selectedSaksnummer, b.rolle.rolletype),
    );

    const checkForValidationErrorInVirkningstidspunkt = (valideringsfeil: VirkningstidspunktFeilV2Dto) => {
        return (
            valideringsfeil?.manglerVirkningstidspunkt ||
            valideringsfeil?.manglerBegrunnelse ||
            valideringsfeil?.manglerOpphørsdato ||
            valideringsfeil?.kanIkkeSetteOpphørsdatoEtterEtterfølgendeVedtak ||
            valideringsfeil?.manglerÅrsakEllerAvslag ||
            valideringsfeil?.måVelgeVedtakForBeregning ||
            valideringsfeil?.manglerVurderingAvSkolegang ||
            valideringsfeil?.virkningstidspunktKanIkkeVæreSenereEnnOpprinnelig
        );
    };

    const displaySubmenu = vurderSeparatVirkningstidspunkt && barnIValgtSak.length > 1;

    return (
        <MenuButton
            step={step}
            title={text.title.virkningstidspunkt}
            onStepChange={() => onStepChange(STEPS[BarnebidragStepper.VIRKNINGSTIDSPUNKT])}
            active={activeButton?.includes(BarnebidragStepper.VIRKNINGSTIDSPUNKT)}
            loading={isGrunnlagLoading && shouldShowGrunnlagLoadingProgressbar(BarnebidragStepper.VIRKNINGSTIDSPUNKT)}
            valideringsfeil={
                !lesemodus &&
                barnIValgtSak.some((b) => checkForValidationErrorInVirkningstidspunkt(b.valideringsfeilV2))
            }
            subMenu={
                displaySubmenu &&
                [...barnIValgtSak]
                    .sort((a, b) => (a.rolle.saksnummer ?? "").localeCompare(b.rolle.saksnummer ?? ""))
                    .map((b) => (
                        <Fragment key={b.rolle.id}>
                            <MenuButton
                                title={
                                    <div className="flex flex-row gap-1">
                                        {Rolletype.BA} <PersonNavnIdent ident={b.rolle.ident} variant="navnIdent" />
                                    </div>
                                }
                                onStepChange={() =>
                                    onStepChange(STEPS[BarnebidragStepper.VIRKNINGSTIDSPUNKT], {
                                        [behandlingQueryKeys.tab]: b.rolle.id.toString(),
                                    })
                                }
                                size="small"
                                valideringsfeil={
                                    !lesemodus && checkForValidationErrorInVirkningstidspunkt(b.valideringsfeilV2)
                                }
                                active={
                                    activeButton === `${BarnebidragStepper.VIRKNINGSTIDSPUNKT}.${b.rolle.id.toString()}`
                                }
                            />
                        </Fragment>
                    ))
            }
        />
    );
};

const VedtakEndeligMenuButton = ({ activeButton, step }: { activeButton: string; step: string }) => {
    const { onStepChange, isGrunnlagLoading } = useBehandlingProvider();
    return (
        <MenuButton
            step={step}
            title={text.title.vedtak}
            onStepChange={() => onStepChange(STEPS[BarnebidragStepper.VEDTAK_ENDELIG])}
            active={activeButton === BarnebidragStepper.VEDTAK_ENDELIG}
            loading={
                isGrunnlagLoading &&
                activeButton === BarnebidragStepper.VEDTAK_ENDELIG &&
                shouldShowGrunnlagLoadingProgressbar(BarnebidragStepper.VEDTAK_ENDELIG)
            }
        />
    );
};
const KlageVedtakMenuButton = ({ activeButton, step }: { activeButton: string; step: string }) => {
    const { onStepChange, isGrunnlagLoading } = useBehandlingProvider();
    const { vedtakstype } = useGetBehandlingV2();
    return (
        <MenuButton
            step={step}
            title={vedtakstype === Vedtakstype.KLAGE ? text.title.klagevedtak : text.title.omgjøringsvedtak}
            onStepChange={() => onStepChange(STEPS[BarnebidragStepper.KLAGEVEDTAK])}
            active={activeButton === BarnebidragStepper.KLAGEVEDTAK}
            loading={isGrunnlagLoading && shouldShowGrunnlagLoadingProgressbar(BarnebidragStepper.KLAGEVEDTAK)}
        />
    );
};
const VedtakMenuButton = ({ activeButton, step }: { activeButton: string; step: string }) => {
    const { onStepChange, isGrunnlagLoading } = useBehandlingProvider();
    return (
        <MenuButton
            step={step}
            title={text.title.vedtak}
            onStepChange={() => onStepChange(STEPS[BarnebidragStepper.VEDTAK])}
            active={activeButton === BarnebidragStepper.VEDTAK}
            loading={isGrunnlagLoading && shouldShowGrunnlagLoadingProgressbar(BarnebidragStepper.VEDTAK)}
        />
    );
};

const checkForValidationErrorInPrivatAvtale = (valideringsfeil?: PrivatAvtaleValideringsfeilDto | null) =>
    !!(
        valideringsfeil?.manglerBegrunnelse ||
        valideringsfeil?.manglerAvtaledato ||
        valideringsfeil?.manglerAvtaletype ||
        valideringsfeil?.finnesPerioderFør18Årsdag ||
        valideringsfeil?.finnesPerioderEtter18Årsdag ||
        valideringsfeil?.måVelgeVedtakHvisAvtaletypeErVedtakFraNav ||
        valideringsfeil?.ingenLøpendePeriode ||
        valideringsfeil?.harPeriodiseringsfeil ||
        (valideringsfeil?.overlappendePerioder?.length ?? 0) > 0
    );

const PrivatAvtaleMenuButton = ({
    activeButton,
    step,
    interactive,
}: {
    activeButton: string;
    step: string;
    interactive: boolean;
}) => {
    const { onStepChange, lesemodus, isGrunnlagLoading, selectedSaksnummer } = useBehandlingProvider();
    const { vedtakstype, privatAvtaleV3, roller } = useGetBehandlingV2();

    const privatAvtaleHasValideringsFeil = !!privatAvtaleV3?.søknadsbarn
        ?.filter((søknadsbarn) =>
            erDelAvValgtSaksnummer(
                søknadsbarn.privatAvtale?.valideringsfeil?.gjelderPerson?.saksnummer ??
                    getSaksnummerForIdent(roller, søknadsbarn.gjelderBarn.ident),
                selectedSaksnummer,
                Rolletype.BA,
            ),
        )
        .some((søknadsbarn) => checkForValidationErrorInPrivatAvtale(søknadsbarn.privatAvtale?.valideringsfeil));

    return (
        <MenuButton
            step={step}
            interactive={interactive}
            title={vedtakstype === Vedtakstype.INNKREVING ? text.title.innkreving : text.title.privatAvtale}
            onStepChange={() => onStepChange(STEPS[BarnebidragStepper.PRIVAT_AVTALE])}
            active={activeButton === BarnebidragStepper.PRIVAT_AVTALE}
            loading={isGrunnlagLoading && shouldShowGrunnlagLoadingProgressbar(BarnebidragStepper.PRIVAT_AVTALE)}
            valideringsfeil={!lesemodus && privatAvtaleHasValideringsFeil}
        />
    );
};

const UnderholdskostnadMenuButton = ({
    activeButton,
    step,
    interactive,
}: {
    activeButton: string;
    step: string;
    interactive: boolean;
}) => {
    const { onStepChange, lesemodus, isGrunnlagLoading, selectedSaksnummer } = useBehandlingProvider();
    const { underholdskostnader, roller } = useGetBehandlingV2();
    const underholdskostnaderMedBarnMedIBehandling = underholdskostnader
        .filter((underhold) => underhold.gjelderBarn.medIBehandlingen)
        .filter((underhold) =>
            erDelAvValgtSaksnummer(getSaksnummerForIdent(roller, underhold.gjelderBarn.ident), selectedSaksnummer),
        )
        .sort((a, b) =>
            getSaksnummerForIdent(roller, a.gjelderBarn.ident).localeCompare(
                getSaksnummerForIdent(roller, b.gjelderBarn.ident),
            ),
        );
    const underholdskostnaderAndreBarn = underholdskostnader.filter(
        (underhold) => !underhold.gjelderBarn.medIBehandlingen,
    );

    const underholdskostnadHasValideringsFeil = underholdskostnaderMedBarnMedIBehandling.some(({ valideringsfeil }) => {
        return (
            valideringsfeil?.manglerBegrunnelse ||
            valideringsfeil?.manglerPerioderForTilsynsordning ||
            !!valideringsfeil?.faktiskTilsynsutgift ||
            !!valideringsfeil?.stønadTilBarnetilsyn ||
            !!valideringsfeil?.tilleggsstønad ||
            !!valideringsfeil?.tilleggsstønadsperioderUtenFaktiskTilsynsutgift.length
        );
    });

    const underholdskostnadAndreBarnHasValideringsFeil = underholdskostnaderAndreBarn.some(({ valideringsfeil }) => {
        return valideringsfeil?.manglerBegrunnelse || !!valideringsfeil?.faktiskTilsynsutgift;
    });

    return (
        <MenuButton
            step={step}
            title={text.title.underholdskostnad}
            interactive={interactive}
            valideringsfeil={!lesemodus && (underholdskostnadHasValideringsFeil || underholdskostnadAndreBarnHasValideringsFeil)}
            onStepChange={() => onStepChange(STEPS[BarnebidragStepper.UNDERHOLDSKOSTNAD])}
            active={activeButton?.includes(BarnebidragStepper.UNDERHOLDSKOSTNAD)}
            loading={isGrunnlagLoading && shouldShowGrunnlagLoadingProgressbar(BarnebidragStepper.UNDERHOLDSKOSTNAD)}
            subMenu={underholdskostnaderMedBarnMedIBehandling
                .map((underhold) => (
                    <Fragment key={underhold.id}>
                        <MenuButton
                            title={
                                <div className="flex flex-row gap-1">
                                    {"BA "} <PersonNavnIdent ident={underhold.gjelderBarn.ident} variant="navnIdent" />
                                </div>
                            }
                            onStepChange={() =>
                                onStepChange(STEPS[BarnebidragStepper.UNDERHOLDSKOSTNAD], {
                                    [behandlingQueryKeys.tab]:
                                        toUnderholdskostnadTabQueryParameterForUnderhold(underhold),
                                })
                            }
                            interactive={interactive}
                            size="small"
                            valideringsfeil={
                                !lesemodus &&
                                (underhold.valideringsfeil?.manglerBegrunnelse ||
                                    underhold.valideringsfeil?.manglerPerioderForTilsynsordning ||
                                    !!underhold.valideringsfeil?.faktiskTilsynsutgift ||
                                    !!underhold.valideringsfeil?.stønadTilBarnetilsyn ||
                                    !!underhold.valideringsfeil?.tilleggsstønad ||
                                    !!underhold.valideringsfeil?.tilleggsstønadsperioderUtenFaktiskTilsynsutgift.length)
                            }
                            active={
                                activeButton ===
                                `${BarnebidragStepper.UNDERHOLDSKOSTNAD}.${toUnderholdskostnadTabQueryParameterForUnderhold(underhold)}`
                            }
                            hideSubMenu
                            subMenu={
                                <>
                                    {underhold.harTilsynsordning && (
                                        <>
                                            <MenuButton
                                                title={text.title.stønadTilBarnetilsyn}
                                                onStepChange={() =>
                                                    onStepChange(
                                                        STEPS[BarnebidragStepper.UNDERHOLDSKOSTNAD],
                                                        {
                                                            [behandlingQueryKeys.tab]:
                                                                toUnderholdskostnadTabQueryParameterForUnderhold(
                                                                    underhold,
                                                                ),
                                                        },
                                                        elementIds.seksjon_underholdskostnad_barnetilsyn,
                                                    )
                                                }
                                                interactive={interactive}
                                                valideringsfeil={
                                                    !lesemodus &&
                                                    (underhold.valideringsfeil?.stønadTilBarnetilsyn
                                                        ?.harIngenPerioder ||
                                                        underhold.valideringsfeil?.stønadTilBarnetilsyn
                                                            ?.manglerPerioderForTilsynsutgifter ||
                                                        !!underhold?.valideringsfeil?.stønadTilBarnetilsyn
                                                            ?.overlappendePerioder.length ||
                                                        !!underhold?.valideringsfeil?.stønadTilBarnetilsyn
                                                            ?.fremtidigePerioder.length)
                                                }
                                                size="small"
                                                active={
                                                    activeButton ===
                                                    `${BarnebidragStepper.UNDERHOLDSKOSTNAD}.${toUnderholdskostnadTabQueryParameterForUnderhold(underhold)}`
                                                }
                                            />
                                            <MenuButton
                                                title={text.title.faktiskeTilsynsutgifter}
                                                onStepChange={() =>
                                                    onStepChange(
                                                        STEPS[BarnebidragStepper.UNDERHOLDSKOSTNAD],
                                                        {
                                                            [behandlingQueryKeys.tab]:
                                                                toUnderholdskostnadTabQueryParameterForUnderhold(
                                                                    underhold,
                                                                ),
                                                        },
                                                        elementIds.seksjon_underholdskostnad_tilysnsutgifter,
                                                    )
                                                }
                                                interactive={interactive}
                                                valideringsfeil={
                                                    !lesemodus &&
                                                    (underhold.valideringsfeil?.faktiskTilsynsutgift
                                                        ?.harIngenPerioder ||
                                                        underhold.valideringsfeil?.faktiskTilsynsutgift
                                                            ?.manglerPerioderForTilsynsutgifter ||
                                                        !!underhold?.valideringsfeil?.faktiskTilsynsutgift
                                                            ?.overlappendePerioder.length ||
                                                        !!underhold?.valideringsfeil?.faktiskTilsynsutgift
                                                            ?.fremtidigePerioder.length)
                                                }
                                                size="small"
                                                active={
                                                    activeButton ===
                                                    `${BarnebidragStepper.UNDERHOLDSKOSTNAD}.${toUnderholdskostnadTabQueryParameterForUnderhold(underhold)}`
                                                }
                                            />
                                            <MenuButton
                                                title={text.title.tilleggsstønad}
                                                onStepChange={() =>
                                                    onStepChange(
                                                        STEPS[BarnebidragStepper.UNDERHOLDSKOSTNAD],
                                                        {
                                                            [behandlingQueryKeys.tab]:
                                                                toUnderholdskostnadTabQueryParameterForUnderhold(
                                                                    underhold,
                                                                ),
                                                        },
                                                        elementIds.seksjon_underholdskostnad_tilleggstønad,
                                                    )
                                                }
                                                interactive={interactive}
                                                valideringsfeil={
                                                    !lesemodus &&
                                                    (underhold.valideringsfeil?.tilleggsstønad?.harIngenPerioder ||
                                                        underhold.valideringsfeil?.tilleggsstønad
                                                            ?.manglerPerioderForTilsynsutgifter ||
                                                        !!underhold?.valideringsfeil?.tilleggsstønad
                                                            ?.overlappendePerioder.length ||
                                                        !!underhold?.valideringsfeil?.tilleggsstønad?.fremtidigePerioder
                                                            .length)
                                                }
                                                size="small"
                                                active={
                                                    activeButton ===
                                                    `${BarnebidragStepper.UNDERHOLDSKOSTNAD}.${toUnderholdskostnadTabQueryParameterForUnderhold(underhold)}`
                                                }
                                            />
                                        </>
                                    )}
                                    <MenuButton
                                        title={text.title.underholdskostnad}
                                        onStepChange={() =>
                                            onStepChange(
                                                STEPS[BarnebidragStepper.UNDERHOLDSKOSTNAD],
                                                {
                                                    [behandlingQueryKeys.tab]:
                                                        toUnderholdskostnadTabQueryParameterForUnderhold(underhold),
                                                },
                                                elementIds.seksjon_underholdskostnad_beregnet,
                                            )
                                        }
                                        interactive={interactive}
                                        size="small"
                                        active={
                                            activeButton ===
                                            `${BarnebidragStepper.UNDERHOLDSKOSTNAD}.${toUnderholdskostnadTabQueryParameterForUnderhold(underhold)}`
                                        }
                                    />
                                </>
                            }
                        />
                    </Fragment>
                ))
                .concat(
                    <MenuButton
                        key="andreBarn"
                        title={text.label.andreBarn}
                        onStepChange={() =>
                            onStepChange(STEPS[BarnebidragStepper.UNDERHOLDSKOSTNAD], {
                                [behandlingQueryKeys.tab]: toUnderholdskostnadTabQueryParameter(),
                            })
                        }
                        interactive={interactive}
                        valideringsfeil={!lesemodus && underholdskostnadAndreBarnHasValideringsFeil}
                        size="small"
                        active={
                            activeButton ===
                            `${BarnebidragStepper.UNDERHOLDSKOSTNAD}.${toUnderholdskostnadTabQueryParameter()}`
                        }
                    />,
                )}
        />
    );
};

const InntektMenuButton = ({
    activeButton,
    step,
    interactive,
}: {
    activeButton: string;
    step: string;
    interactive: boolean;
}) => {
    const { onStepChange, lesemodus, isGrunnlagLoading, selectedSaksnummer } = useBehandlingProvider();
    const { inntekterV2: inntekter, ikkeAktiverteEndringerIGrunnlagsdata, roller } = useGetBehandlingV2();

    const inntekterIkkeAktiverteEndringer =
        !!ikkeAktiverteEndringerIGrunnlagsdata?.inntekter &&
        Object.values(ikkeAktiverteEndringerIGrunnlagsdata.inntekter).some((inntekt) =>
            inntekt.some((endring) => {
                const gjelderBarnNotEmpty = StringUtils.isEmpty(inntekt.gjelderBarn) ? null : inntekt.gjelderBarn;
                const rolle = roller.find((r) => r.ident === (gjelderBarnNotEmpty ?? endring.ident));
                return erDelAvValgtSaksnummer(rolle?.saksnummer, selectedSaksnummer, rolle?.rolletype);
            }),
        );

    const sortedInntekter = [...inntekter]
        .filter((inntektRolle) =>
            erDelAvValgtSaksnummer(inntektRolle.gjelder.saksnummer, selectedSaksnummer, inntektRolle.gjelder.rolletype),
        )
        .sort((a, b) => {
            const rolleTypeWeight = (rolletype: Rolletype) =>
                rolletype === Rolletype.BM ? 0 : rolletype === Rolletype.BP ? 1 : 2;
            const weightDiff = rolleTypeWeight(a.gjelder.rolletype) - rolleTypeWeight(b.gjelder.rolletype);
            if (weightDiff !== 0) return weightDiff;
            return getSaksnummerForIdent(roller, a.gjelder.ident).localeCompare(
                getSaksnummerForIdent(roller, b.gjelder.ident),
            );
        });

    return (
        <MenuButton
            step={step}
            title={text.title.inntekt}
            onStepChange={() => onStepChange(STEPS[BarnebidragStepper.INNTEKT])}
            interactive={interactive}
            active={activeButton?.includes(BarnebidragStepper.INNTEKT)}
            loading={isGrunnlagLoading && shouldShowGrunnlagLoadingProgressbar(BarnebidragStepper.INNTEKT)}
            valideringsfeil={!lesemodus && inntektPageHasValideringsFeil(sortedInntekter)}
            unconfirmedUpdates={!lesemodus && inntekterIkkeAktiverteEndringer}
            subMenu={sortedInntekter.map((inntektRolle) => (
                <Fragment key={inntektRolle.gjelder.id}>
                    <MenuButton
                        title={
                            <div className="flex flex-row gap-1">
                                {inntektRolle.gjelder.rolletype}{" "}
                                <PersonNavnIdent ident={inntektRolle.gjelder.ident} variant="navnIdent" />
                            </div>
                        }
                        onStepChange={() =>
                            onStepChange(STEPS[BarnebidragStepper.INNTEKT], {
                                [behandlingQueryKeys.tab]: inntektRolle.gjelder.id.toString(),
                            })
                        }
                        interactive={interactive}
                        size="small"
                        valideringsfeil={
                            !lesemodus &&
                            inntektPageHasValideringsFeil &&
                            checkIfRolleHasValideringsfeil(inntektRolle.inntekter?.valideringsfeil)
                        }
                        unconfirmedUpdates={
                            !lesemodus &&
                            inntekterIkkeAktiverteEndringer &&
                            Object.values(ikkeAktiverteEndringerIGrunnlagsdata.inntekter).some((inntekter) =>
                                inntekter.some((inntekt) => inntekt.ident === inntektRolle.gjelder.ident),
                            )
                        }
                        active={activeButton === `${BarnebidragStepper.INNTEKT}.${inntektRolle.gjelder.id.toString()}`}
                        hideSubMenu
                        subMenu={
                            inntektRolle.gjelder.rolletype === Rolletype.BM ? (
                                <>
                                    <MenuButton
                                        title={text.title.skattepliktigeogPensjonsgivendeInntekt}
                                        onStepChange={() =>
                                            onStepChange(
                                                STEPS[BarnebidragStepper.INNTEKT],
                                                {
                                                    [behandlingQueryKeys.tab]: inntektRolle.gjelder.id.toString(),
                                                },
                                                elementIds.seksjon_inntekt_skattepliktig,
                                            )
                                        }
                                        interactive={interactive}
                                        valideringsfeil={
                                            !lesemodus &&
                                            checkForValidationErrors(
                                                inntektRolle.inntekter?.valideringsfeil?.årsinntekter,
                                            )
                                        }
                                        unconfirmedUpdates={
                                            !lesemodus &&
                                            ikkeAktiverteEndringerIGrunnlagsdata?.inntekter?.årsinntekter?.some(
                                                (inntekt) => inntekt.ident === inntektRolle.gjelder.ident,
                                            )
                                        }
                                        size="small"
                                        active={
                                            activeButton ===
                                            `${BarnebidragStepper.INNTEKT}.${inntektRolle.gjelder.id.toString()}`
                                        }
                                    />
                                    <MenuButton
                                        title={text.title.barnetillegg}
                                        onStepChange={() =>
                                            onStepChange(
                                                STEPS[BarnebidragStepper.INNTEKT],
                                                {
                                                    [behandlingQueryKeys.tab]: inntektRolle.gjelder.id.toString(),
                                                },
                                                elementIds.seksjon_inntekt_barnetillegg,
                                            )
                                        }
                                        interactive={interactive}
                                        size="small"
                                        active={
                                            activeButton ===
                                            `${BarnebidragStepper.INNTEKT}.${inntektRolle.gjelder.id.toString()}`
                                        }
                                        valideringsfeil={
                                            !lesemodus &&
                                            inntektRolle.inntekter?.valideringsfeil?.barnetillegg?.some(
                                                (inntektValideringsfeil) =>
                                                    checkForValidationErrors(inntektValideringsfeil),
                                            )
                                        }
                                        unconfirmedUpdates={
                                            !lesemodus &&
                                            !!ikkeAktiverteEndringerIGrunnlagsdata?.inntekter?.barnetillegg?.some(
                                                (inntekt) => inntekt.ident === inntektRolle.gjelder.ident,
                                            )
                                        }
                                    />
                                    <MenuButton
                                        title={text.title.utvidetBarnetrygd}
                                        onStepChange={() =>
                                            onStepChange(
                                                STEPS[BarnebidragStepper.INNTEKT],
                                                {
                                                    [behandlingQueryKeys.tab]: inntektRolle.gjelder.id.toString(),
                                                },
                                                elementIds.seksjon_inntekt_utvidetbarnetrygd,
                                            )
                                        }
                                        interactive={interactive}
                                        size="small"
                                        active={
                                            activeButton ===
                                            `${BarnebidragStepper.INNTEKT}.${inntektRolle.gjelder.id.toString()}`
                                        }
                                        valideringsfeil={
                                            !lesemodus &&
                                            checkForValidationErrors(
                                                inntektRolle.inntekter?.valideringsfeil?.utvidetBarnetrygd,
                                            )
                                        }
                                        unconfirmedUpdates={
                                            !lesemodus &&
                                            !!ikkeAktiverteEndringerIGrunnlagsdata?.inntekter?.utvidetBarnetrygd?.length
                                        }
                                    />
                                    <MenuButton
                                        title={text.title.småbarnstillegg}
                                        onStepChange={() =>
                                            onStepChange(
                                                STEPS[BarnebidragStepper.INNTEKT],
                                                {
                                                    [behandlingQueryKeys.tab]: inntektRolle.gjelder.id.toString(),
                                                },
                                                elementIds.seksjon_inntekt_småbarnstillegg,
                                            )
                                        }
                                        interactive={interactive}
                                        size="small"
                                        active={
                                            activeButton ===
                                            `${BarnebidragStepper.INNTEKT}.${inntektRolle.gjelder.id.toString()}`
                                        }
                                        valideringsfeil={
                                            !lesemodus &&
                                            checkForValidationErrors(
                                                inntektRolle.inntekter?.valideringsfeil?.småbarnstillegg,
                                            )
                                        }
                                        unconfirmedUpdates={
                                            !lesemodus &&
                                            !!ikkeAktiverteEndringerIGrunnlagsdata?.inntekter?.småbarnstillegg?.length
                                        }
                                    />
                                    <MenuButton
                                        title={text.title.kontantstøtte}
                                        onStepChange={() =>
                                            onStepChange(
                                                STEPS[BarnebidragStepper.INNTEKT],
                                                {
                                                    [behandlingQueryKeys.tab]: inntektRolle.gjelder.id.toString(),
                                                },
                                                elementIds.seksjon_inntekt_kontantstøtte,
                                            )
                                        }
                                        interactive={interactive}
                                        size="small"
                                        active={
                                            activeButton ===
                                            `${BarnebidragStepper.INNTEKT}.${inntektRolle.gjelder.id.toString()}`
                                        }
                                        valideringsfeil={
                                            !lesemodus &&
                                            inntektRolle.inntekter?.valideringsfeil?.kontantstøtte?.some(
                                                (inntektValideringsfeil) =>
                                                    checkForValidationErrors(inntektValideringsfeil),
                                            )
                                        }
                                        unconfirmedUpdates={
                                            !lesemodus &&
                                            !!ikkeAktiverteEndringerIGrunnlagsdata?.inntekter?.kontantstøtte?.length
                                        }
                                    />
                                </>
                            ) : inntektRolle.gjelder.rolletype === Rolletype.BP ? (
                                <>
                                    <MenuButton
                                        title={text.title.skattepliktigeogPensjonsgivendeInntekt}
                                        onStepChange={() =>
                                            onStepChange(
                                                STEPS[BarnebidragStepper.INNTEKT],
                                                {
                                                    [behandlingQueryKeys.tab]: inntektRolle.gjelder.id.toString(),
                                                },
                                                elementIds.seksjon_inntekt_skattepliktig,
                                            )
                                        }
                                        interactive={interactive}
                                        valideringsfeil={
                                            !lesemodus &&
                                            checkForValidationErrors(
                                                inntektRolle.inntekter?.valideringsfeil?.årsinntekter,
                                            )
                                        }
                                        unconfirmedUpdates={
                                            !lesemodus &&
                                            ikkeAktiverteEndringerIGrunnlagsdata?.inntekter?.årsinntekter?.some(
                                                (inntekt) => inntekt.ident === inntektRolle.gjelder.ident,
                                            )
                                        }
                                        size="small"
                                        active={
                                            activeButton ===
                                            `${BarnebidragStepper.INNTEKT}.${inntektRolle.gjelder.id.toString()}`
                                        }
                                    />
                                    <MenuButton
                                        title={text.title.barnetillegg}
                                        onStepChange={() =>
                                            onStepChange(
                                                STEPS[BarnebidragStepper.INNTEKT],
                                                {
                                                    [behandlingQueryKeys.tab]: inntektRolle.gjelder.id.toString(),
                                                },
                                                elementIds.seksjon_inntekt_barnetillegg,
                                            )
                                        }
                                        interactive={interactive}
                                        size="small"
                                        active={
                                            activeButton ===
                                            `${BarnebidragStepper.INNTEKT}.${inntektRolle.gjelder.id.toString()}`
                                        }
                                        valideringsfeil={
                                            !lesemodus &&
                                            inntektRolle.inntekter?.valideringsfeil?.barnetillegg?.some(
                                                (inntektValideringsfeil) =>
                                                    checkForValidationErrors(inntektValideringsfeil),
                                            )
                                        }
                                        unconfirmedUpdates={
                                            !lesemodus &&
                                            !!ikkeAktiverteEndringerIGrunnlagsdata?.inntekter?.barnetillegg?.some(
                                                (inntekt) => inntekt.ident === inntektRolle.gjelder.ident,
                                            )
                                        }
                                    />
                                </>
                            ) : (
                                <MenuButton
                                    title={text.title.skattepliktigeogPensjonsgivendeInntekt}
                                    onStepChange={() =>
                                        onStepChange(
                                            STEPS[BarnebidragStepper.INNTEKT],
                                            {
                                                [behandlingQueryKeys.tab]: inntektRolle.gjelder.id.toString(),
                                            },
                                            elementIds.seksjon_inntekt_skattepliktig,
                                        )
                                    }
                                    interactive={interactive}
                                    size="small"
                                    active={
                                        activeButton ===
                                        `${BarnebidragStepper.INNTEKT}.${inntektRolle.gjelder.id.toString()}`
                                    }
                                    valideringsfeil={
                                        !lesemodus &&
                                        checkForValidationErrors(inntektRolle.inntekter?.valideringsfeil?.årsinntekter)
                                    }
                                    unconfirmedUpdates={
                                        !lesemodus &&
                                        ikkeAktiverteEndringerIGrunnlagsdata?.inntekter?.årsinntekter?.some(
                                            (inntekt) => inntekt.ident === inntektRolle.gjelder.ident,
                                        )
                                    }
                                />
                            )
                        }
                    />
                </Fragment>
            ))}
        />
    );
};

const BoforholdMenuButton = ({
    activeButton,
    step,
    interactive,
}: {
    activeButton: string;
    step: string;
    interactive: boolean;
}) => {
    const { onStepChange, lesemodus, isGrunnlagLoading } = useBehandlingProvider();
    const {
        boforhold: { valideringsfeil: boforholdValideringsfeil },
        ikkeAktiverteEndringerIGrunnlagsdata,
    } = useGetBehandlingV2();
    const husstandsmedlemIkkeAktiverteEndringer = !!ikkeAktiverteEndringerIGrunnlagsdata?.husstandsmedlem?.length;
    const andreVoksneIHusstandenIkkeAktiverteEndringer = !!ikkeAktiverteEndringerIGrunnlagsdata?.andreVoksneIHusstanden;
    const boforholdIkkeAktiverteEndringer =
        husstandsmedlemIkkeAktiverteEndringer || andreVoksneIHusstandenIkkeAktiverteEndringer;
    const boforholdValideringsFeil = !!boforholdValideringsfeil?.husstandsmedlem?.length;

    return (
        <MenuButton
            step={step}
            title={text.title.boforhold}
            onStepChange={() => onStepChange(STEPS[BarnebidragStepper.BOFORHOLD])}
            interactive={interactive}
            active={activeButton === BarnebidragStepper.BOFORHOLD}
            loading={isGrunnlagLoading && shouldShowGrunnlagLoadingProgressbar(BarnebidragStepper.BOFORHOLD)}
            valideringsfeil={!lesemodus && boforholdValideringsFeil}
            unconfirmedUpdates={!lesemodus && boforholdIkkeAktiverteEndringer}
        />
    );
};

const GebyrMenuButton = ({
    activeButton,
    step,
    interactive,
}: {
    activeButton: string;
    step: string;
    interactive: boolean;
}) => {
    const { onStepChange, lesemodus, isGrunnlagLoading } = useBehandlingProvider();
    const {
        gebyrV3: { saker },
    } = useGetBehandlingV2();
    const gebyrValideringsFeil = saker.some(
        (sak) => !!sak.gebyrRoller.some((gebyrRolle) => gebyrRolle?.valideringsfeil?.manglerBegrunnelse),
    );

    return (
        <MenuButton
            step={step}
            title={text.title.gebyr}
            onStepChange={() => onStepChange(STEPS[BarnebidragStepper.GEBYR])}
            interactive={interactive}
            active={activeButton === BarnebidragStepper.GEBYR}
            loading={isGrunnlagLoading && shouldShowGrunnlagLoadingProgressbar(BarnebidragStepper.GEBYR)}
            valideringsfeil={!lesemodus && gebyrValideringsFeil}
        />
    );
};

const SamværMenuButton = ({
    activeButton,
    step,
    interactive,
}: {
    activeButton: string;
    step: string;
    interactive: boolean;
}) => {
    const {
        onStepChange,
        lesemodus,
        vurderSeparatSamvær,
        isGrunnlagLoading,
        selectedSaksnummer,
        setSelectedSaksnummer,
    } = useBehandlingProvider();
    const { samværV2: samvær, roller } = useGetBehandlingV2();

    const checkForValidationErrorInSamvær = ({ valideringsfeil }: { valideringsfeil?: SamvaerValideringsfeilDto }) => {
        return (
            valideringsfeil?.manglerSamvær ||
            valideringsfeil?.manglerBegrunnelse ||
            valideringsfeil?.ingenLøpendeSamvær ||
            valideringsfeil?.harPeriodiseringsfeil ||
            valideringsfeil?.hullIPerioder?.length > 0 ||
            valideringsfeil?.overlappendePerioder?.length > 0
        );
    };
    const samværValideringsFeil = samvær.barn?.some(checkForValidationErrorInSamvær);
    const barnIValgtSak = samvær.barn.filter((barn) =>
        erDelAvValgtSaksnummer(getSaksnummerForIdent(roller, barn.gjelderBarn), selectedSaksnummer),
    );
    const displaySubmenu = vurderSeparatSamvær && barnIValgtSak.length > 1;

    return (
        <MenuButton
            step={step}
            title={text.title.samvær}
            interactive={interactive}
            onStepChange={() => onStepChange(STEPS[BarnebidragStepper.SAMVÆR])}
            active={activeButton?.includes(BarnebidragStepper.SAMVÆR)}
            loading={isGrunnlagLoading && shouldShowGrunnlagLoadingProgressbar(BarnebidragStepper.SAMVÆR)}
            valideringsfeil={!lesemodus && samværValideringsFeil}
            subMenu={
                displaySubmenu &&
                [...barnIValgtSak]
                    .sort((a, b) =>
                        getSaksnummerForIdent(roller, a.gjelderBarn).localeCompare(
                            getSaksnummerForIdent(roller, b.gjelderBarn),
                        ),
                    )
                    .map((barn) => (
                        <Fragment key={barn.id}>
                            <MenuButton
                                title={
                                    <div className="flex flex-row gap-1">
                                        {Rolletype.BA} <PersonNavnIdent ident={barn.gjelderBarn} variant="navnIdent" />
                                    </div>
                                }
                                onStepChange={() => {
                                    const saksnummer = getSaksnummerForIdent(roller, barn.gjelderBarn);
                                    if (saksnummer) {
                                        setSelectedSaksnummer(saksnummer);
                                    }

                                    onStepChange(STEPS[BarnebidragStepper.SAMVÆR], {
                                        [behandlingQueryKeys.tab]: barn.id.toString(),
                                    });
                                }}
                                interactive={interactive}
                                size="small"
                                valideringsfeil={!lesemodus && checkForValidationErrorInSamvær(barn)}
                                active={activeButton === `${BarnebidragStepper.SAMVÆR}.${barn.id.toString()}`}
                            />
                        </Fragment>
                    ))
            }
        />
    );
};

const menuButtonMap = {
    [BarnebidragStepper.VIRKNINGSTIDSPUNKT]: VirkingstidspunktMenuButton,
    [BarnebidragStepper.PRIVAT_AVTALE]: PrivatAvtaleMenuButton,
    [BarnebidragStepper.INNTEKT]: InntektMenuButton,
    [BarnebidragStepper.BOFORHOLD]: BoforholdMenuButton,
    [BarnebidragStepper.GEBYR]: GebyrMenuButton,
    [BarnebidragStepper.UNDERHOLDSKOSTNAD]: UnderholdskostnadMenuButton,
    [BarnebidragStepper.SAMVÆR]: SamværMenuButton,
    [BarnebidragStepper.VEDTAK]: VedtakMenuButton,
    [BarnebidragStepper.VEDTAK_ENDELIG]: VedtakEndeligMenuButton,
    [BarnebidragStepper.KLAGEVEDTAK]: KlageVedtakMenuButton,
} satisfies Record<string, React.ComponentType<never>>;

export const BarnebidragSideMenu = () => {
    const { sideMenu, setSelectedSaksnummer } = useBehandlingProvider();
    const { erVedtakFattet, lesemodus } = useGetBehandlingV2();

    const [searchParams] = useSearchParams();
    // Beregnes direkte under render (ikke via useState+useEffect) slik at den alltid er i
    // synk med URL-en umiddelbart - uten en ekstra render-runde via en effekt som kan komme
    // ut av fase når `searchParams` endres i rask rekkefølge (f.eks. rett etter en navigasjon
    // utløst av en feilmelding i ErrorSummary/VedtakWrapper).
    const activeButton = useMemo(() => {
        const step = searchParams.get(behandlingQueryKeys.steg);
        if (!step) return BarnebidragStepper.VIRKNINGSTIDSPUNKT;
        const tab = searchParams.get(behandlingQueryKeys.tab);
        return `${step}${tab ? `.${tab}` : ""}`;
    }, [searchParams]);

    // Synkroniserer `selectedSaksnummer` fra URL-en (brukt f.eks. når man klikker en feilmelding i
    // `ErrorSummary` (VedtakWrapper) som navigerer til et annet steg for en spesifikk rolle/barn i
    // en annen sak). Kilden (VedtakWrapper) sender saksnummeret direkte via `saksnummer`-parameteren,
    // så vi trenger ikke slå opp rollen selv basert på `tab`-verdien (som varierer i format per steg).
    // Skal kun trigges når selve `saksnummer`-parameteren endres - ikke når `selectedSaksnummer`
    // endres av andre årsaker (f.eks. når brukeren klikker en annen sak i `SakHeader`), ellers vil
    // effekten umiddelbart overstyre valget tilbake til saken som (fortsatt utdaterte)
    // `saksnummer`-parameteren peker på, slik at man ikke får byttet sak i headeren.
    const forrigeSaksnummerRef = useRef<string | null>(null);
    useEffect(() => {
        const saksnummer = searchParams.get(behandlingQueryKeys.saksnummer);
        if (saksnummer === forrigeSaksnummerRef.current) return;
        forrigeSaksnummerRef.current = saksnummer;
        if (saksnummer) setSelectedSaksnummer(saksnummer);
    }, [searchParams, setSelectedSaksnummer]);

    return (
        <div className="flex flex-col">
            <SideMenu
                otherChildren={
                    lesemodus &&
                    !erVedtakFattet && (
                        <Alert inline variant="info" size="small" className="mt-2">
                            <Heading level="3" size="xsmall">
                                Lesemodus
                            </Heading>
                            Behandlingen vises i lesemodus og kan derfor ikke endres
                        </Alert>
                    )
                }
            >
                {sideMenu
                    .filter((menu) => menu.visible)
                    .map((menuButton, index) => {
                        const Component = menuButtonMap[menuButton.step];
                        return (
                            <Component
                                key={index + menuButton.step}
                                activeButton={activeButton}
                                step={index + 1}
                                interactive={menuButton.interactive}
                            />
                        );
                    })}
            </SideMenu>
        </div>
    );
};
