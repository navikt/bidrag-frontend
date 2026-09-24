import { ExternalLinkIcon } from "@navikt/aksel-icons";
import { Link } from "@navikt/ds-react";

type ModiaLinkProps = {
    ident: string;
    className?: string;
    compact?: boolean;
};

/**
 * Lenke til personen i Modia. Går via `/modia/person`-redirect-ruten i
 * apps/web, som slår opp MODIA_URL på serveren.
 */
export default function ModiaLink({ ident, className, compact = false }: ModiaLinkProps) {
    return (
        <Link
            href={`/modia/person?sokFnr=${ident}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Åpne personen i Modia"
            aria-label="Åpne personen i Modia"
            className={className}
        >
            {compact ? (
                "m"
            ) : (
                <>
                    Modia <ExternalLinkIcon aria-hidden />
                </>
            )}
        </Link>
    );
}
