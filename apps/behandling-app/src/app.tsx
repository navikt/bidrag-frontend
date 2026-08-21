import { EndringsloggTilhorerSkjermbilde } from "@api/BidragAdminApiV1";
import { TypeBehandling } from "@api/BidragBehandlingApiV1";
import { BidragBehandlingHeader } from "@common/components/header/BidragBehandlingHeader";
import { ErrorModal } from "@common/components/modal/ErrorModal";
import text from "@common/constants/texts";
import { useBehandlingV2, useHentRevurderingsbarn, useUthevPerson } from "@common/hooks/useApiData";
import useFeatureToogle from "@common/hooks/useFeatureToggle";
import { prefetchVisningsnavn } from "@common/hooks/useVisningsnavn";
import PageWrapper from "@common/PageWrapper";
import { BidragCommonsProvider, BidragContainer } from "@navikt/bidrag-ui-common";
import { Loader } from "@navikt/ds-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { FlagProvider, type IConfig, useFlagsStatus } from "@unleash/proxy-client-react";
import { scrollToHash } from "@utils/window-utils";
import { AxiosError } from "axios";
import { lazy, type PropsWithChildren, Suspense, useEffect } from "react";
import { BrowserRouter, Route, Routes, useParams, useSearchParams } from "react-router-dom";

import { BidragProgressbarFullScreen } from "./barnebidrag/components/BidragProgressbar";
import { BarnebidragProviderWrapper } from "./barnebidrag/context/BarnebidragProviderWrapper";
import BrukerveiledningBarnebidragKlage from "./barnebidrag/docs/BrukerveiledningBarnebidragKlage.mdx";
import BrukerveiledningBarnebidragV1 from "./barnebidrag/docs/BrukerveiledningBarnebidragV1.mdx";
import { BarnebidragPage } from "./barnebidrag/pages/BarnebidragPage";
import { ForskuddBehandlingProviderWrapper } from "./forskudd/context/ForskuddBehandlingProviderWrapper";
import BrukerveiledningForskudd from "./forskudd/docs/BrukerveiledningForskudd.mdx";
import { ForskuddPage } from "./forskudd/pages/forskudd/ForskuddPage";
import { NewForskuddPage } from "./forskudd/pages/forskudd/NewForskuddPage";
import { SærligeugifterProviderWrapper } from "./særbidrag/context/SærligeugifterProviderWrapper";
import BrukerveiledningSærbidrag from "./særbidrag/docs/BrukerveiledningSærbidrag.mdx";
import { NewSærbidragPage } from "./særbidrag/pages/NewSaerbidragPage";
import { SærbidragPage } from "./særbidrag/pages/SærbidragPage";

// export const faro = initializeFaro({
//     app: {
//         name: "bidrag-behandling-ui",
//     },
//     url: process.env.TELEMETRY_URL as string,
//     user: {
//         username: await SecuritySessionUtils.hentSaksbehandlerId(),
//     },

//     metas: [browserMeta],
//     instrumentations: [
//         // Load the default Web instrumentations
//         ...getWebInstrumentations({
//             captureConsole: true,
//             enablePerformanceInstrumentation: true,
//         }),

//         new ReactIntegration({
//             router: createReactRouterV6Options({
//                 createRoutesFromChildren,
//                 matchRoutes,
//                 Routes,
//                 useLocation,
//                 useNavigationType,
//             }),
//         }),
//     ],
// });

const NotatPage = lazy(() => import("./forskudd/pages/notat/NotatPage"));
const BegrunnelsePage = lazy(() => import("@common/pages/BegrunnelsePage"));

const queryClient = new QueryClient({
    defaultOptions: {
        mutations: {
            retry: (failureCount, error) => {
                const status = error instanceof AxiosError ? error.response?.status : undefined;
                return failureCount < 3 && (status === undefined || status >= 500);
            },
        },
        queries: {
            refetchOnWindowFocus: false,
            retry: 3,
            retryDelay: 2000,
        },
    },
});
const config: IConfig = {
    url: process.env.UNLEASH_API_URL as string,
    clientKey: process.env.UNLEASH_FRONTEND_TOKEN,
    refreshInterval: 15, // How often (in seconds) the client should poll the proxy for updates
    appName: "bidrag-behandling-ui",
};
// const getDevicePixelRatioFormatted = () => {
//     return (Math.round(window.devicePixelRatio * 100) / 100).toFixed(2);
// };

// const hasMultipleScreens = () => {
//     // @ts-expect-error This is not supported in all browsers (or TypeScript) yet
//     const value: boolean | undefined = window.screen.isExtended;
//     if (value === true) {
//         return "yes";
//     } else if (value === false) {
//         return "no";
//     } else {
//         return "unknown";
//     }
// };

