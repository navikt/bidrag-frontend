import { Vedtakstype } from "@bidrag/api/BidragBehandlingApiV1";
import { BidragContainer, LocalStorage } from "@bidrag/common";
import { ExternalLinkIcon } from "@navikt/aksel-icons";
import { Alert, Button, Heading, Stepper } from "@navikt/ds-react";
import React, { useEffect, useState } from "react";
import { FlexRow } from "../../../common/components/layout/grid/FlexRow";
import { NavigationLoaderWrapper } from "../../../common/components/NavigationLoaderWrapper";
import elementIds from "../../../common/constants/elementIds";
import texts from "../../../common/constants/texts";
import { useBehandlingProvider } from "../../../common/context/BehandlingContext";
import { useGetBehandlingV2 } from "../../../common/hooks/useApiData";
import PageWrapper from "../../../common/PageWrapper";
import environment from "../../../environment";
import { capitalize } from "../../../utils/string-utils";
import FormWrapper from "../../components/forms/FormWrapper";
import { STEPS } from "../../constants/steps";
import { ForskuddStepper } from "../../enum/ForskuddStepper";
export const ForskuddPage = () => {
    const { onStepChange, activeStep } = useBehandlingProvider();
    const {
        virkningstidspunktV3: virkningstidspunkt,
        erVedtakFattet,
        kanBehandlesINyLøsning,
        vedtakstype,
        boforhold: { valideringsfeil: boforholdValideringsfeil },
        inntekterV2,
        ikkeAktiverteEndringerIGrunnlagsdata,
        lesemodus,
    } = useGetBehandlingV2();
    // Valideringsfeil for inntekt ligger per rolle i inntekterV2
    const inntektValideringsfeil = inntekterV2?.flatMap((rolle) =>
        Object.values(rolle.inntekter?.valideringsfeil ?? {}).filter(Boolean),
    );
    const interactive = !virkningstidspunkt.barn[0].avslag && vedtakstype !== Vedtakstype.OPPHOR;
    const activeStepIndex = STEPS[activeStep];

    const inntekterIkkeAktiveGrunnlag = ikkeAktiverteEndringerIGrunnlagsdata?.inntekter
        ? Object.keys(ikkeAktiverteEndringerIGrunnlagsdata.inntekter).flatMap(
              (f) => ikkeAktiverteEndringerIGrunnlagsdata.inntekter[f],
          )
        : [];

    return (
        <PageWrapper name="tracking-wide">
            <BidragContainer className="container p-6">
                {!kanBehandlesINyLøsning && (
                    <Alert variant="info" size="small" className="mb-4 w-max m-auto">
                        <Heading level="3" size="small">
                            {texts.title.kanIkkeBehandlesGjennomNyLøsning}
                        </Heading>
                        {texts.kanIkkeBehandlesGjennomNyLøsning}
                    </Alert>
                )}
                {erVedtakFattet && !lesemodus && (
                    <Alert variant="info" size="small" className="mb-4 w-max m-auto">
                        <Heading level="3" size="small">
                            Vedtak er fattet
                        </Heading>
                        Vedtak er fattet for behandlingen og kan derfor ikke endres
                    </Alert>
                )}
                <FlexRow className="justify-center">
                    <Stepper
                        aria-labelledby="stepper-heading"
                        activeStep={activeStepIndex}
                        onStepChange={(x) => onStepChange(x)}
                        orientation="horizontal"
                        className="mb-8 w-[708px]"
                    >
                        <Stepper.Step completed={activeStepIndex > 1}>
                            {capitalize(ForskuddStepper.VIRKNINGSTIDSPUNKT)}
                        </Stepper.Step>
                        <Stepper.Step
                            completed={
                                activeStepIndex > 2 &&
                                (boforholdValideringsfeil?.husstandsmedlem === undefined ||
                                    boforholdValideringsfeil?.husstandsmedlem?.length === 0) &&
                                (ikkeAktiverteEndringerIGrunnlagsdata?.husstandsmedlem === undefined ||
                                    ikkeAktiverteEndringerIGrunnlagsdata?.husstandsmedlem?.length === 0) &&
                                ikkeAktiverteEndringerIGrunnlagsdata?.sivilstand == null &&
                                boforholdValideringsfeil?.sivilstand == null
                            }
                            interactive={interactive}
                        >
                            {capitalize(ForskuddStepper.BOFORHOLD)}
                        </Stepper.Step>
                        <Stepper.Step
                            completed={
                                activeStepIndex > 3 &&
                                (!inntektValideringsfeil || !Object.keys(inntektValideringsfeil).length) &&
                                inntekterIkkeAktiveGrunnlag.length === 0
                            }
                            interactive={interactive}
                        >
                            {capitalize(ForskuddStepper.INNTEKT)}
                        </Stepper.Step>
                        <Stepper.Step completed={erVedtakFattet}>{capitalize(ForskuddStepper.VEDTAK)}</Stepper.Step>
                    </Stepper>
                </FlexRow>
                <NavigationLoaderWrapper>
                    <FormWrapper />
                </NavigationLoaderWrapper>
            </BidragContainer>
            <EksterneLenkerKnapper />
        </PageWrapper>
    );
};

