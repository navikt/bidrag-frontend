import type { PersonDto } from "@bidrag/api/PersonApi";
import { BidragCommonsProviderMock } from "@bidrag/common/playwright/testing/BidragCommonsProviderMock.tsx";
import { genererFnr } from "@bidrag/common/playwright/testing/fnrGenerator.ts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import ForeslåPersonPanel from "./ForeslåPersonPanel.tsx";

const foreslåttPerson: PersonDto = {
    ident: genererFnr(),
    visningsnavn: "Kari Nordmann",
};

function TestWrapper() {
    const queryClient = useMemo(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: { retry: false, staleTime: Infinity },
                    mutations: { retry: false },
                },
            }),
        [],
    );
    const [valgtPerson, setValgtPerson] = useState<PersonDto | null>(null);
    const [bruktForslag, setBruktForslag] = useState(false);

    return (
        <QueryClientProvider client={queryClient}>
            <BidragCommonsProviderMock>
                <ForeslåPersonPanel
                    tittel="Velg bidragsmottaker"
                    beskrivelse="Velg personen som skal være bidragsmottaker i saken"
                    variant="warning"
                    forslagNavn={foreslåttPerson.visningsnavn}
                    onBrukForslag={() => {
                        setBruktForslag(true);
                        setValgtPerson(foreslåttPerson);
                    }}
                    onVelgPerson={setValgtPerson}
                    søkLabel="Søk etter bidragsmottaker"
                />
                <output data-testid="brukt-forslag">{String(bruktForslag)}</output>
                <output data-testid="valgt-person">{valgtPerson?.visningsnavn ?? ""}</output>
            </BidragCommonsProviderMock>
        </QueryClientProvider>
    );
}

export const Standard = () => <TestWrapper />;