const getSkjermbilde = (type: TypeBehandling) => {
    switch (type) {
        case TypeBehandling.FORSKUDD:
            return EndringsloggTilhorerSkjermbilde.BEHANDLING_FORSKUDD;
        case TypeBehandling.SAeRBIDRAG:
            return EndringsloggTilhorerSkjermbilde.BEHANDLINGSAeRBIDRAG;
        case TypeBehandling.BIDRAG:
        case TypeBehandling.BIDRAG18AR:
            return EndringsloggTilhorerSkjermbilde.BEHANDLING_BIDRAG;
    }
};

export default function App() {
    // const { reset } = useQueryErrorResetBoundary();

    // useStartTracing();
    // useEffect(() => {
    //     try {
    //         const screenResolutionData = {
    //             screenResolution: `${window.screen.width}x${window.screen.height}`,
    //             orientation: window.screen.orientation.type,
    //             screenWidth: window.screen.width,
    //             screenHeight: window.screen.height,
    //             windowWidth: window.innerWidth,
    //             windowHeight: window.innerHeight,
    //             devicePixelRatio: getDevicePixelRatioFormatted(),
    //             hasMultipleScreens: hasMultipleScreens(),
    //         };
    //         const asStrings = Object.fromEntries(
    //             Object.entries(screenResolutionData).map(([key, value]) => [key, value?.toString() ?? ""])
    //         );
    //         faro.api.pushEvent("screenResolution", asStrings);
    //     } catch (error) {
    //         console.error(error);
    //     }
    // }, []);
    return (
        <FlagProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <BidragCommonsProvider
                    client={queryClient}
                    useHentRevurderingsbarn={useHentRevurderingsbarn}
                    uthevPerson={useUthevPerson}
                >
                    <Suspense
                        fallback={
                            <div className="flex justify-center overflow-hidden">
                                <BidragProgressbarFullScreen />
                            </div>
                        }
                    >
                        <BrowserRouter>
                            <Routes>
                                <Route path="/sak/:saksnummer/behandling/:behandlingId">
                                    <Route index element={<BidragBehandlingWrapper />} />
                                    <Route path="notat" element={<NotatPageWrapper />} />
                                    <Route path="begrunnelse/:broadcastChannel" element={<BegrunnelsePageWrapper />} />
                                </Route>
                                <Route path="/behandling/:behandlingId">
                                    <Route index element={<BidragBehandlingWrapper />} />
                                    <Route path="notat" element={<NotatPageWrapper />} />
                                    <Route path="begrunnelse/:broadcastChannel" element={<BegrunnelsePageWrapper />} />
                                </Route>
                                <Route path="/sak/:saksnummer/vedtak/:vedtakId">
                                    <Route
                                        index
                                        element={
                                            <BehandlingPageWrapper>
                                                <VedtakLesemodus />
                                            </BehandlingPageWrapper>
                                        }
                                    />
                                    <Route path="notat" element={<NotatPageWrapper />} />
                                </Route>
                                <Route path="/vedtak/:behandlingId">
                                    <Route
                                        index
                                        element={
                                            <BehandlingPageWrapper>
                                                <ForskuddBehandling />
                                            </BehandlingPageWrapper>
                                        }
                                    />
                                    <Route path="notat" element={<NotatPageWrapper />} />
                                </Route>
                                <Route
                                    path="/forskudd/brukerveiledning"
                                    element={<ForskuddBrukerveiledningPageWrapper />}
                                />
                                <Route
                                    path="/sarbidrag/brukerveiledning"
                                    element={<SærbidragBrukerveiledningPageWrapper />}
                                />
                                <Route
                                    path="/bidrag/brukerveiledning"
                                    element={<BidragBrukerveiledningPageWrapper />}
                                />

                                <Route path="/forskudd/:behandlingId">
                                    <Route
                                        index
                                        element={
                                            <BehandlingPageWrapper>
                                                <ForskuddBehandling />
                                            </BehandlingPageWrapper>
                                        }
                                    />
                                    <Route path="notat" element={<NotatPageWrapper />} />
                                </Route>
                            </Routes>
                        </BrowserRouter>
                    </Suspense>
                    <ReactQueryDevtools initialIsOpen={false} />
                </BidragCommonsProvider>
            </QueryClientProvider>
        </FlagProvider>
    );
}

function ForskuddBrukerveiledningPageWrapper() {
    useEffect(scrollToHash, []);
    return (
        <PageWrapper name="Forskudd brukerveiledning">
            <BidragContainer className="container p-6 max-w-[60rem]">
                <BrukerveiledningForskudd />
            </BidragContainer>
        </PageWrapper>
    );
}

function BidragBrukerveiledningPageWrapper() {
    useEffect(scrollToHash, []);
    const [searchParams] = useSearchParams();

    // Example criteria: Check if 'criteria' query param is 'true'
    const forKlage = searchParams.get("klage") === "true";
    if (forKlage) {
        return (
            <PageWrapper name="Bidrag brukerveiledning">
                <BidragContainer className="container p-6 max-w-[60rem]">
                    <BrukerveiledningBarnebidragKlage />
                </BidragContainer>
            </PageWrapper>
        );
    }
    return (
        <PageWrapper name="Bidrag brukerveiledning">
            <BidragContainer className="container p-6 max-w-[60rem]">
                <BrukerveiledningBarnebidragV1 />
            </BidragContainer>
        </PageWrapper>
    );
}
function SærbidragBrukerveiledningPageWrapper() {
    useEffect(scrollToHash, []);

    return (
        <PageWrapper name="Særbidrag brukerveiledning">
            <BidragContainer className="container p-6 max-w-[60rem]">
                <BrukerveiledningSærbidrag />
            </BidragContainer>
        </PageWrapper>
    );
}
const VedtakLesemodus = () => {
    return <BehandlingPage />;
};

