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
    const { bisysUrl } = useBisysLink();
    const returLink = useReturLink();

    // Når brukeren er rutet hit fra en annen side i appen, peker tilbakelenken dit i stedet for til Bisys.
    if (returLink) {
        return (
            <a style={LENKE_STYLE} href={returLink.href}>
                Tilbake til {returLink.label}
            </a>
        );
    }

    if (!bisysUrl) {
        return null;
    }

    return (
        <a style={LENKE_STYLE} href={bisysUrl}>
            Tilbake til bisys
        </a>
    );
}
