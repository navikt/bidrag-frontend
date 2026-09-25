import { Box, HStack, Loader } from "@navikt/ds-react";
import { Suspense } from "react";
import { Outlet, useParams } from "react-router";
import SakMeny from "./SakMeny";

export default function SakFullbreddeLayout() {
    const { saksnummer = "" } = useParams();
    return (
        <HStack marginBlock="space-4 space-0" wrap={false} flexGrow="1" minWidth="0">
            <SakMeny saksnummer={saksnummer} />
            <Box flexGrow="1" minWidth="0">
                <Suspense fallback={<Loader size="medium" />}>
                    <Outlet />
                </Suspense>
            </Box>
        </HStack>
    );
}
