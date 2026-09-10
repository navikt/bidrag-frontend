import type { PersonDto } from "@bidrag/api/PersonApi";
import { BodyShort, Box, Tag } from "@navikt/ds-react";
import { Suspense } from "react";
import LasterSkeleton from "./components/LasterSkeleton";
import type { PartRolle } from "./opprett-sak-schema";
import SaksrolleVelger from "./SaksrolleVelger";

type Props = {
    partISaken: PersonDto;
    rolle: PartRolle | null;
    editable: boolean;
};

const ROLLE_LABELS: Record<PartRolle, string> = {
    bidragspliktig: "Bidragspliktig",
    bidragsmottaker: "Bidragsmottaker",
    barn_over_18: "Barn over 18 år",
    barn_under_18: "Barn under 18 år",
};

export default function RolleVisning({ partISaken, rolle, editable }: Props) {
    if (editable) {
        return (
            <Suspense fallback={<LasterSkeleton tekst="Laster data..." />}>
                <SaksrolleVelger partISaken={partISaken} enforcedRolle={null} />
            </Suspense>
        );
    }

    if (!rolle) {
        return null;
    }

    return (
        <div>
            <Box asChild marginBlock="space-0 space-8">
                <BodyShort size="small" textColor="subtle">
                    Rolle i saken
                </BodyShort>
            </Box>
            <Tag variant="info" size="medium">
                {ROLLE_LABELS[rolle]}
            </Tag>
        </div>
    );
}
