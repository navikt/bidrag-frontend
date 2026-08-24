import { ExternalLinkIcon } from "@navikt/aksel-icons";
import { Link } from "@navikt/ds-react";

import environment from "../../../environment";

type ModiaLinkProps = {
    ident: string;
};
export default function ModiaLink({ ident }: ModiaLinkProps) {
    const modiaLenke = `${environment.url.modiaPerson}?sokFnr=${ident}`;

    return (
        <Link href={modiaLenke} target="_blank" className="font-ax-bold">
            Modia <ExternalLinkIcon aria-hidden />
        </Link>
    );
}
