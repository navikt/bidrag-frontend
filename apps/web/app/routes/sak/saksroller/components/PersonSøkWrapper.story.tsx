import { BidragCommonsProviderMock } from "@bidrag/common/playwright/testing/BidragCommonsProviderMock.tsx";
import { useTestQueryClient } from "@ct/saksroller/useTestQueryClient.ts";
import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import PersonSøkWrapper, { PersonSøkInnhold } from "./PersonSøkWrapper.tsx";

function StandardScenario() {
    const queryClient = useTestQueryClient();
    const [vis, setVis] = useState(true);

    if (!vis) {
        return <p>Søk avbrutt</p>;
    }

    return (
        <QueryClientProvider client={queryClient}>
            <BidragCommonsProviderMock>
                <PersonSøkWrapper tittel="Legg til person" onAvbryt={() => setVis(false)}>
                    <PersonSøkInnhold
                        beskrivelse="Søk opp personen som skal legges til"
                        søkeLabel="Søk etter person"
                        onPersonValgt={() => undefined}
                    />
                </PersonSøkWrapper>
            </BidragCommonsProviderMock>
        </QueryClientProvider>
    );
}

export const Standard = () => <StandardScenario />;
