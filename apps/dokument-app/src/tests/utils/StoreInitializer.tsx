import { render } from "@testing-library/react";
import React, { type PropsWithChildren, type ReactElement } from "react";
import { FormProvider, useForm } from "react-hook-form";

import PageWrapper from "../../pages/PageWrapper";
import { PageType } from "../../store/AppContext";
import { JOURNALPOST_ID_TEST } from "../mockdata/journalpostMockData";
import { PALOGGET_ENHET, SAKSNUMMER, SESSION_STATE } from "../resources/testdata";
import { getDocumentBody } from "./TestDomUtils";

export function renderWithReactHookForm(children: ReactElement) {
    return <WrapperWithReactHookForm>{children}</WrapperWithReactHookForm>;
}

export function WrapperWithReactHookForm({ children }: PropsWithChildren<{}>) {
    const methods = useForm({ mode: "onChange" });
    return <FormProvider {...methods}>{children}</FormProvider>;
}

export function mountWithStoreAndReactHookForm(reactElement: ReactElement, initialState?: Partial<InitialState>) {
    return mountWithStore(renderWithReactHookForm(reactElement), initialState);
}

export interface InitialState {
    journalpostId?: string;
    saksnummer?: string;
    paloggetEnhet?: string;
    pageType?: PageType;
}

export function mountWithStore(reactElement: ReactElement, initialState?: Partial<InitialState>) {
    return render(
        <PageWrapper
            sessionState={SESSION_STATE}
            paloggetEnhet={initialState?.paloggetEnhet ?? PALOGGET_ENHET}
            journalpostId={initialState?.journalpostId ?? JOURNALPOST_ID_TEST}
            saksnummer={initialState?.saksnummer ?? SAKSNUMMER}
            page={initialState?.pageType ?? PageType.REGISTRER_JOURNALPOST}
        >
            {reactElement}
        </PageWrapper>,
        { baseElement: getDocumentBody() },
    );
}
