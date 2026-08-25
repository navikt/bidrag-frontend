import { Alert, Heading, Provider } from "@navikt/ds-react";
import React, { useLayoutEffect, useRef } from "react";
import FloatingBottomToolbar from "../../common/components/FloatingBottomToolbar/FloatingBottomToolbar";
import { NavigationLoaderWrapper } from "../../common/components/NavigationLoaderWrapper";
import texts from "../../common/constants/texts";
import { useGetBehandlingV2 } from "../../common/hooks/useApiData";
import useFeatureToogle from "../../common/hooks/useFeatureToggle";
import PageWrapper from "../../common/PageWrapper";
import FormWrapper from "../components/forms/FormWrapper";
import OpprettForholdsmessigFordelingPrompt from "../forholdsmessigfordeling/OpprettForholdsmessigFordeling";
import { BarnebidragSideMenu } from "./BarnebidragSideMenu";
import EksterneLenkerKnapperFloating, { EksterneLenkerKnapperBidrag } from "./EksterneLenkerKnapper";
export const BarnebidragPage = () => {
    const {
        erVedtakFattet,
        erDelvedtakFattet,
        kanBehandlesINyLøsning,
        kanIkkeBehandlesBegrunnelse,
        lesemodus,
        kanFatteVedtak,
        kanFatteVedtakBegrunnelse,
    } = useGetBehandlingV2();
    const { vedtaksperre } = useFeatureToogle();
    const ref = useRef<HTMLDivElement>(null);
    const [rootElement, setRootElement] = React.useState<HTMLDivElement | null>(null);

    useLayoutEffect(() => {
        setRootElement(ref.current);
    }, []);

    return (
        <PageWrapper name="tracking-wide">
            <Provider rootElement={rootElement}>
                <div
                    ref={ref}
                    className="m-auto max-w-[1272px] min-[1440px]:max-w-[1920px] grid grid-cols-[max-content_auto]"
                >
                    <BarnebidragSideMenu />
                    <div className="w-full p-6 pb-32 overflow-x-scroll min-[1440px]:overflow-x-visible">
                        <React.Suspense fallback={null}>
                            <OpprettForholdsmessigFordelingPrompt />
                        </React.Suspense>
                        {erVedtakFattet && !lesemodus && (
                            <Alert variant="info" size="small" className="mb-4 w-max m-auto">
                                <Heading level="3" size="small">
                                    Vedtak er fattet
                                </Heading>
                                Vedtak er fattet for behandlingen og kan derfor ikke endres
                            </Alert>
                        )}
                        {!erVedtakFattet && erDelvedtakFattet && (
                            <Alert variant="warning" size="small" className="mb-4 w-max m-auto">
                                <Heading level="3" size="small">
                                    Vedtak er delvis fattet
                                </Heading>
                                Vedtak er delvis fattet og kan derfor ikke endres. Det har skjedd en feil ved fatting av
                                vedtak. Prøv å fatte på nytt eller opprett fagsystemsak
                            </Alert>
                        )}
                        {kanBehandlesINyLøsning && kanFatteVedtak !== undefined && !kanFatteVedtak && (
                            <Alert variant="info" size="small" className="mb-4 w-max m-auto">
                                <Heading level="3" size="small">
                                    {"Kan ikke fatte vedtak i ny løsning"}
                                </Heading>
                                {kanFatteVedtakBegrunnelse}
                            </Alert>
                        )}
                        {!vedtaksperre && !kanBehandlesINyLøsning && (
                            <Alert variant="info" size="small" className="mb-4 w-max m-auto">
                                <Heading level="3" size="small">
                                    {texts.title.kanIkkeBehandlesGjennomNyLøsning}
                                </Heading>
                                {kanIkkeBehandlesBegrunnelse}
                            </Alert>
                        )}
                        {vedtaksperre && (
                            <Alert variant="info" size="small" className="mb-4 w-max m-auto">
                                <Heading level="3" size="small">
                                    Stengt for vedtak
                                </Heading>
                                {"Denne saken er midlertidig stengt for vedtak"}
                            </Alert>
                        )}
                        <NavigationLoaderWrapper>
                            <FormWrapper />
                        </NavigationLoaderWrapper>
                        <EksterneLenkerKnapperFloating />
                        <FloatingBottomToolbar BrukerveiledningKnapper={EksterneLenkerKnapperBidrag} />
                    </div>
                </div>
            </Provider>
        </PageWrapper>
    );
};
