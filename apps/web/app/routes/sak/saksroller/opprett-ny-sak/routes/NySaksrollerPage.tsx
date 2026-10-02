import { OpprettSakFlyt } from "@bidrag/saksroller";
import { Box } from "@navikt/ds-react";
import { useFlag } from "@unleash/proxy-client-react";

export default function NySaksrollerPage() {
    const visNyRollebilde = useFlag("bisys.ny_rollebilde");

    if (!visNyRollebilde) {
        throw new Error("Saksroller er ikke tilgjengelig");
    }

    return (
        <Box maxWidth="80rem" marginInline="auto">
            <OpprettSakFlyt />
        </Box>
    );
}
