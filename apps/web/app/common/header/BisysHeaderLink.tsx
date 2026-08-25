import { Link } from "@navikt/ds-react";
import { Link as RouterLink } from "react-router";
import { useBisysLink } from "~/common/bisys/useBisysLink.ts";
import { ClientOnly } from "~/common/ClientOnly.tsx";
import { useReturLink } from "~/common/navigation/returLink.ts";

const LENKE_STYLE = {
    color: "white",
    justifySelf: "end",
    textAlign: "center",
    alignSelf: "center",
    padding: "0 var(--ax-space-20)",
} as const;

/**
 * `useReturLink` bygger kun på URL-en (`useLocation`/`useSearchParams`) og er derfor trygg å
 * rendre på serveren - i motsetning til `useBisysLink`, som leser `sessionStorage` og ville gitt
 * hydration-mismatch. Vi gater derfor kun bisys-fallbacken bak `ClientOnly`, slik at tilbakelenken
 * vises med en gang (også under SSR/hydrering) når vi faktisk har et returmål, i stedet for at hele
 * knappen forsvinner helt til klienten er ferdig montert.
 */
export default function BisysHeaderLink() {
    const returLink = useReturLink();

    // Når brukeren er rutet hit fra en annen side i appen, peker tilbakelenken dit i stedet for til Bisys.
    if (returLink) {
        return (
            <Link as={RouterLink} style={LENKE_STYLE} to={returLink.href}>
                Tilbake til {returLink.label}
            </Link>
        );
    }

    return (
        <ClientOnly>
            <BisysFallbackLink />
        </ClientOnly>
    );
}

function BisysFallbackLink() {
    const { bisysUrl, bisysLinkTarget } = useBisysLink();

    if (!bisysUrl) {
        return null;
    }

    let linkLabel: string;
    switch (bisysLinkTarget) {
        case "sakshistorikk":
            linkLabel = "Tilbake til sakshistorikk";
            break;
        case "sak":
            linkLabel = "Tilbake til sak";
            break;
        case "oppgaveliste":
            linkLabel = "Tilbake til oppgaveliste";
            break;
        default:
            linkLabel = "Tilbake til bisys";
    }

    return (
        <Link as={RouterLink} style={LENKE_STYLE} to={bisysUrl}>
            {linkLabel}
        </Link>
    );
}
