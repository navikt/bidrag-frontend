import { useEffect } from "react";
import { useSearchParams } from "react-router";

/**
 * Setter `page`-søkeparameteren i URL-en (brukt av legacy Bisys for å vise
 * sidetittel). Bruker React Routers `useSearchParams` (i stedet for rå
 * `window.history.pushState`) slik at React Routers interne historikk-state
 * holdes i sync med nettleserens faktiske URL. Rå `pushState`-kall utenfor
 * React Router kan gjøre at routeren mister oversikt over gjeldende
 * lokasjon, noe som i etterkant kan tvinge frem en full sideoppdatering ved
 * neste programmatiske navigasjon.
 */
export function useUpdatePageTitleParam(value: string) {
    const [searchParams, setSearchParams] = useSearchParams();
    useEffect(() => {
        if (searchParams.get("page") === value) return;
        setSearchParams(
            (prev) => {
                const next = new URLSearchParams(prev);
                next.set("page", value);
                return next;
            },
            { replace: true },
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);
}
