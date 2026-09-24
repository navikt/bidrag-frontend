import { Box } from "@navikt/ds-react";
import { useFlag } from "@unleash/proxy-client-react";
import OpprettSakFlyt from "../OpprettSakFlyt";
import { SaksrolleroversiktProvider } from "../saksrolleroversiktContext";

export default function NySaksrollerPage() {
    const visNyRollebilde = useFlag("bisys.ny_rollebilde");

    if (!visNyRollebilde) {
        throw new Error("Saksroller er ikke tilgjengelig");
    }

    return (
        <SaksrolleroversiktProvider>
            <Box maxWidth="80rem" marginInline="auto">
                <OpprettSakFlyt />
            </Box>
        </SaksrolleroversiktProvider>
    );
}
