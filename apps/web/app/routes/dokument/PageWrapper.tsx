import "../index.less";
import "../index.css";
import "../variables.less";

import React, {PropsWithChildren, ReactElement, useEffect} from "react";

import {ErrorBoundaryWrapper} from "./common/components/errorhandling/ErrorBoundary";
import {showErrorPage} from "./common/components/errorhandling/ErrorUtils";
import FeilmeldingVeilederPanel from "./common/components/feilmelding/FeilmeldingVeilederPanel";
import PageLoadingSpinner from "./common/components/loadingspinner/PageLoadingSpinner";
import {useQuery} from "./common/hooks/useQuery";
import {LocalStorage} from "./common/utils/SecuritySessionUtils";
import {AppProvider, useAppContext} from "./store/AppContext";
import {JournalpostProvider} from "./store/JournalpostContext";
import {SearchProvider} from "./store/SearchContext";
import CustomError from "./types/api/CustomError";

export enum PageType {
    REGISTRER_JOURNALPOST,
    VIS_JOURNALPOST,
    OPEN_DOCUMENT,
}

if (process.env.NODE_ENV === "development" && process.env.ENABLE_MOCK == "true") {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const {worker} = require("../mock/browser");
    worker
        .start({
            onUnhandledRequest: "warn",
            waitUntilReady: true,
            serviceWorker: {
                url: `/api/external/assets/?url=http://localhost:8081/mockServiceWorker.js`,
                options: {
                    scope: "/",
                },
            },
        })
        .then(console.log)
        .catch((e: Error) => console.log(e));
}

interface PageWrapperProps {
    sessionState: string;
    paloggetEnhet: string;
    journalpostId?: string;
    saksnummer?: string;
    page: PageType;
    ignoreEnhet?: boolean;
}

export default function PageWrapper(props: PropsWithChildren<PageWrapperProps>): ReactElement {
    const {children, ...otherProps} = props;

    useEffect(() => {
        window.onunload = () => LocalStorage.reset();
        if (props.ignoreEnhet !== true && (props.paloggetEnhet === null || props.paloggetEnhet === "null")) {
            showErrorPage(
                new CustomError(
                    "UserError",
                    "",
                    "Mangler pålogget enhet på url. " +
                    "Dette blir lagt til hvis bruker ble videresendt fra Bisys. " +
                    "Hvis bruker har gjort noe endringer på URL så bør ikke enhet= fjernes fra URL da denne informasjonen blir brukt under registrering av avvik",
                    ""
                )
            );
        }
        /*
        if (!environment.system.isTest) {
            console.log("### Using ENVIRONMENT VARIABLES #### ", environment);
        }*/
    }, []);

    return (
        <AppProvider>
            <JournalpostProvider>
                <SearchProvider>
                    <FeilmeldingVeilederPanel>
                        <ErrorBoundaryWrapper>
                            <PageStateWrapper {...otherProps}>{children}</PageStateWrapper>
                        </ErrorBoundaryWrapper>
                    </FeilmeldingVeilederPanel>
                </SearchProvider>
            </JournalpostProvider>
        </AppProvider>
    );
}

function PageStateWrapper(props: PropsWithChildren<PageWrapperProps>): ReactElement {
    const {
        updateAppState,
        appState: {journalpostId},
    } = useAppContext();

    useEffect(() => {
        console.log("PageStateWrapper", props);
        updateAppState({
            journalpostId: props.journalpostId,
            saksnummer: props.saksnummer,
            sessionState: props.sessionState,
            påloggetEnhet: props.paloggetEnhet,
            currentPage: props.page,
            disableJournalpostPoller: useQuery()["disablePolling"] == "true",
        });
    }, []);

    return (
        <React.Suspense fallback={<PageLoadingSpinner/>}>
            {journalpostId ? props.children : <PageLoadingSpinner/>}{" "}
        </React.Suspense>
    );
}
