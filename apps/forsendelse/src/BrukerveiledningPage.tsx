import { scrollToHash } from "@bidrag/common/utils/WindowUtils";
import { HGrid, HStack } from "@navikt/ds-react";
import { useEffect } from "react";
import Brukerveiledning from "./docs/Brukerveiledning.mdx";
import PageWrapper from "./pages/PageWrapper";

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
