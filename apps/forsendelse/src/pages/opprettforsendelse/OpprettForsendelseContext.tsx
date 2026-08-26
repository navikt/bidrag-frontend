import type { Engangsbeloptype, SoktAvType, Stonadstype, Vedtakstype } from "@bidrag/api/BidragForsendelseApi";
import { Alert } from "@navikt/ds-react";
import { createContext, type PropsWithChildren, useContext, useState } from "react";
import { useHentRoller } from "../../hooks/useForsendelseApi";

export interface IOpprettForsendelseProviderProps {
    vedtakType: Vedtakstype;
    soknadType: string;
    erFattetBeregnet?: boolean;
    erVedtakIkkeTilbakekreving?: boolean;
    engangsBelopType: Engangsbeloptype;
    stonadType: Stonadstype;
    behandlingType: string;
    soknadFra: SoktAvType;
    soknadId?: string;
    vedtakId?: string;
    behandlingId?: string;
    enhet?: string;
    barnObjNr?: string[];
}

export interface IOpprettForsendelsePropsContext {
    soknadType: string;
    behandlingType: string;
    engangsBelopType: Engangsbeloptype;
    stonadType: Stonadstype;
    vedtakType: Vedtakstype;
    erFattetBeregnet?: boolean;
    erVedtakIkkeTilbakekreving?: boolean;
    soknadFra: SoktAvType;
    enhet?: string;
    soknadId?: string;
    vedtakId?: string;
    behandlingId?: string;
    barn?: string[];
}

export const OpprettForsendelseContext = createContext<IOpprettForsendelsePropsContext>(
    {} as IOpprettForsendelsePropsContext,
);

function OpprettForsendelseProvider({
    children,
    behandlingType,
    ...otherProps
}: PropsWithChildren<IOpprettForsendelseProviderProps>) {
    const [errors] = useState<string[]>([]);
    const roller = useHentRoller();

    // useEffect(() => {
    //     const tempErrors = [];
    //     if (ObjectUtils.isEmpty(otherProps.vedtakType)) {
    //         tempErrors.push("Behandlingtype må settes");
    //     }
    //     if (ObjectUtils.isEmpty(otherProps.soknadFra)) {
    //         tempErrors.push("Søknadfra må settes");
    //     }
    //     if (ObjectUtils.isEmpty(otherProps.stonadType)) {
    //         tempErrors.push("Søknadtype må settes");
    //     }
    //     setErrors(tempErrors);
    // }, []);

    function isSameRole(urlObjNr: string, rolleObjNr: string) {
        return urlObjNr === rolleObjNr || isEqualByIntIgnoreError(urlObjNr, rolleObjNr);
    }

    function isEqualByIntIgnoreError(valueA: string, valueB: string) {
        try {
            return parseInt(valueA, 10) === parseInt(valueB, 10);
        } catch {
            return false;
        }
    }
    if (errors.length > 0) {
        return <Alert variant="error">{errors.join(", ")}</Alert>;
    }
    return (
        <OpprettForsendelseContext.Provider
            value={{
                ...otherProps,
                barn: otherProps.barnObjNr?.map(
                    (objNr) => roller.find((rolle) => isSameRole(rolle.objektnummer, objNr))?.ident,
                ),
                behandlingType: behandlingType ?? otherProps.stonadType ?? otherProps.engangsBelopType,
            }}
        >
            {children}
        </OpprettForsendelseContext.Provider>
    );
}
function useOpprettForsendelse() {
    const context = useContext(OpprettForsendelseContext);
    if (context === undefined) {
        throw new Error("useOpprettForsendelse must be used within a OpprettForsendelseProvider");
    }
    return context;
}

export { OpprettForsendelseProvider, useOpprettForsendelse };
