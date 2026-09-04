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
                    <Suspense fallback={<RolleCardSkeleton />}>
                        <RolleCard rolle={rolle} />
                    </Suspense>
                </Box>
            ))}
        </Box>
    );
};

export default ExpandedRoles;
