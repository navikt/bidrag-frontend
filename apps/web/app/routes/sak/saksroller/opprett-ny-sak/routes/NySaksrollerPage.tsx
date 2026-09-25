import { Box } from "@navikt/ds-react";
import { useFlag } from "@unleash/proxy-client-react";
import OpprettSakFlyt from "../start/OpprettSakFlyt";

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
