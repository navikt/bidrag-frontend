import {
    type ErSamvaerVirkningLikForAlleForSak,
    type RolleDto,
    Stonadstype,
    type TypeBehandling,
    Vedtakstype,
} from "@bidrag/api/BidragBehandlingApiV1";
import type { IRolleDetaljer, RolleTypeAbbreviation } from "@bidrag/common";
import { XMarkOctagonFillIcon } from "@navikt/aksel-icons";
import { Button, Heading } from "@navikt/ds-react";
import { useQueryClient, useSuspenseQueries } from "@tanstack/react-query";
import React, {
    createContext,
    type Dispatch,
    type PropsWithChildren,
    type SetStateAction,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import type { BarnebidragPageErrorsOrUnsavedState } from "../../barnebidrag/context/BarnebidragProviderWrapper";
import { BarnebidragStepper } from "../../barnebidrag/enum/BarnebidragStepper";
import environment from "../../environment";
import type { PageErrorsOrUnsavedState as ForskuddPageErrorsOrUnsavedState } from "../../forskudd/context/ForskuddBehandlingProviderWrapper";
import type { ForskuddStepper } from "../../forskudd/enum/ForskuddStepper";
import type { PageErrorsOrUnsavedState as SærligeutgifterPageErrorsOrUnsavedState } from "../../særbidrag/context/SærligeugifterProviderWrapper";
import type { SærligeutgifterStepper } from "../../særbidrag/enum/SærligeutgifterStepper";
import { dateOrNull, firstDayOfMonth, isAfterEqualsDate } from "../../utils/date-utils";
import { getAllSearchParamsExcludingKeys } from "../../utils/window-utils";
import ErrorConfirmationModal from "../components/ErrorConfirmationModal";
import type { FloatingBottomToolbarTab } from "../components/FloatingBottomToolbar";
import UserFeedbackDialog from "../components/feedback/FeedbackFab";
import { ConfirmationModal } from "../components/modal/ConfirmationModal";
import { PERSON_API } from "../constants/api";
import urlSearchParams from "../constants/behandlingQueryKeys";
import behandlingQueryKeys from "../constants/behandlingQueryKeys";
import text from "../constants/texts";
import { shouldShowGrunnlagLoadingProgressbar } from "../helpers/shouldShowGrunnlagProgressbar";
import { QueryKeys, useBehandlingV2, useSjekkLasterGrunnlag } from "../hooks/useApiData";
import useFeatureToogle from "../hooks/useFeatureToggle";
import { useMutationStatus } from "../hooks/useMutationStatus";
import { useQueryParams } from "../hooks/useQueryParams";

// Faro initialiseres og eksponeres globalt (window.faro) av web-shellet. behandling-app
// har ikke @grafana/faro-web-sdk som avhengighet, så vi deklarerer kun det vi trenger.
declare global {
    interface Window {
        faro?: {
            api: {
                pushEvent: (name: string, attributes?: Record<string, string>) => void;
            };
        };
    }
}

interface SaveErrorState {
    error: boolean;
    retryFn?: () => void;
    rollbackFn?: () => void;
}

export const toRolleDetaljer = (rolle: RolleDto): IRolleDetaljer => ({
    ...rolle,
    navn: rolle.navn ?? "",
    ident: rolle.ident ?? "",
    stønad18År: rolle.stønadstype === Stonadstype.BIDRAG18AAR,
    rolleType: rolle.rolletype as unknown as RolleTypeAbbreviation,
});

type stepDef = BarnebidragStepper | ForskuddStepper | SærligeutgifterStepper;
interface IBehandlingContext {
    activeStep: stepDef;
    behandlingId: string;
    enhet: string;
    currentTab: FloatingBottomToolbarTab;
    pageTabs: FloatingBottomToolbarTab[];
    vedtakId: string;
    type: TypeBehandling;
    lesemodus: boolean;
    erVedtakFattet: boolean;
    beregnetGebyrErEndret: boolean;
    erVirkningstidspunktNåværendeMånedEllerFramITid: boolean;
    saksnummer?: string;
    selectedSaksnummer?: string;
    selectedRoller: IRolleDetaljer[];
    errorMessage: { title: string; text: string };
    errorModalOpen: boolean;
    setErrorMessage: (message: { title: string; text: string }) => void;
    setErrorModalOpen: (open: boolean) => void;
    pageErrorsOrUnsavedState:
        | ForskuddPageErrorsOrUnsavedState
        | SærligeutgifterPageErrorsOrUnsavedState
        | BarnebidragPageErrorsOrUnsavedState;
    setPageErrorsOrUnsavedState: Dispatch<
        SetStateAction<
            | ForskuddPageErrorsOrUnsavedState
            | SærligeutgifterPageErrorsOrUnsavedState
            | BarnebidragPageErrorsOrUnsavedState
        >
    >;
    setSaveErrorState: Dispatch<SetStateAction<SaveErrorState>>;
    setPageTabs: Dispatch<SetStateAction<FloatingBottomToolbarTab[]>>;
    setCurrentTab: Dispatch<SetStateAction<FloatingBottomToolbarTab>>;
    setSelectedSaksnummer: Dispatch<SetStateAction<string | undefined>>;
    setSelectedRoller: Dispatch<SetStateAction<IRolleDetaljer[]>>;
    onStepChange: (x: number, query?: Record<string, string>, hash?: string) => void;
    pendingTransitionState: boolean;
    setDebouncing: React.Dispatch<React.SetStateAction<boolean>>;
    setMutating: React.Dispatch<React.SetStateAction<boolean>>;
    setBeregnetGebyrErEndret: React.Dispatch<React.SetStateAction<boolean>>;
    onNavigateToTab: (nextTab: string) => void;
    sideMenu: {
        step: stepDef;
        visible: boolean;
        interactive: boolean;
    }[];
    getNextStep: (currentStep: stepDef) => number;
    getPreviousStep: (currentStep: stepDef) => number;
    vurderSeparatSamvær?: boolean;
    setVurderSeparatSamvær?: Dispatch<SetStateAction<boolean>>;
    setVurderSeparatSamværForSaker?: (saker: ErSamvaerVirkningLikForAlleForSak[]) => void;
    vurderSeparatVirkningstidspunkt?: boolean;
    setVurderSeparatVirkningstidspunkt?: Dispatch<SetStateAction<boolean>>;
    setVurderSeparatVirkningstidspunktForSaker?: (saker: ErSamvaerVirkningLikForAlleForSak[]) => void;
    isGrunnlagLoading: boolean;
}

export const BehandlingContext = createContext<IBehandlingContext | null>(null);

type ForskuddSteps = {
    defaultStep: ForskuddStepper;
    steps: { [_key in ForskuddStepper]: number };
};

type SærligeutgifterSteps = {
    defaultStep: SærligeutgifterStepper;
    steps: { [_key in SærligeutgifterStepper]: number };
};

type BarnebidragSteps = {
    defaultStep: BarnebidragStepper;
    steps: { [_key in BarnebidragStepper]: number };
};

export type BehandlingProviderProps = {
    props: {
        getPageErrorTexts: () => { title: string; description: string };
        formSteps: ForskuddSteps | SærligeutgifterSteps | BarnebidragSteps;
        pageErrorsOrUnsavedState:
            | ForskuddPageErrorsOrUnsavedState
            | SærligeutgifterPageErrorsOrUnsavedState
            | BarnebidragPageErrorsOrUnsavedState;
        setPageErrorsOrUnsavedState: Dispatch<
            SetStateAction<
                | ForskuddPageErrorsOrUnsavedState
                | SærligeutgifterPageErrorsOrUnsavedState
                | BarnebidragPageErrorsOrUnsavedState
            >
        >;
        sideMenu: {
            step: BarnebidragStepper | ForskuddStepper | SærligeutgifterStepper;
            visible: boolean;
            interactive: boolean;
        }[];
        stepsIndex: { [key: string]: number };
        vurderSeparatSamværPerSak?: Record<string, boolean>;
        setVurderSeparatSamværPerSak?: Dispatch<SetStateAction<Record<string, boolean>>>;
        vurderSeparatVirkningstidspunktPerSak?: Record<string, boolean>;
        setVurderSeparatVirkningstidspunktPerSak?: Dispatch<SetStateAction<Record<string, boolean>>>;
    };
};

function BehandlingProvider({ props, children }: PropsWithChildren<BehandlingProviderProps>) {
    const {
        formSteps: { defaultStep, steps },
        getPageErrorTexts,
        pageErrorsOrUnsavedState,
        setPageErrorsOrUnsavedState,
        sideMenu,
        stepsIndex,
        vurderSeparatSamværPerSak,
        setVurderSeparatSamværPerSak,
        vurderSeparatVirkningstidspunktPerSak,
        setVurderSeparatVirkningstidspunktPerSak,
    } = props;
    const { vedtaksperre } = useFeatureToogle();
    const { behandlingId, saksnummer, vedtakId } = useParams<{
        behandlingId?: string;
        saksnummer?: string;
        vedtakId?: string;
    }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const [saveErrorState, setSaveErrorState] = useState<SaveErrorState | undefined>();
    const [errorMessage, setErrorMessage] = useState<{ title: string; text: string }>(null);
    const [errorModalOpen, setErrorModalOpen] = useState(false);
    const [beregnetGebyrErEndret, setBeregnetGebyrErEndret] = useState(false);
    const [pageTabs, setPageTabs] = useState<FloatingBottomToolbarTab[]>([]);
    const [currentTab, setCurrentTab] = useState<FloatingBottomToolbarTab>();
    const [selectedSaksnummer, setSelectedSaksnummer] = useState<string | undefined>(undefined);
    const [selectedRoller, setSelectedRoller] = useState<IRolleDetaljer[]>([]);

    // `vurderSeparatSamvær` lagres per saksnummer (relevant ved forholdsmessig fordeling med flere
    // saker). Vi utleder en boolean for valgt sak slik at konsumentene kan bruke samme API som før.
    const vurderSeparatSamvær = useMemo(() => {
        if (!vurderSeparatSamværPerSak) return undefined;
        if (selectedSaksnummer && selectedSaksnummer in vurderSeparatSamværPerSak) {
            return vurderSeparatSamværPerSak[selectedSaksnummer];
        }
        return Object.values(vurderSeparatSamværPerSak).some(Boolean);
    }, [vurderSeparatSamværPerSak, selectedSaksnummer]);

    const setVurderSeparatSamvær = useCallback<Dispatch<SetStateAction<boolean>>>(
        (action) => {
            setVurderSeparatSamværPerSak?.((prev) => {
                const keys = selectedSaksnummer ? [selectedSaksnummer] : Object.keys(prev);
                const next = { ...prev };
                for (const key of keys) {
                    const current = prev[key] ?? false;
                    next[key] = typeof action === "function" ? action(current) : action;
                }
                return next;
            });
        },
        [selectedSaksnummer, setVurderSeparatSamværPerSak],
    );

    const setVurderSeparatSamværForSaker = useCallback(
        (saker: ErSamvaerVirkningLikForAlleForSak[]) => {
            setVurderSeparatSamværPerSak?.((prev) => {
                const next = { ...prev };
                for (const sak of saker) {
                    next[sak.saksnummer] = !sak.erLikForAlle;
                }
                return next;
            });
        },
        [setVurderSeparatSamværPerSak],
    );

    // Samme mønster som `vurderSeparatSamvær`: lagres per saksnummer, men eksponeres som boolean for
    // valgt sak slik at konsumentene beholder samme API.
    const vurderSeparatVirkningstidspunkt = useMemo(() => {
        if (!vurderSeparatVirkningstidspunktPerSak) return undefined;
        if (selectedSaksnummer && selectedSaksnummer in vurderSeparatVirkningstidspunktPerSak) {
            return vurderSeparatVirkningstidspunktPerSak[selectedSaksnummer];
        }
        return Object.values(vurderSeparatVirkningstidspunktPerSak).some(Boolean);
    }, [vurderSeparatVirkningstidspunktPerSak, selectedSaksnummer]);

    const setVurderSeparatVirkningstidspunkt = useCallback<Dispatch<SetStateAction<boolean>>>(
        (action) => {
            setVurderSeparatVirkningstidspunktPerSak?.((prev) => {
                const keys = selectedSaksnummer ? [selectedSaksnummer] : Object.keys(prev);
                const next = { ...prev };
                for (const key of keys) {
                    const current = prev[key] ?? false;
                    next[key] = typeof action === "function" ? action(current) : action;
                }
                return next;
            });
        },
        [selectedSaksnummer, setVurderSeparatVirkningstidspunktPerSak],
    );

    const setVurderSeparatVirkningstidspunktForSaker = useCallback(
        (saker: ErSamvaerVirkningLikForAlleForSak[]) => {
            setVurderSeparatVirkningstidspunktPerSak?.((prev) => {
                const next = { ...prev };
                for (const sak of saker) {
                    next[sak.saksnummer] = !sak.erLikForAlle;
                }
                return next;
            });
        },
        [setVurderSeparatVirkningstidspunktPerSak],
    );

    const [activeStep, setActiveStepState] = useState<stepDef>(
        (searchParams.get(behandlingQueryKeys.steg) ?? defaultStep) as stepDef,
    );
    const behandling = useBehandlingV2(behandlingId, vedtakId);
    const personIdenter = useMemo(
        () => Array.from(new Set((behandling.roller ?? []).map((rolle) => rolle.ident).filter(Boolean))),
        [behandling.roller],
    );

    useSuspenseQueries({
        queries: personIdenter.map((ident) => ({
            queryKey: ["persons", ident],
            queryFn: async () => (await PERSON_API.informasjon.hentPersonPost({ ident })).data,
            staleTime: Infinity,
        })),
    });

    const enhet = useQueryParams().get("enhet");

    // Check if grunnlag is loading
    const { data: lasterGrunnlagStatus } = useSjekkLasterGrunnlag(behandlingId);
    const isGrunnlagLoading = behandling.lasterGrunnlag || lasterGrunnlagStatus?.lasterGrunnlag;

    const queryClient = useQueryClient();

    // Invalidate behandling query when lasterGrunnlag becomes false
    useEffect(() => {
        if (
            shouldShowGrunnlagLoadingProgressbar(activeStep) &&
            lasterGrunnlagStatus &&
            !lasterGrunnlagStatus.lasterGrunnlag &&
            behandling.lasterGrunnlag &&
            behandlingId
        ) {
            console.log("Invalidates behandling query when lasterGrunnlag becomes false");
            queryClient.invalidateQueries({ queryKey: QueryKeys.behandlingV2(behandlingId, vedtakId) });
            queryClient.refetchQueries({ queryKey: QueryKeys.behandlingV2(behandlingId, vedtakId), type: "active" });
        }
    }, [
        activeStep,
        lasterGrunnlagStatus?.lasterGrunnlag,
        behandling.lasterGrunnlag,
        queryClient,
        behandlingId,
        vedtakId,
    ]);

    // Sync activeStep state with URL search params
    useEffect(() => {
        const stepFromUrl = (searchParams.get(behandlingQueryKeys.steg) ?? defaultStep) as stepDef;
        if (stepFromUrl !== activeStep) {
            setActiveStepState(stepFromUrl);
        }
    }, [searchParams, defaultStep]);

    const location = useLocation();
    const navigate = useNavigate();
    const setActiveStep = useCallback(
        (x: number, query?: Record<string, string>, hash?: string) => {
            const stepKey = Object.keys(steps).find((k) => steps[k] === x);

            // Bruker `URLSearchParams` sitt `set`/`delete` fremfor manuell streng-bygging - den
            // gamle løsningen produserte f.eks. den ugyldige verdien "undefined" (som streng) i
            // URL-en når et query-felt (som `tab`/`saksnummer`) var `undefined`, noe som kunne
            // hindre sidemenyen/SakHeader fra å synkronisere seg korrekt mot riktig steg/sak.
            const params = getAllSearchParamsExcludingKeys(
                behandlingQueryKeys.steg,
                behandlingQueryKeys.tab,
                behandlingQueryKeys.saksnummer,
            );
            if (stepKey) {
                params.set(behandlingQueryKeys.steg, stepKey);
            }
            if (query) {
                Object.entries(query).forEach(([key, value]) => {
                    if (value === undefined || value === null) {
                        params.delete(key);
                    } else {
                        params.set(key, value);
                    }
                });
            }

            // Update state immediately for responsive UI
            if (stepKey) {
                setActiveStepState(stepKey as stepDef);
            }
            trackTabNavigation(query?.tab);
            const searchString = params.toString();
            navigate({ pathname: location.pathname, search: searchString ? `?${searchString}` : "", hash: hash ?? "" });
        },
        [location, steps],
    );
    const mutationStatus = useMutationStatus(behandlingId);
    const [debouncing, setDebouncingState] = useState<boolean>(false);
    const debouncingRef = useRef(false);
    const setDebouncing = useCallback<React.Dispatch<React.SetStateAction<boolean>>>((value) => {
        const nextValue = typeof value === "function" ? value(debouncingRef.current) : value;
        debouncingRef.current = nextValue;
        setDebouncingState(nextValue);
    }, []);
    const [mutating, setMutating] = useState<boolean>(false);
    const [mutationStatusDerived, setMutationStatusDerived] = useState<string>("idle");
    const [navigatingToNextPage, setNavigatingToNextPage] = useState<boolean>(false);
    const [navigatingToNextTab, setNavigatingToNextTab] = useState<boolean>(false);

    const queryLesemodus = searchParams.get(behandlingQueryKeys.lesemodus) === "true";
    const [nextStep, setNextStep] = useState<number>(undefined);
    // Beholder `query`/`hash` fra det opprinnelige `onStepChange`-kallet slik at de ikke går tapt
    // når selve navigeringen utsettes (f.eks. mens en mutasjon pågår eller brukeren må bekrefte
    // ulagrede endringer) - uten dette hoppet man til riktig steg, men mistet `tab`/`saksnummer`.
    const [nextQuery, setNextQuery] = useState<Record<string, string>>(undefined);
    const [nextHash, setNextHash] = useState<string>(undefined);
    const [nextTab, setNextTab] = useState<string>(undefined);
    const ref = useRef<HTMLDialogElement>(null);
    const erVirkningstidspunktNåværendeMånedEllerFramITid = isAfterEqualsDate(
        dateOrNull(behandling.virkningstidspunktV3.eldsteVirkningstidspunkt),
        firstDayOfMonth(new Date()),
    );

    const onConfirm = () => {
        ref.current?.close();
        setActiveStep(nextStep, nextQuery, nextHash);
        setPageErrorsOrUnsavedState({ ...pageErrorsOrUnsavedState, [activeStep]: { error: false } });
    };

    useEffect(() => {
        const roller = behandling.roller ?? [];
        const rolleDetaljer = roller.map(toRolleDetaljer);
        if (roller.length === 0) {
            setSelectedSaksnummer(undefined);
            setSelectedRoller([]);
            return;
        }

        const uniqueSaksnummer = Array.from(new Set(roller.map((rolle) => rolle.saksnummer)));

        if (uniqueSaksnummer.length <= 1) {
            setSelectedSaksnummer(uniqueSaksnummer[0]);
            setSelectedRoller(rolleDetaljer);
            return;
        }

        setSelectedSaksnummer((currentSaksnummer) => {
            if (currentSaksnummer && uniqueSaksnummer.includes(currentSaksnummer)) {
                return currentSaksnummer;
            }
            return undefined;
        });

        setSelectedRoller((currentRoller) => {
            if (currentRoller.length === 0) {
                return rolleDetaljer;
            }

            const syncedRoller = currentRoller.filter((currentRolle) =>
                roller.some((rolle) => rolle.id === currentRolle.id),
            );
            return syncedRoller.length > 0 ? syncedRoller : rolleDetaljer;
        });
    }, [behandling.roller]);

    useEffect(() => {
        if (mutating) {
            setMutationStatusDerived("pending");
        } else if (mutating === false && mutationStatus === "success") {
            setMutationStatusDerived("success");
        } else if (mutating === false && mutationStatus === "error") {
            setMutationStatusDerived("error");
        } else {
            setMutationStatusDerived(mutationStatus);
        }
    }, [mutationStatus, debouncing, mutating, setMutationStatusDerived, mutationStatusDerived]);

    const setActiveTab = useCallback(
        (nextTab: string) => {
            setCurrentTab(pageTabs.find((tab) => tab.id === nextTab));
            setSearchParams((params) => {
                params.set(urlSearchParams.tab, nextTab);
                return params;
            });
        },
        [setSearchParams, pageTabs, currentTab],
    );

    useEffect(() => {
        const isTransitionBlocked = mutating || mutationStatusDerived === "pending" || debouncing;
        if (isTransitionBlocked) {
            return;
        }

        if (navigatingToNextPage) {
            if (mutationStatusDerived !== "error") {
                setActiveStep(nextStep, nextQuery, nextHash);
            }
            setNavigatingToNextPage(false);
        }

        if (navigatingToNextTab) {
            if (mutationStatusDerived !== "error") {
                setActiveTab(nextTab);
            }
            setNavigatingToNextTab(false);
        }
    }, [
        mutating,
        mutationStatusDerived,
        debouncing,
        navigatingToNextPage,
        navigatingToNextTab,
        nextStep,
        nextQuery,
        nextHash,
        nextTab,
        setNavigatingToNextTab,
        setNavigatingToNextPage,
        setActiveStep,
        setActiveTab,
    ]);

    const onNavigateToTab = useCallback(
        (nextTab: string) => {
            if (mutating || mutationStatusDerived === "pending" || debouncingRef.current) {
                setNavigatingToNextTab(true);
                setNextTab(nextTab);
            } else {
                setActiveTab(nextTab);
            }
            console.log("Navigating to tab 1", nextTab);
            trackTabNavigation(nextTab);
        },
        [mutating, mutationStatusDerived, setNavigatingToNextTab, setNextTab, setActiveTab],
    );
    const getPreviousStep = (currentStep: BarnebidragStepper | ForskuddStepper | SærligeutgifterStepper) => {
        const currentStepIndex = sideMenu.findIndex((step) => step.step === currentStep);
        const firstPreviousInteractiveButton = (() => {
            for (let i = currentStepIndex - 1; i >= 0; i--) {
                const step = sideMenu[i];
                if (step?.visible && step.interactive) return step;
            }
            return undefined;
        })();

        return firstPreviousInteractiveButton ? stepsIndex[firstPreviousInteractiveButton.step] : undefined;
    };

    const getNextStep = (currentStep: BarnebidragStepper | ForskuddStepper | SærligeutgifterStepper) => {
        const currentStepIndex = sideMenu.findIndex((step) => step.step === currentStep);
        const firstNextInteractiveButton = sideMenu
            .toSpliced(0, currentStepIndex + 1)
            .find((step) => step.visible && step.interactive);

        return firstNextInteractiveButton ? stepsIndex[firstNextInteractiveButton.step] : undefined;
    };
    function getFirstNumericalValue(input: string): number | null {
        const match = input.match(/-?\d+([.,]\d+)?/);
        if (!match) {
            return null;
        }

        return Number(match[0].replace(",", ".").replace("-", ""));
    }
    const trackTabNavigation = (tabIdentifier?: string) => {
        try {
            if (environment.system.sporingEnabled) {
                if (!tabIdentifier) return;
                const tabRoleIndex = getFirstNumericalValue(tabIdentifier);
                const rolle = behandling.roller.find((r) => r.id.toString() === tabRoleIndex?.toString());

                window.faro?.api.pushEvent("undersidenavigering", {
                    side: String(activeStep),
                    rolle: String(rolle?.rolletype ?? tabIdentifier),
                });
            }
        } catch (e) {
            console.warn("Faro tracking failed", e);
            // Do nothing, tracking is not critical and should not cause errors if it fails
        }
    };
    const trackStep = (stepIndex: number, currentStep: stepDef) => {
        try {
            if (environment.system.sporingEnabled) {
                const nextStep = Object.keys(steps).find((k) => steps[k] === stepIndex);
                if (nextStep !== currentStep) {
                    window.faro?.api.pushEvent("sidenavigering", {
                        navigerTilSide: String(nextStep),
                        navigerFraSide: String(currentStep),
                    });
                }
            }
        } catch (e) {
            console.warn("Faro tracking failed", e);
            // Do nothing, tracking is not critical and should not cause errors if it fails
        }
    };
    const onStepChange = useCallback(
        (x: number, query?: Record<string, string>, hash?: string) => {
            const currentPageErrors = pageErrorsOrUnsavedState[activeStep];
            setPageTabs(() => []); // Clear tabs when changing step to prevent showing incorrect tabs during transition
            trackStep(x, activeStep);
            console.log("Attempting to change step", {
                currentPageErrors,
                navigatingToNextPage,
                mutationStatusDerived,
                mutating,
                mutationStatus,
                debouncing,
                activeStep,
                x,
            }); // Log step change attempt with relevant state

            console.log(currentPageErrors, "currentPageErrors", pageErrorsOrUnsavedState[activeStep]); // Log current page errors for debugging
            if (
                currentPageErrors &&
                (currentPageErrors.error ||
                    (currentPageErrors.openFields && Object.values(currentPageErrors.openFields).some((open) => open)))
            ) {
                setNextStep(x);
                setNextQuery(query);
                setNextHash(hash);
                ref.current?.showModal();
            } else if (mutating || mutationStatusDerived === "pending" || debouncingRef.current) {
                setNavigatingToNextPage(true);
                setNextStep(x);
                setNextQuery(query);
                setNextHash(hash);
            } else {
                setActiveStep(x, query, hash);
            }
        },
        [
            setActiveStep,
            pageErrorsOrUnsavedState,
            ref.current,
            mutating,
            mutationStatusDerived,
            pageTabs,
            setPageTabs,
            setActiveStep,
            setNextStep,
            setNextQuery,
            setNextHash,
            setNavigatingToNextPage,
            setNextStep,
            activeStep,
        ],
    );

    const value = React.useMemo(
        () => ({
            activeStep,
            behandlingId,
            enhet,
            vedtakId,
            beregnetGebyrErEndret,
            erVirkningstidspunktNåværendeMånedEllerFramITid,
            type: behandling.type,
            lesemodus:
                vedtaksperre ||
                vedtakId != null ||
                behandling.erVedtakFattet ||
                behandling.erDelvedtakFattet ||
                queryLesemodus ||
                behandling.kanBehandlesINyLøsning === false ||
                (behandling.vedtakstype === Vedtakstype.ALDERSJUSTERING &&
                    !behandling.erVedtakUtenBeregning &&
                    activeStep === BarnebidragStepper.UNDERHOLDSKOSTNAD),
            erVedtakFattet: behandling.erVedtakFattet,
            saksnummer,
            selectedSaksnummer,
            selectedRoller,
            errorMessage,
            errorModalOpen,
            pageErrorsOrUnsavedState,
            sideMenu,
            setPageErrorsOrUnsavedState,
            pendingTransitionState:
                (navigatingToNextPage || navigatingToNextTab) && (mutationStatusDerived === "pending" || debouncing),
            setErrorModalOpen,
            setErrorMessage,
            setSaveErrorState,
            setSelectedSaksnummer,
            setSelectedRoller,
            onConfirm,
            onStepChange,
            setDebouncing,
            setMutating,
            setBeregnetGebyrErEndret,
            onNavigateToTab,
            getNextStep,
            getPreviousStep,
            currentTab,
            pageTabs,
            setPageTabs,
            setCurrentTab,
            vurderSeparatSamvær,
            setVurderSeparatSamvær,
            setVurderSeparatSamværForSaker,
            vurderSeparatVirkningstidspunkt,
            setVurderSeparatVirkningstidspunkt,
            setVurderSeparatVirkningstidspunktForSaker,
            isGrunnlagLoading,
        }),
        [
            activeStep,
            behandlingId,
            vedtakId,
            erVirkningstidspunktNåværendeMånedEllerFramITid,
            saksnummer,
            selectedSaksnummer,
            selectedRoller,
            errorMessage,
            errorModalOpen,
            JSON.stringify(pageErrorsOrUnsavedState),
            queryLesemodus,
            pageTabs,
            setPageTabs,
            currentTab,
            setPageTabs,
            behandling.erVedtakFattet,
            behandling.vedtakstype,
            behandling.erVedtakUtenBeregning,
            behandling.kanBehandlesINyLøsning,
            behandling.virkningstidspunktV3.eldsteVirkningstidspunkt,
            navigatingToNextPage,
            navigatingToNextTab,
            mutationStatusDerived,
            mutating,
            debouncing,
            JSON.stringify(sideMenu),
            vurderSeparatSamvær,
            vurderSeparatVirkningstidspunkt,
            isGrunnlagLoading,
            searchParams,
        ],
    );

    return (
        <BehandlingContext.Provider value={value}>
            <ConfirmationModal
                ref={ref}
                closeable
                description={getPageErrorTexts().description}
                heading={
                    <Heading size="small" className="flex gap-x-1.5 items-center">
                        <XMarkOctagonFillIcon
                            title="a11y-title"
                            fontSize="1.5rem"
                            color="var(--ax-text-danger-decoration)"
                        />
                        {getPageErrorTexts().title}
                    </Heading>
                }
                footer={
                    <>
                        <Button type="button" onClick={() => ref.current?.close()} size="small">
                            {text.label.tilbakeTilUtfylling}
                        </Button>
                        <Button type="button" variant="secondary" size="small" onClick={onConfirm}>
                            {text.label.gåVidereUtenÅLagre}
                        </Button>
                    </>
                }
            />
            <ErrorConfirmationModal
                onConfirm={saveErrorState?.retryFn}
                onCancel={saveErrorState?.rollbackFn}
                onClose={() => setSaveErrorState({ error: false })}
                open={saveErrorState?.error}
            />
            <UserFeedbackDialog />
            {children}
        </BehandlingContext.Provider>
    );
}
function useBehandlingProviderExists() {
    const context = useContext(BehandlingContext);
    return !!context;
}

function useBehandlingProvider() {
    const context = useContext(BehandlingContext);
    if (!context) {
        throw new Error("useBehandlingProvider must be used within a BehandlingProvider");
    }
    return context;
}

export { BehandlingProvider, useBehandlingProvider, useBehandlingProviderExists };
