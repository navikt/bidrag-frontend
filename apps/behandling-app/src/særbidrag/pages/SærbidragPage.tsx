import { Vedtakstype } from "@bidrag/api/BidragBehandlingApiV1";
import { BidragContainer } from "@bidrag/common";
import { Alert, Heading, Stepper } from "@navikt/ds-react";
import { FlexRow } from "../../common/components/layout/grid/FlexRow";
import { NavigationLoaderWrapper } from "../../common/components/NavigationLoaderWrapper";
import texts from "../../common/constants/texts";
import { useBehandlingProvider } from "../../common/context/BehandlingContext";
import { useGetBehandlingV2 } from "../../common/hooks/useApiData";
import PageWrapper from "../../common/PageWrapper";
import { capitalize } from "../../utils/string-utils";
import FormWrapper from "../components/forms/FormWrapper";
import { STEPS } from "../constants/steps";
import { SærligeutgifterStepper } from "../enum/SærligeutgifterStepper";
import EksterneLenkerKnapper from "./EksterneLenkerKnapper";
export const SærbidragPage = () => {
    const { onStepChange, activeStep } = useBehandlingProvider();
    const {
        erVedtakFattet,
        vedtakstype,
        lesemodus,
        kanBehandlesINyLøsning,
        kanIkkeBehandlesBegrunnelse,
        utgift: { avslag, valideringsfeil: utgiftValideringsfeil },
        boforhold: { valideringsfeil: boforholdValideringsfeil },
        inntekterV2,
        ikkeAktiverteEndringerIGrunnlagsdata,
    } = useGetBehandlingV2();
    // Valideringsfeil for inntekt ligger per rolle i inntekterV2
    const inntektValideringsfeil = inntekterV2?.flatMap((rolle) =>
        Object.values(rolle.inntekter?.valideringsfeil ?? {}).filter(Boolean),
    );
    const interactive = vedtakstype !== Vedtakstype.OPPHOR && avslag === undefined;
    const activeStepIndex = STEPS[activeStep];

    const inntekterIkkeAktiveGrunnlag = ikkeAktiverteEndringerIGrunnlagsdata?.inntekter
        ? Object.keys(ikkeAktiverteEndringerIGrunnlagsdata.inntekter).flatMap(
              (f) => ikkeAktiverteEndringerIGrunnlagsdata.inntekter[f],
          )
        : [];

    return (
        <PageWrapper name="tracking-wide">
            <BidragContainer className="container p-6">
                {erVedtakFattet && !lesemodus && (
                    <Alert variant="info" size="small" className="mb-4 w-max m-auto">
                        <Heading level="3" size="small">
                            Vedtak er fattet
                        </Heading>
                        Vedtak er fattet for behandlingen og kan derfor ikke endres
                    </Alert>
                )}
                {!kanBehandlesINyLøsning && (
                    <Alert variant="info" size="small" className="mb-4 w-max m-auto">
                        <Heading level="3" size="small">
                            {texts.title.kanIkkeBehandlesGjennomNyLøsning}
                        </Heading>
                        {kanIkkeBehandlesBegrunnelse}
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
                        <Stepper.Step completed={activeStepIndex > 1 && utgiftValideringsfeil === undefined}>
                            {capitalize(SærligeutgifterStepper.UTGIFT)}
                        </Stepper.Step>
                        <Stepper.Step
                            completed={
                                activeStepIndex > 2 &&
                                (!inntektValideringsfeil || !Object.keys(inntektValideringsfeil).length) &&
                                inntekterIkkeAktiveGrunnlag.length === 0
                            }
                            interactive={interactive}
                        >
                            {capitalize(SærligeutgifterStepper.INNTEKT)}
                        </Stepper.Step>
                        <Stepper.Step
                            completed={
                                activeStepIndex > 3 &&
                                (boforholdValideringsfeil?.husstandsmedlem === undefined ||
                                    boforholdValideringsfeil?.husstandsmedlem?.length === 0) &&
                                (ikkeAktiverteEndringerIGrunnlagsdata?.husstandsmedlem === undefined ||
                                    ikkeAktiverteEndringerIGrunnlagsdata?.husstandsmedlem?.length === 0) &&
                                ikkeAktiverteEndringerIGrunnlagsdata?.andreVoksneIHusstanden === undefined &&
                                boforholdValideringsfeil?.andreVoksneIHusstanden === undefined
                            }
                            interactive={interactive}
                        >
                            {capitalize(SærligeutgifterStepper.BOFORHOLD)}
                        </Stepper.Step>
                        <Stepper.Step completed={erVedtakFattet}>
                            {capitalize(SærligeutgifterStepper.VEDTAK)}
                        </Stepper.Step>
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
