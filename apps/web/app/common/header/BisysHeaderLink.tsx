import { useBisysLink } from "@bidrag/common";
import { Link } from "@navikt/ds-react";
import { Link as RouterLink } from "react-router";
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
 * Både `useReturLink` og `useBisysLink` leser `sessionStorage` (via `getBisysSessionParams`), som
 * ikke finnes på serveren. Rendres de under SSR, bygger server og klient ulik `href`, og React
 * avbryter hydreringen av treet med "some attributes of the server rendered HTML didn't match".
 * Derfor gates hele lenken bak `ClientOnly`, slik at den først rendres når klienten er montert.
 */
export default function BisysHeaderLink() {
    return (
        <ClientOnly>
            <BisysHeaderLinkInnhold />
        </ClientOnly>
    );
}

function BisysHeaderLinkInnhold() {
    const returLink = useReturLink();

    // Når brukeren er rutet hit fra en annen side i appen, peker tilbakelenken dit i stedet for til Bisys.
    if (returLink) {
        return (
            <Link as={RouterLink} style={LENKE_STYLE} to={returLink.href}>
                Tilbake til {returLink.label}
            </Link>
        );
    }

    return <BisysFallbackLink />;
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
            linkLabel = "Tilbake til oppgaveliste";
    }

    return (
        <Link as={RouterLink} style={LENKE_STYLE} to={bisysUrl}>
            {linkLabel}
        </Link>
    );
}
