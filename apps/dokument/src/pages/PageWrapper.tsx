import { Loader } from "@navikt/ds-react";
import { type PropsWithChildren, type ReactElement, Suspense, useEffect } from "react";

import { ErrorBoundaryWrapper } from "../common/components/errorhandling/ErrorBoundary";
import FeilmeldingVeilederPanel from "../common/components/feilmelding/FeilmeldingVeilederPanel";
import PageLoadingSpinner from "../common/components/loadingspinner/PageLoadingSpinner";
import { AppProvider, type PageType, useAppContext } from "../store/AppContext";
import { JournalpostProvider } from "../store/JournalpostContext";
import { SearchProvider } from "../store/SearchContext";

interface PageWrapperProps {
    sessionState?: string;
    paloggetEnhet?: string;
    journalpostId?: string;
    saksnummer?: string;
    page: PageType;
    disablePolling?: boolean;
}

/**
 * Felles ramme rundt dokumentsidene. `bidrag-dokument-ui`-klassen scoper det migrerte
 * legacy-stilarket (`src/styles.css`) slik at det ikke lekker ut i resten av bidrag-frontend.
 */
export default function PageWrapper(props: PropsWithChildren<PageWrapperProps>): ReactElement {
    const { children, ...otherProps } = props;

    return (
        <div className="bidrag-dokument-ui w-full">
            <AppProvider>
                <Suspense fallback={<PageLoadingSpinner />}>
                    <JournalpostProvider>
                        <SearchProvider>
                            <FeilmeldingVeilederPanel>
                                <ErrorBoundaryWrapper>
                                    <PageStateWrapper {...otherProps}>{children}</PageStateWrapper>
                                </ErrorBoundaryWrapper>
                            </FeilmeldingVeilederPanel>
                        </SearchProvider>
                    </JournalpostProvider>
                </Suspense>
            </AppProvider>
        </div>
    );
}

function PageStateWrapper(props: PropsWithChildren<PageWrapperProps>): ReactElement {
    const {
        updateAppState,
        appState: { journalpostId },
    } = useAppContext();

    useEffect(() => {
        updateAppState({
            journalpostId: props.journalpostId,
            saksnummer: props.saksnummer,
            sessionState: props.sessionState,
            påloggetEnhet: props.paloggetEnhet,
            currentPage: props.page,
            disableJournalpostPoller: props.disablePolling === true,
        });
    }, [props.journalpostId, props.saksnummer, props.sessionState, props.paloggetEnhet, props.disablePolling]);

    return (
        <Suspense fallback={<PageLoadingSpinner />}>
            {journalpostId ? props.children : <Loader size="xsmall" title="Laster..." />}
        </Suspense>
    );
}
