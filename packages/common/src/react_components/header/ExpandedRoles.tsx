import type { RolleDto } from "@bidrag/api/BidragBehandlingApiV1";
import { Box, Skeleton } from "@navikt/ds-react";
import { Suspense } from "react";
import RolleCard from "../roller/RolleCard";

export type HeaderRolle = RolleDto & { visningsnavn?: string };

export type SaksnummerRoller = {
    saksnummer: string;
    roller: HeaderRolle[];
};

const ROLE_CARD_CONTAINER_STYLE: React.CSSProperties = {
    border: "1px solid var(--ax-border-neutral-subtle)",
    borderRadius: "0.375rem",
    background: "var(--ax-bg-default)",
    margin: "0.125rem 0.375rem",
};

const RolleCardSkeleton = () => <Skeleton variant="text" width={"220px"} height={"54px"} />;

export interface ExpandedRolesProps {
    saksnummerRoller: SaksnummerRoller | undefined;
}

/**
 * Rollekort-panelet som vises under saksnummer-fanene i `SakHeader` når et
 * saksnummer er ekspandert. Skilt ut i egen fil (fra `SakHeader.tsx`) slik at
 * den kan story-/komponenttestes isolert uten hele header-komponenten (faner,
 * flash-animasjon osv.).
 */
export const ExpandedRoles = ({ saksnummerRoller }: ExpandedRolesProps) => {
    if (!saksnummerRoller) return null;

    return (
        <Box
            style={{
                padding: "0.75rem",
                display: "flex",
                flexWrap: "wrap",
                gap: "0.5rem",
                background: "white",
            }}
            shadow="dialog"
        >
            {saksnummerRoller.roller.map((rolle) => (
                <Box key={rolle.id} style={ROLE_CARD_CONTAINER_STYLE}>
                    {/* Suspense skoperes rundt kun rollekortet (person-navn-oppslaget), ikke hele
                    SakHeader, slik at tittel/faner alltid rendres umiddelbart og kun selve
                    navnevisningen viser en liten skjelett-boks mens personoppslaget laster. */}
                    <Suspense fallback={<RolleCardSkeleton />}>
                        <RolleCard rolle={rolle} />
                    </Suspense>
                </Box>
            ))}
        </Box>
    );
};

export default ExpandedRoles;
