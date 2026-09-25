import { useCallback, useEffect, useRef, useState } from "react";

export function useSaksrollerStatus(harÅpneRedigeringer: boolean) {
    const [feilmelding, setFeilmelding] = useState<string | null>(null);
    const [valideringsFeil, setValideringsFeil] = useState<string | null>(null);
    const [suksessmelding, setSuksessmelding] = useState<string | null>(null);
    const [statusResetKey, setStatusResetKey] = useState(0);
    const statusRef = useRef<HTMLDivElement>(null);

    const nullstillStatusmeldinger = useCallback(() => {
        setFeilmelding(null);
        setValideringsFeil(null);
        setSuksessmelding(null);
        setStatusResetKey((forrige) => forrige + 1);
    }, []);

    const forrigeHarÅpneRedigeringer = useRef(harÅpneRedigeringer);
    useEffect(() => {
        if (forrigeHarÅpneRedigeringer.current !== harÅpneRedigeringer) {
            forrigeHarÅpneRedigeringer.current = harÅpneRedigeringer;
            nullstillStatusmeldinger();
        }
    }, [harÅpneRedigeringer, nullstillStatusmeldinger]);

    useEffect(() => {
        if ((feilmelding || suksessmelding) && statusRef.current) {
            statusRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
            statusRef.current.focus();
        }
    }, [feilmelding, suksessmelding]);

    return {
        feilmelding,
        setFeilmelding,
        valideringsFeil,
        setValideringsFeil,
        suksessmelding,
        setSuksessmelding,
        statusResetKey,
        statusRef,
        nullstillStatusmeldinger,
    };
}
