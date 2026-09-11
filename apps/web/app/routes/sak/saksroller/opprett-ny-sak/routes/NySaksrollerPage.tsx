import { Box } from "@navikt/ds-react";
import OpprettSakFlyt from "../OpprettSakFlyt";
import { SaksrolleroversiktProvider } from "../saksrolleroversiktContext";

export default function NySaksrollerPage() {
    return (
        <SaksrolleroversiktProvider>
            <Box maxWidth="64rem" marginInline="auto">
                <OpprettSakFlyt />
            </Box>
        </SaksrolleroversiktProvider>
    );
}
