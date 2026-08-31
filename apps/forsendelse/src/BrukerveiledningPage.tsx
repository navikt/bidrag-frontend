import { HGrid, HStack } from "@navikt/ds-react";
import { useEffect } from "react";

import Brukerveiledning from "./docs/Brukerveiledning.mdx";
import PageWrapper from "./pages/PageWrapper";
import { scrollToHash } from "./utils/window-utils";

export function ForsendelseBrukerveiledningPage() {
    useEffect(scrollToHash, []);

    return (
        <PageWrapper name="Forsendelse brukerveiledning">
            <HGrid>
                <HStack gap={{ xs: "space-12", md: "space-12", lg: "space-4" }}>
                    <Brukerveiledning saksbehandlerNavn={""} />
                </HStack>
            </HGrid>
        </PageWrapper>
    );
}
