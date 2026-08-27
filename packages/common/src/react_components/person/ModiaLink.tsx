import { ExternalLinkIcon } from "@navikt/aksel-icons";
import { Link } from "@navikt/ds-react";

type ModiaLinkProps = {
    ident: string;
    className?: string;
};

/**
 * Lenke til personen i Modia. Går via `/modia/person`-redirect-ruten i
 * apps/web, som slår opp MODIA_URL på serveren.
 */
export default function ModiaLink({ ident, className }: ModiaLinkProps) {
    return (
        <Link
            href={`/modia/person?sokFnr=${ident}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Åpne personen i Modia"
            className={className}
        >
            Modia <ExternalLinkIcon aria-hidden />
        </Link>
    );
}
