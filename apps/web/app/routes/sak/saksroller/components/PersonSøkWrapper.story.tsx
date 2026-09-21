import type { PersonDto } from "@bidrag/api/PersonApi";
import { BidragCommonsProviderMock } from "@bidrag/common/playwright/testing/BidragCommonsProviderMock.tsx";
import { Button } from "@navikt/ds-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import PersonInfo from "./PersonInfo.tsx";
import PersonSøkWrapper from "./PersonSøkWrapper.tsx";

function useTestQueryClient() {
    return useMemo(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: { retry: false, staleTime: Infinity },
                    mutations: { retry: false },
                },
            }),
        [],
    );
}

function StandardScenario() {
    const queryClient = useTestQueryClient();
    const [vis, setVis] = useState(true);
    const [valgtPerson, setValgtPerson] = useState<PersonDto | null>(null);

    if (!vis) {
        return <p>Søk avbrutt</p>;
    }

    return (
        <QueryClientProvider client={queryClient}>
            <BidragCommonsProviderMock>
                <PersonSøkWrapper
                    tittel="Legg til person"
                    beskrivelse="Søk opp personen som skal legges til"
                    søkeLabel="Søk etter person"
                    onPersonValgt={setValgtPerson}
                    onAvbryt={() => setVis(false)}
                    resultat={
                        valgtPerson && (
                            <PersonInfo navn={valgtPerson.visningsnavn} ident={valgtPerson.ident} rolle="BA" />
                        )
                    }
                />
            </BidragCommonsProviderMock>
        </QueryClientProvider>
    );
}

function MedCustomActionsScenario() {
    const queryClient = useTestQueryClient();
    const [vis, setVis] = useState(true);
    const [valgtPerson, setValgtPerson] = useState<PersonDto | null>(null);
    const [lagtTil, setLagtTil] = useState(false);

    if (!vis) {
        return <p>Lukket</p>;
    }

    return (
        <QueryClientProvider client={queryClient}>
            <PersonSøkWrapper
                tittel="Legg til person"
                beskrivelse="Søk opp personen som skal legges til"
                søkeLabel="Søk etter person"
                onPersonValgt={setValgtPerson}
                onAvbryt={() => setVis(false)}
                actions={
                    <>
                        <Button type="button" size="small" disabled={!valgtPerson} onClick={() => setLagtTil(true)}>
                            Legg til
                        </Button>
                        <Button type="button" size="small" variant="secondary" onClick={() => setVis(false)}>
                            Avbryt
                        </Button>
                    </>
                }
                resultat={lagtTil && valgtPerson ? <p>{valgtPerson.visningsnavn} er lagt til</p> : null}
            />
        </QueryClientProvider>
    );
}

export const Standard = () => <StandardScenario />;

export const MedCustomActions = () => <MedCustomActionsScenario />;
