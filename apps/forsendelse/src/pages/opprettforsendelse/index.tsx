import { Loader } from "@navikt/ds-react";
import React from "react";

import ForsendelseSakHeader from "../forsendelse/components/ForsendelseSakHeader";
import PageWrapper from "../PageWrapper";
import { type IOpprettForsendelseProviderProps, OpprettForsendelseProvider } from "./OpprettForsendelseContext";
import OpprettForsendelsePage from "./OpprettForsendelsePage";

export default function ({ ...otherProps }: IOpprettForsendelseProviderProps) {
    return (
        <PageWrapper name={"opprett-forsendelse-page"}>
            <OpprettForsendelseProvider {...otherProps}>
                <div>
                    <ForsendelseSakHeader />
                    <React.Suspense fallback={<LoadingIndicator />}>
                        <OpprettForsendelsePage />
                    </React.Suspense>
                </div>
            </OpprettForsendelseProvider>
        </PageWrapper>
    );
}
function LoadingIndicator() {
    return (
        <div className="m-auto w-max flex flex-col justify-center">
            <Loader size={"3xlarge"} title={"Laster..."} className="m-auto" />
        </div>
    );
}