function EksterneLenkerKnapper() {
    return (
        <div className="agroup fixed bottom-0 right-0 p-2 flex items-end justify-end w-max h-0 flex-row gap-[5px]">
            <LovverkKnapper />
            <BrukerveiledningKnapp />
        </div>
    );
}
function BrukerveiledningKnapp() {
    const nudgeEnabledName = "brukerveiledningShowNudge";
    const { activeStep } = useBehandlingProvider();
    const [nudge, setNudge] = useState(LocalStorage.get(nudgeEnabledName) !== "false");

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setNudge(false);
            LocalStorage.set(nudgeEnabledName, "false");
        }, 5000);
        return () => clearTimeout(timeoutId);
    }, []);
    function renderHref() {
        switch (activeStep) {
            case ForskuddStepper.BOFORHOLD:
                return elementIds.brukerveildning.tittel_boforhold;
            case ForskuddStepper.INNTEKT:
                return elementIds.brukerveildning.tittel_inntekt;
            case ForskuddStepper.VEDTAK:
                return elementIds.brukerveildning.tittel_vedtak;
            case ForskuddStepper.VIRKNINGSTIDSPUNKT:
                return elementIds.brukerveildning.tittel_virkningstidspunkt;
            default:
                return "";
        }
    }
    return (
        <div>
            <Button
                title="Brukerveiledning"
                variant="tertiary"
                className={`rounded-xl border-solid ${
                    nudge ? "animate-bounce border-[var(--ax-border-success)] border-[2px]" : "border"
                } `}
                size="xsmall"
                icon={<ExternalLinkIcon />}
                onClick={() => window.open(environment.url.forskuddBrukerveiledning + "#" + renderHref(), "_blank")}
            >
                Brukerveiledning
            </Button>
        </div>
    );
}
function LovverkKnapper() {
    const { activeStep } = useBehandlingProvider();

    function renderKnapp(tekst: string, url: string) {
        return (
            <div>
                <Button
                    title={tekst}
                    variant="tertiary"
                    className={`border rounded-xl border-solid`}
                    size="xsmall"
                    icon={<ExternalLinkIcon />}
                    onClick={() => window.open(url, "_blank")}
                >
                    {tekst}
                </Button>
            </div>
        );
    }
    if (activeStep === ForskuddStepper.VEDTAK) return null;
    return (
        <>
            {renderKnapp("Lov om bidragsforskudd", "https://lovdata.no/dokument/NL/lov/1989-02-17-2")}
            {activeStep === ForskuddStepper.BOFORHOLD &&
                renderKnapp("Rundskriv til forskuddsloven", "https://lovdata.no/nav/rundskriv/r54-00#KAPITTEL_2-3")}
            {activeStep === ForskuddStepper.INNTEKT &&
                renderKnapp(
                    "Forskrift om inntektsprøving av forskudd",
                    "https://lovdata.no/dokument/SF/forskrift/2003-02-06-125",
                )}
        </>
    );
}
