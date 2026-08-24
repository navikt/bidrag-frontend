import { Link } from "@navikt/ds-react";
import { Link as RouterLink } from "react-router";
import { useBisysLink } from "~/common/bisys/useBisysLink.ts";
import { useReturLink } from "~/common/navigation/returLink.ts";

const LENKE_STYLE = {
    color: "white",
    justifySelf: "end",
    textAlign: "center",
    alignSelf: "center",
    padding: "0 var(--ax-space-20)",
} as const;

export default function BisysHeaderLink() {
    const { bisysUrl, bisysLinkTarget } = useBisysLink();
    const returLink = useReturLink();
    console.log(bisysLinkTarget, returLink)

    // Når brukeren er rutet hit fra en annen side i appen, peker tilbakelenken dit i stedet for til Bisys.
    if (returLink) {
        return (
            <Link as={RouterLink} style={LENKE_STYLE} to={returLink.href}>
                Tilbake til {returLink.label}
            </Link>
        );
    }

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
