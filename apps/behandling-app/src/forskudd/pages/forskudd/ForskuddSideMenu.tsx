import { Rolletype } from "@bidrag/api/BidragBehandlingApiV1";
import { PersonNavnIdent } from "@bidrag/common";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { MenuButton, SideMenu } from "../../../common/components/SideMenu/SideMenu";
import behandlingQueryKeys from "../../../common/constants/behandlingQueryKeys";
import elementIds from "../../../common/constants/elementIds";
import text from "../../../common/constants/texts";
import { useBehandlingProvider } from "../../../common/context/BehandlingContext";
import { sortBehandlingRoller } from "../../../common/helpers/behandlingRoller";
import {
    checkIfRolleHasValideringsfeil,
    inntektPageHasValideringsFeil,
} from "../../../common/helpers/inntektFormHelpers";
import { shouldShowGrunnlagLoadingProgressbar } from "../../../common/helpers/shouldShowGrunnlagProgressbar";
import { useGetBehandlingV2 } from "../../../common/hooks/useApiData";
import { STEPS } from "../../constants/steps";
import { ForskuddStepper } from "../../enum/ForskuddStepper";

const VirkingstidspunktMenuButton = ({ activeButton, step }: { activeButton: string; step: string }) => {
    const { onStepChange, isGrunnlagLoading } = useBehandlingProvider();
    return (
        <MenuButton
            step={step}
            title={text.title.virkningstidspunkt}
            onStepChange={() => onStepChange(STEPS[ForskuddStepper.VIRKNINGSTIDSPUNKT])}
            active={activeButton === ForskuddStepper.VIRKNINGSTIDSPUNKT}
            loading={isGrunnlagLoading && shouldShowGrunnlagLoadingProgressbar(ForskuddStepper.VIRKNINGSTIDSPUNKT)}
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
    const sivilstandValideringsFeil = !!boforholdValideringsfeil?.sivilstand;
    const husstandsmedlemIkkeAktiverteEndringer = !!ikkeAktiverteEndringerIGrunnlagsdata?.husstandsmedlem?.length;
    const sivilstandIkkeAktiverteEndringer = !!ikkeAktiverteEndringerIGrunnlagsdata?.sivilstand;
    return (
        <MenuButton
            step={step}
            title={text.title.boforhold}
            onStepChange={() => onStepChange(STEPS[ForskuddStepper.BOFORHOLD])}
            interactive={interactive}
            active={activeButton === ForskuddStepper.BOFORHOLD}
            loading={isGrunnlagLoading && shouldShowGrunnlagLoadingProgressbar(ForskuddStepper.BOFORHOLD)}
            valideringsfeil={husstandsmedlemValideringsFeil || sivilstandValideringsFeil}
            unconfirmedUpdates={husstandsmedlemIkkeAktiverteEndringer || sivilstandIkkeAktiverteEndringer}
            subMenu={
                <>
                    <MenuButton
                        title={text.title.barn}
                        onStepChange={() =>
                            onStepChange(STEPS[ForskuddStepper.BOFORHOLD], undefined, elementIds.seksjon_boforhold)
                        }
                        interactive={interactive}
                        size="small"
                        active={activeButton === ForskuddStepper.BOFORHOLD}
                        valideringsfeil={husstandsmedlemValideringsFeil}
                        unconfirmedUpdates={husstandsmedlemIkkeAktiverteEndringer}
                    />
                    <MenuButton
                        title={text.title.sivilstand}
                        onStepChange={() =>
                            onStepChange(STEPS[ForskuddStepper.BOFORHOLD], undefined, elementIds.seksjon_sivilstand)
                        }
                        interactive={interactive}
                        size="small"
                        active={activeButton === ForskuddStepper.BOFORHOLD}
                        valideringsfeil={sivilstandValideringsFeil}
                        unconfirmedUpdates={sivilstandIkkeAktiverteEndringer}
                    />
                </>
            }
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
    const { ikkeAktiverteEndringerIGrunnlagsdata, inntekterV2, roller } = useGetBehandlingV2();
    const inntektRoller = roller.filter((rolle) => rolle.rolletype !== Rolletype.BP).sort(sortBehandlingRoller);

    const inntekterIkkeAktiverteEndringer =
        !!ikkeAktiverteEndringerIGrunnlagsdata?.inntekter &&
        Object.values(ikkeAktiverteEndringerIGrunnlagsdata.inntekter).some((inntekt) => !!inntekt.length);

    return (
        <MenuButton
            step={step}
            title={text.title.inntekt}
            onStepChange={() => onStepChange(STEPS[ForskuddStepper.INNTEKT])}
            interactive={interactive}
            active={activeButton?.includes(ForskuddStepper.INNTEKT)}
            loading={isGrunnlagLoading && shouldShowGrunnlagLoadingProgressbar(ForskuddStepper.INNTEKT)}
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
                            onStepChange(STEPS[ForskuddStepper.INNTEKT], {
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
                        active={activeButton === `${ForskuddStepper.INNTEKT}.${rolle.id.toString()}`}
                        hideSubMenu
                        subMenu={
                            rolle.rolletype === Rolletype.BM ? (
                                <>
                                    <MenuButton
                                        title={text.title.skattepliktigeogPensjonsgivendeInntekt}
                                        onStepChange={() =>
                                            onStepChange(
                                                STEPS[ForskuddStepper.INNTEKT],
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
                                        active={activeButton === `${ForskuddStepper.INNTEKT}.${rolle.id.toString()}`}
                                    />
                                    <MenuButton
                                        title={text.title.barnetillegg}
                                        onStepChange={() =>
                                            onStepChange(
                                                STEPS[ForskuddStepper.INNTEKT],
                                                {
                                                    [behandlingQueryKeys.tab]: rolle.id.toString(),
                                                },
                                                elementIds.seksjon_inntekt_barnetillegg,
                                            )
                                        }
                                        interactive={interactive}
                                        size="small"
                                        active={activeButton === `${ForskuddStepper.INNTEKT}.${rolle.id.toString()}`}
                                        unconfirmedUpdates={
                                            !!ikkeAktiverteEndringerIGrunnlagsdata?.inntekter?.barnetillegg?.length
                                        }
                                    />
                                    <MenuButton
                                        title={text.title.utvidetBarnetrygd}
                                        onStepChange={() =>
                                            onStepChange(
                                                STEPS[ForskuddStepper.INNTEKT],
                                                {
                                                    [behandlingQueryKeys.tab]: rolle.id.toString(),
                                                },
                                                elementIds.seksjon_inntekt_utvidetbarnetrygd,
                                            )
                                        }
                                        interactive={interactive}
                                        size="small"
                                        active={activeButton === `${ForskuddStepper.INNTEKT}.${rolle.id.toString()}`}
                                        unconfirmedUpdates={
                                            !!ikkeAktiverteEndringerIGrunnlagsdata?.inntekter?.utvidetBarnetrygd?.length
                                        }
                                    />
                                    <MenuButton
                                        title={text.title.småbarnstillegg}
                                        onStepChange={() =>
                                            onStepChange(
                                                STEPS[ForskuddStepper.INNTEKT],
                                                {
                                                    [behandlingQueryKeys.tab]: rolle.id.toString(),
                                                },
                                                elementIds.seksjon_inntekt_småbarnstillegg,
                                            )
                                        }
                                        interactive={interactive}
                                        size="small"
                                        active={activeButton === `${ForskuddStepper.INNTEKT}.${rolle.id.toString()}`}
                                        unconfirmedUpdates={
                                            !!ikkeAktiverteEndringerIGrunnlagsdata?.inntekter?.småbarnstillegg?.length
                                        }
                                    />
                                    <MenuButton
                                        title={text.title.kontantstøtte}
                                        onStepChange={() =>
                                            onStepChange(
                                                STEPS[ForskuddStepper.INNTEKT],
                                                {
                                                    [behandlingQueryKeys.tab]: rolle.id.toString(),
                                                },
                                                elementIds.seksjon_inntekt_kontantstøtte,
                                            )
                                        }
                                        interactive={interactive}
                                        size="small"
                                        active={activeButton === `${ForskuddStepper.INNTEKT}.${rolle.id.toString()}`}
                                        unconfirmedUpdates={
                                            !!ikkeAktiverteEndringerIGrunnlagsdata?.inntekter?.kontantstøtte?.length
                                        }
                                    />
                                </>
                            ) : (
                                <>
                                    <MenuButton
                                        title={text.title.skattepliktigeogPensjonsgivendeInntekt}
                                        onStepChange={() =>
                                            onStepChange(
                                                STEPS[ForskuddStepper.INNTEKT],
                                                {
                                                    [behandlingQueryKeys.tab]: rolle.id.toString(),
                                                },
                                                elementIds.seksjon_inntekt_skattepliktig,
                                            )
                                        }
                                        interactive={interactive}
                                        size="small"
                                        active={activeButton === `${ForskuddStepper.INNTEKT}.${rolle.id.toString()}`}
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

const VedtakMenuButton = ({ activeButton, step }: { activeButton: string; step: string }) => {
    const { onStepChange, isGrunnlagLoading } = useBehandlingProvider();
    return (
        <MenuButton
            step={step}
            title={text.title.vedtak}
            onStepChange={() => onStepChange(STEPS[ForskuddStepper.VEDTAK])}
            active={activeButton === ForskuddStepper.VEDTAK}
            loading={isGrunnlagLoading && shouldShowGrunnlagLoadingProgressbar(ForskuddStepper.VEDTAK)}
        />
    );
};

const menuButtonMap = {
    [ForskuddStepper.VIRKNINGSTIDSPUNKT]: VirkingstidspunktMenuButton,
    [ForskuddStepper.BOFORHOLD]: BoforholdMenuButton,
    [ForskuddStepper.INNTEKT]: InntektMenuButton,
    [ForskuddStepper.VEDTAK]: VedtakMenuButton,
};

export const ForskuddSideMenu = () => {
    const { sideMenu } = useBehandlingProvider();
    const [searchParams] = useSearchParams();
    const getActiveButtonFromParams = () => {
        const step = searchParams.get(behandlingQueryKeys.steg);
        if (!step) return ForskuddStepper.VIRKNINGSTIDSPUNKT;
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
