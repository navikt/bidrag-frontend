import { Rolletype } from "@bidrag/api/BidragBehandlingApiV1";
import { PersonNavnIdent } from "@bidrag/common";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { MenuButton, SideMenu } from "../../common/components/SideMenu/SideMenu";
import behandlingQueryKeys from "../../common/constants/behandlingQueryKeys";
import elementIds from "../../common/constants/elementIds";
import text from "../../common/constants/texts";
import { useBehandlingProvider } from "../../common/context/BehandlingContext";
import { sortBehandlingRoller } from "../../common/helpers/behandlingRoller";
import { checkIfRolleHasValideringsfeil, inntektPageHasValideringsFeil } from "../../common/helpers/inntektFormHelpers";
import { shouldShowGrunnlagLoadingProgressbar } from "../../common/helpers/shouldShowGrunnlagProgressbar";
import { useGetBehandlingV2 } from "../../common/hooks/useApiData";
import { STEPS } from "../constants/steps";
import { SærligeutgifterStepper } from "../enum/SærligeutgifterStepper";

const UtgiftMenuButton = ({ activeButton, step }: { activeButton: string; step: string }) => {
    const { onStepChange, isGrunnlagLoading } = useBehandlingProvider();
    const {
        utgift: { valideringsfeil: utgiftValideringsfeil },
    } = useGetBehandlingV2();
    const utgiftHasValideringsfeil =
        utgiftValideringsfeil && Object.values(utgiftValideringsfeil).some((feil) => !!feil);

    return (
        <MenuButton
            step={step}
            title={text.title.utgift}
            onStepChange={() => onStepChange(STEPS[SærligeutgifterStepper.UTGIFT])}
            active={activeButton === SærligeutgifterStepper.UTGIFT}
            loading={isGrunnlagLoading && shouldShowGrunnlagLoadingProgressbar(SærligeutgifterStepper.UTGIFT)}
            valideringsfeil={utgiftHasValideringsfeil}
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
    const { onStepChange, isGrunnlagLoading, lesemodus } = useBehandlingProvider();
    const { inntekterV2, ikkeAktiverteEndringerIGrunnlagsdata, roller } = useGetBehandlingV2();
    const inntektRoller = roller.sort(sortBehandlingRoller);

    // const inntektHasValideringsFeil = inntektValideringsfeil && !!Object.keys(inntektValideringsfeil).length;
    const inntekterIkkeAktiverteEndringer =
        !!ikkeAktiverteEndringerIGrunnlagsdata?.inntekter &&
        Object.values(ikkeAktiverteEndringerIGrunnlagsdata.inntekter).some((inntekt) => !!inntekt.length);

    return (
        <MenuButton
            step={step}
            title={text.title.inntekt}
            onStepChange={() => onStepChange(STEPS[SærligeutgifterStepper.INNTEKT])}
            interactive={interactive}
            active={activeButton?.includes(SærligeutgifterStepper.INNTEKT)}
            loading={isGrunnlagLoading && shouldShowGrunnlagLoadingProgressbar(SærligeutgifterStepper.INNTEKT)}
            unconfirmedUpdates={inntekterIkkeAktiverteEndringer}
            valideringsfeil={!lesemodus && inntektPageHasValideringsFeil(inntekterV2)}
            subMenu={inntektRoller.map((rolle) => (
                <>
                    <MenuButton
                        title={
                            <div className="flex flex-row gap-1">
                                {rolle.rolletype}{" "}
                                <PersonNavnIdent ident={rolle.ident} showCopyButton={false} variant="navnIdent" />
                            </div>
                        }
                        onStepChange={() =>
                            onStepChange(STEPS[SærligeutgifterStepper.INNTEKT], {
                                [behandlingQueryKeys.tab]: rolle.id.toString(),
                            })
                        }
                        interactive={interactive}
                        size="small"
                        valideringsfeil={
                            !lesemodus &&
                            inntektPageHasValideringsFeil(inntekterV2) &&
                            checkIfRolleHasValideringsfeil(
                                inntekterV2?.find((inntekt) => inntekt.gjelder.id === rolle.id)?.inntekter
                                    ?.valideringsfeil,
                            )
                        }
                        unconfirmedUpdates={
                            inntekterIkkeAktiverteEndringer &&
                            Object.values(ikkeAktiverteEndringerIGrunnlagsdata.inntekter).some((inntekter) =>
                                inntekter.some((inntekt) => inntekt.ident === rolle.ident),
                            )
                        }
                        active={activeButton === `${SærligeutgifterStepper.INNTEKT}.${rolle.id.toString()}`}
                        hideSubMenu
                        subMenu={
                            rolle.rolletype === Rolletype.BM ? (
                                <>
                                    <MenuButton
                                        title={text.title.skattepliktigeogPensjonsgivendeInntekt}
                                        onStepChange={() =>
                                            onStepChange(
                                                STEPS[SærligeutgifterStepper.INNTEKT],
                                                {
                                                    [behandlingQueryKeys.tab]: rolle.id.toString(),
                                                },
                                                elementIds.seksjon_inntekt_skattepliktig,
                                            )
                                        }
                                        interactive={interactive}
                                        unconfirmedUpdates={ikkeAktiverteEndringerIGrunnlagsdata?.inntekter?.årsinntekter?.some(
                                            (inntekt) => inntekt.ident === rolle.ident,
                                        )}
                                        size="small"
                                        active={
                                            activeButton === `${SærligeutgifterStepper.INNTEKT}.${rolle.id.toString()}`
                                        }
                                    />
                                    <MenuButton
                                        title={text.title.barnetillegg}
                                        onStepChange={() =>
                                            onStepChange(
                                                STEPS[SærligeutgifterStepper.INNTEKT],
                                                {
                                                    [behandlingQueryKeys.tab]: rolle.id.toString(),
                                                },
                                                elementIds.seksjon_inntekt_barnetillegg,
                                            )
                                        }
                                        interactive={interactive}
                                        size="small"
                                        active={
                                            activeButton === `${SærligeutgifterStepper.INNTEKT}.${rolle.id.toString()}`
                                        }
                                        unconfirmedUpdates={
                                            !!ikkeAktiverteEndringerIGrunnlagsdata?.inntekter?.barnetillegg?.some(
                                                (inntekt) => inntekt.ident === rolle.ident,
                                            )
                                        }
                                    />
                                    <MenuButton
                                        title={text.title.utvidetBarnetrygd}
                                        onStepChange={() =>
                                            onStepChange(
                                                STEPS[SærligeutgifterStepper.INNTEKT],
                                                {
                                                    [behandlingQueryKeys.tab]: rolle.id.toString(),
                                                },
                                                elementIds.seksjon_inntekt_utvidetbarnetrygd,
                                            )
                                        }
                                        interactive={interactive}
                                        size="small"
                                        active={
                                            activeButton === `${SærligeutgifterStepper.INNTEKT}.${rolle.id.toString()}`
                                        }
                                        unconfirmedUpdates={
                                            !!ikkeAktiverteEndringerIGrunnlagsdata?.inntekter?.utvidetBarnetrygd?.length
                                        }
                                    />
                                    <MenuButton
                                        title={text.title.småbarnstillegg}
                                        onStepChange={() =>
                                            onStepChange(
                                                STEPS[SærligeutgifterStepper.INNTEKT],
                                                {
                                                    [behandlingQueryKeys.tab]: rolle.id.toString(),
                                                },
                                                elementIds.seksjon_inntekt_småbarnstillegg,
                                            )
                                        }
                                        interactive={interactive}
                                        size="small"
                                        active={
                                            activeButton === `${SærligeutgifterStepper.INNTEKT}.${rolle.id.toString()}`
                                        }
                                        unconfirmedUpdates={
                                            !!ikkeAktiverteEndringerIGrunnlagsdata?.inntekter?.småbarnstillegg?.length
                                        }
                                    />
                                    <MenuButton
                                        title={text.title.kontantstøtte}
                                        onStepChange={() =>
                                            onStepChange(
                                                STEPS[SærligeutgifterStepper.INNTEKT],
                                                {
                                                    [behandlingQueryKeys.tab]: rolle.id.toString(),
                                                },
                                                elementIds.seksjon_inntekt_kontantstøtte,
                                            )
                                        }
                                        interactive={interactive}
                                        size="small"
                                        active={
                                            activeButton === `${SærligeutgifterStepper.INNTEKT}.${rolle.id.toString()}`
                                        }
                                        unconfirmedUpdates={
                                            !!ikkeAktiverteEndringerIGrunnlagsdata?.inntekter?.kontantstøtte?.length
                                        }
                                    />
                                </>
                            ) : rolle.rolletype === Rolletype.BP ? (
                                <>
                                    <MenuButton
                                        title={text.title.skattepliktigeogPensjonsgivendeInntekt}
                                        onStepChange={() =>
                                            onStepChange(
                                                STEPS[SærligeutgifterStepper.INNTEKT],
                                                {
                                                    [behandlingQueryKeys.tab]: rolle.id.toString(),
                                                },
                                                elementIds.seksjon_inntekt_skattepliktig,
                                            )
                                        }
                                        interactive={interactive}
                                        unconfirmedUpdates={ikkeAktiverteEndringerIGrunnlagsdata?.inntekter?.årsinntekter?.some(
                                            (inntekt) => inntekt.ident === rolle.ident,
                                        )}
                                        size="small"
                                        active={
                                            activeButton === `${SærligeutgifterStepper.INNTEKT}.${rolle.id.toString()}`
                                        }
                                    />
                                    <MenuButton
                                        title={text.title.barnetillegg}
                                        onStepChange={() =>
                                            onStepChange(
                                                STEPS[SærligeutgifterStepper.INNTEKT],
                                                {
                                                    [behandlingQueryKeys.tab]: rolle.id.toString(),
                                                },
                                                elementIds.seksjon_inntekt_barnetillegg,
                                            )
                                        }
                                        interactive={interactive}
                                        size="small"
                                        active={
                                            activeButton === `${SærligeutgifterStepper.INNTEKT}.${rolle.id.toString()}`
                                        }
                                        unconfirmedUpdates={
                                            !!ikkeAktiverteEndringerIGrunnlagsdata?.inntekter?.barnetillegg?.some(
                                                (inntekt) => inntekt.ident === rolle.ident,
                                            )
                                        }
                                    />
                                </>
                            ) : (
                                <>
                                    <MenuButton
                                        title={text.title.skattepliktigeogPensjonsgivendeInntekt}
                                        onStepChange={() =>
                                            onStepChange(
                                                STEPS[SærligeutgifterStepper.INNTEKT],
                                                {
                                                    [behandlingQueryKeys.tab]: rolle.id.toString(),
                                                },
                                                elementIds.seksjon_inntekt_skattepliktig,
                                            )
                                        }
                                        interactive={interactive}
                                        size="small"
                                        active={
                                            activeButton === `${SærligeutgifterStepper.INNTEKT}.${rolle.id.toString()}`
                                        }
                                        unconfirmedUpdates={ikkeAktiverteEndringerIGrunnlagsdata?.inntekter?.årsinntekter?.some(
                                            (inntekt) => inntekt.ident === rolle.ident,
                                        )}
                                    />
                                </>
                            )
                        }
                    />
                </>
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
    const { onStepChange, isGrunnlagLoading } = useBehandlingProvider();
    const {
        boforhold: { valideringsfeil: boforholdValideringsfeil },
        ikkeAktiverteEndringerIGrunnlagsdata,
    } = useGetBehandlingV2();

    const husstandsmedlemValideringsFeil = !!boforholdValideringsfeil?.husstandsmedlem?.length;
    const andreVoksneIHusstandenValideringsFeil = !!boforholdValideringsfeil?.andreVoksneIHusstanden;
    const boforholdValideringsFeil = husstandsmedlemValideringsFeil || andreVoksneIHusstandenValideringsFeil;
    const husstandsmedlemIkkeAktiverteEndringer = !!ikkeAktiverteEndringerIGrunnlagsdata?.husstandsmedlem?.length;
    const andreVoksneIHusstandenIkkeAktiverteEndringer = !!ikkeAktiverteEndringerIGrunnlagsdata?.andreVoksneIHusstanden;
    const boforholdIkkeAktiverteEndringer =
        husstandsmedlemIkkeAktiverteEndringer || andreVoksneIHusstandenIkkeAktiverteEndringer;

    return (
        <MenuButton
            step={step}
            title={text.title.boforhold}
            onStepChange={() => onStepChange(STEPS[SærligeutgifterStepper.BOFORHOLD])}
            interactive={interactive}
            active={activeButton === SærligeutgifterStepper.BOFORHOLD}
            loading={isGrunnlagLoading && shouldShowGrunnlagLoadingProgressbar(SærligeutgifterStepper.BOFORHOLD)}
            valideringsfeil={boforholdValideringsFeil}
            unconfirmedUpdates={boforholdIkkeAktiverteEndringer}
            subMenu={
                <>
                    <MenuButton
                        title={text.title.barn}
                        onStepChange={() =>
                            onStepChange(
                                STEPS[SærligeutgifterStepper.BOFORHOLD],
                                undefined,
                                elementIds.seksjon_boforhold,
                            )
                        }
                        interactive={interactive}
                        size="small"
                        active={activeButton === SærligeutgifterStepper.BOFORHOLD}
                        valideringsfeil={husstandsmedlemValideringsFeil}
                        unconfirmedUpdates={husstandsmedlemIkkeAktiverteEndringer}
                    />
                    <MenuButton
                        title={text.title.andreVoksneIHusstanden}
                        onStepChange={() =>
                            onStepChange(
                                STEPS[SærligeutgifterStepper.BOFORHOLD],
                                undefined,
                                elementIds.seksjon_andreVoksneIHusstand,
                            )
                        }
                        interactive={interactive}
                        size="small"
                        active={activeButton === SærligeutgifterStepper.BOFORHOLD}
                        valideringsfeil={andreVoksneIHusstandenValideringsFeil}
                        unconfirmedUpdates={andreVoksneIHusstandenIkkeAktiverteEndringer}
                    />
                </>
            }
        />
    );
};

const VedtakMenuButton = ({ activeButton, step }: { activeButton: string; step: string }) => {
    const { onStepChange, isGrunnlagLoading } = useBehandlingProvider();
    return (
        <MenuButton
            step={step}
            title={text.title.vedtak}
            onStepChange={() => onStepChange(STEPS[SærligeutgifterStepper.VEDTAK])}
            active={activeButton === SærligeutgifterStepper.VEDTAK}
            loading={isGrunnlagLoading && shouldShowGrunnlagLoadingProgressbar(SærligeutgifterStepper.VEDTAK)}
        />
    );
};

const menuButtonMap = {
    [SærligeutgifterStepper.UTGIFT]: UtgiftMenuButton,
    [SærligeutgifterStepper.INNTEKT]: InntektMenuButton,
    [SærligeutgifterStepper.BOFORHOLD]: BoforholdMenuButton,
    [SærligeutgifterStepper.VEDTAK]: VedtakMenuButton,
};

export const SaerbidragSideMenu = () => {
    const { sideMenu } = useBehandlingProvider();
    const [searchParams] = useSearchParams();
    const getActiveButtonFromParams = () => {
        const step = searchParams.get(behandlingQueryKeys.steg);
        if (!step) return SærligeutgifterStepper.UTGIFT;
        const tab = searchParams.get(behandlingQueryKeys.tab);
        return `${step}${tab ? `.${tab}` : ""}`;
    };
    const [activeButton, setActiveButton] = useState<string>(getActiveButtonFromParams());

    useEffect(() => {
        const activeButton = getActiveButtonFromParams();
        setActiveButton(activeButton);
    }, [searchParams, location]);

    return (
        <SideMenu>
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
    );
};
