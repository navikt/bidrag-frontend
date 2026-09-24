import { BodyLong, Loader, VStack } from "@navikt/ds-react";
import { useFlag } from "@unleash/proxy-client-react";
import { Suspense } from "react";

import type { SakSideTittelHandle } from "~/routes/sak/sakSideTittel";
import type { Route } from "./+types/SaksrollerPage.ts";
import SakErrorBoundary from "./SakErrorBoundary.tsx";
import SaksrollerVisning from "./SaksrollerVisning.tsx";

export const handle: SakSideTittelHandle = { sakSideTittel: "Saksroller" };

export default function SaksrollerPage({ params }: Route.ComponentProps) {
    const visNyRollebilde = useFlag("bisys.ny_rollebilde");
    const saksnummer = params.saksnummer;
    const tabTitle = `Saksroller - ${saksnummer}`;

    if (!visNyRollebilde) {
        throw new Error("Saksroller er ikke tilgjengelig");
    }

    return (
        <>
            <title>{tabTitle}</title>
            <SakErrorBoundary saksnummer={saksnummer}>
                <Suspense
                    fallback={
                        <VStack align="center" justify="center" gap="space-12" minHeight="100vh">
                            <Loader size="2xlarge" title="Laster sak..." />
                            <BodyLong>Laster sak</BodyLong>
                        </VStack>
                    }
                >
                    <SaksrollerVisning saksnummer={saksnummer} />
                </Suspense>
            </SakErrorBoundary>
        </>
    );
}