const BehandlingPage = () => {
    const { behandlingId, vedtakId } = useParams<{
        behandlingId?: string;
        vedtakId?: string;
    }>();
    const { type } = useBehandlingV2(behandlingId, vedtakId);

    switch (type) {
        case TypeBehandling.FORSKUDD:
            return <ForskuddBehandling />;
        case TypeBehandling.SAeRBIDRAG:
            return <SærligeutgifterBehandling />;
        case TypeBehandling.BIDRAG:
            return <BarnebidragBehandling />;
        default:
            return null;
    }
};
const ForskuddBehandling = () => {
    const { isbehandlingVesntremenyEnabled } = useFeatureToogle();
    useEffect(() => {
        window.dispatchEvent(
            new CustomEvent<EndringsloggTilhorerSkjermbilde>("skjermbildeSet", {
                detail: EndringsloggTilhorerSkjermbilde.BEHANDLING_FORSKUDD,
            }),
        );
    }, []);

    return (
        <ForskuddBehandlingProviderWrapper>
            <BidragBehandlingHeader />
            {isbehandlingVesntremenyEnabled && <NewForskuddPage />}
            {!isbehandlingVesntremenyEnabled && <ForskuddPage />}
            <ErrorModal />
        </ForskuddBehandlingProviderWrapper>
    );
};
const SærligeutgifterBehandling = () => {
    const { isbehandlingVesntremenyEnabled } = useFeatureToogle();
    useEffect(() => {
        window.dispatchEvent(
            new CustomEvent<EndringsloggTilhorerSkjermbilde>("skjermbildeSet", {
                detail: EndringsloggTilhorerSkjermbilde.BEHANDLINGSAeRBIDRAG,
            }),
        );
    }, []);

    return (
        <SærligeugifterProviderWrapper>
            <BidragBehandlingHeader />
            {isbehandlingVesntremenyEnabled && <NewSærbidragPage />}
            {!isbehandlingVesntremenyEnabled && <SærbidragPage />}
            <ErrorModal />
        </SærligeugifterProviderWrapper>
    );
};

const BarnebidragBehandling = () => {
    const { behandlingId, vedtakId } = useParams<{
        behandlingId?: string;
        vedtakId?: string;
    }>();
    const { type } = useBehandlingV2(behandlingId, vedtakId);
    useEffect(() => {
        if (type) {
            window.dispatchEvent(
                new CustomEvent<EndringsloggTilhorerSkjermbilde>("skjermbildeSet", { detail: getSkjermbilde(type) }),
            );
        }
    }, [type]);
    return (
        <BarnebidragProviderWrapper>
            <BidragBehandlingHeader />
            <BarnebidragPage />
            <ErrorModal />
        </BarnebidragProviderWrapper>
    );
};

const BehandlingPageWrapper = ({ children }: PropsWithChildren) => {
    prefetchVisningsnavn();
    const { flagsReady, flagsError } = useFlagsStatus();

    if (!flagsReady && flagsError === false) {
        return (
            <div className="flex justify-center overflow-hidden">
                <Loader size="3xlarge" title={text.loading} variant="interaction" />
            </div>
        );
    }

    return children;
};
const BidragBehandlingWrapper = () => {
    const { behandlingId } = useParams<{ behandlingId?: string }>();
    const { type } = useBehandlingV2(behandlingId);

    const getBehandling = (type: TypeBehandling) => {
        switch (type) {
            case TypeBehandling.FORSKUDD:
                return <ForskuddBehandling />;
            case TypeBehandling.SAeRBIDRAG:
                return <SærligeutgifterBehandling />;
            case TypeBehandling.BIDRAG:
                return <BarnebidragBehandling />;
            default:
                return null;
        }
    };

    return <BehandlingPageWrapper>{getBehandling(type)}</BehandlingPageWrapper>;
};

const NotatPageWrapper = () => {
    const { behandlingId, vedtakId } = useParams<{ behandlingId?: string; vedtakId?: string }>();
    return <NotatPage behandlingId={behandlingId} vedtakId={vedtakId} />;
};

const BegrunnelsePageWrapper = () => {
    const { behandlingId, broadcastChannel } = useParams<{ behandlingId?: string; broadcastChannel?: string }>();
    return (
        <BehandlingPageWrapper>
            <BegrunnelsePage behandlingId={behandlingId} broadcastChannel={broadcastChannel} />
        </BehandlingPageWrapper>
    );
};
