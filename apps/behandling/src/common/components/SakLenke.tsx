import { ExternalLinkIcon } from "@navikt/aksel-icons";
import { Link } from "@navikt/ds-react";

import environment from "../../environment";

export default function SakLenke({ saksnummer }: { saksnummer: string }) {
    if (!saksnummer) return null;
    return (
        <Link href={`${environment.url.bisysSak}?saksnr=${saksnummer}`} target="_blank">
            {saksnummer} <ExternalLinkIcon aria-hidden />
        </Link>
    );
}
