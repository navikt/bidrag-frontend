import { useFlag, useVariant } from "@unleash/proxy-client-react";
import { useEffect } from "react";
import { setKunNySakshistorikk } from "../../utils/RedirectUtils";

const TOGGLE = "bisys.ny_sakshistorikk";

/** True når gammel sakshistorikk i Bisys er skrudd av, og alle skal til sakshistorikken i denne appen. */
export function useKunNySakshistorikk(): boolean {
    const variant = useVariant(TOGGLE);
    return useFlag(TOGGLE) && variant.enabled && variant.name === "skru_av_gamle";
}

export function KunNySakshistorikkSync() {
    const kunNy = useKunNySakshistorikk();
    useEffect(() => setKunNySakshistorikk(kunNy), [kunNy]);
    return null;
}
